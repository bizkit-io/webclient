# bizkit.io web client

Under development.

## Development

- Install:

```bash
npm install @bizkit.io/webclient
```

- Import:

```typescript
import { type BizkitToken, bizkit_init, get_bizkit_token } from '@bizkit.io/webclient';
```

- Initialize the web client:

```typescript
await bizkit_init(false); // false for development, true for production
```

- Get a token:

```typescript
const token: BizkitToken = await get_bizkit_token();
```
