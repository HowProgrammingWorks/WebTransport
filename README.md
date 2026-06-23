# WebTransport - HTTP/3 - QUIC

Minimal dependency-free HTTP/3 demo with static browser client and raw QUIC server.

## Requirements

QUIC support requires a Node.js binary built with `./configure --experimental-quic`.

## Run

```sh
npm run cert
npm start
```

Open `http://127.0.0.1:8000/` and click Connect.
