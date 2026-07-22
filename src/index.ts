import pThrottle from 'p-throttle';

export type BizkitToken = {
  token: string;
  url: string;
};

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

export async function bizkit_init(production: boolean): Promise<void> {
  if (iframe && ready) return;

  src = production ? import.meta.env.TSDOWN_BIZKIT_URL : import.meta.env.TSDOWN_BIZKIT_DEV_URL;

  return new Promise((resolve, _reject) => {
    async function onload() {
      await wait(100);
      await ping();
      resolve();
    }

    iframe = document.createElement('iframe');
    iframe.src = src;
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
    channel.port1.onmessage = (msg: MessageEvent<T>) => {
      clearTimeout(timer);
      resolve(msg.data);
    };
    iframe.contentWindow?.postMessage(msg, src, [channel.port2]);
  });
}

const reliable_comm = throttle(_reliable_comm);

export async function get_bizkit_token(): Promise<BizkitToken> {
  if (!iframe || !ready) return Promise.reject('not initialized!');
  return reliable_comm<BizkitToken>({ op: 'get_bizkit_token', url: location.origin }, 2000);
}

declare global {
  function bizkit_init(production: boolean): Promise<void>;
  function get_bizkit_token(): Promise<BizkitToken>;
}
window.bizkit_init = bizkit_init;
window.get_bizkit_token = get_bizkit_token;
