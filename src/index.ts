import pThrottle from 'p-throttle';

export type BizkitToken = {
  token: string;
  url: string;
};

type ErrorResult = {
  error: any;
  data?: never;
};

type SuccessResult<T> = {
  error?: never;
  data: T;
};

export type Result<T> = ErrorResult | SuccessResult<T>;

let host: string;
let src: string;
let iframe: HTMLIFrameElement;
let ready: boolean = false;

const throttle = pThrottle({
  limit: 1,
  interval: 50,
});

async function wait(timout: number) {
  return new Promise((resolve) => setTimeout(resolve, timout));
}

async function ping(): Promise<void> {
  if (ready) return;
  let counter = 0;
  do {
    try {
      await reliable_comm<void>({ op: 'ping' }, 50);
      ready = true;
      return;
      // eslint-disable-next-line @eslint/no-unused-vars
    } catch (_) {
      await wait(50);
    }
  } while (++counter < 10);
  return Promise.reject();
}

export async function bizkit_init(production: boolean, id: string): Promise<void> {
  if (iframe && ready) return;

  if (!id) return Promise.reject('need content provider id');

  host = production ? import.meta.env.TSDOWN_BIZKIT_URL : import.meta.env.TSDOWN_BIZKIT_DEV_URL;
  src = host + import.meta.env.TSDOWN_BIZKIT_IFRAME;

  return new Promise((resolve, reject) => {
    async function onload() {
      try {
        await wait(100);
        await ping();
        resolve();
        // eslint-disable-next-line @eslint/no-unused-vars
      } catch (_) {
        reject();
      }
    }

    iframe = document.createElement('iframe');
    iframe.src = src;
    iframe.style =
      'border:none;background-color:transparent;position:absolute;top:8px;right:8px;overflow:hidden;margin:0;';
    iframe.width = '64px';
    iframe.height = '64px';
    iframe.onload = onload;
    iframe.referrerPolicy = 'no-referrer';
    document.body.appendChild(iframe);
  });
}

function _reliable_comm<T>(msg: unknown, timeout: number): Promise<T> {
  if (!iframe) return Promise.reject('not initialized!');
  return new Promise((resolve, reject) => {
    const timer = setTimeout(reject, timeout);
    const channel = new MessageChannel();
    channel.port1.onmessage = (msg: MessageEvent<Result<T>>) => {
      clearTimeout(timer);
      if (msg.data.error) return reject(msg.data.error);
      resolve(msg.data.data!);
    };
    iframe.contentWindow?.postMessage(msg, src, [channel.port2]);
  });
}

const reliable_comm = throttle(_reliable_comm);

export async function get_bizkit_token(): Promise<BizkitToken> {
  if (!iframe || !ready) return Promise.reject('not initialized!');
  try {
    let token: BizkitToken = await reliable_comm<BizkitToken>(
      { op: 'get_bizkit_token', url: location.origin },
      30000,
    );
    const abs_url = new URL(token.url, host);
    token.url = abs_url.toString();
    return token;
    // eslint-disable-next-line @eslint/no-unused-vars @eslint/no-useless-catch
  } catch (e) {
    // TODO console.log(e);
    throw e;
  }
}
