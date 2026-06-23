import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createPrivateKey } from 'node:crypto';
import { listen } from 'node:quic';

import config from '../config.js';

const encoder = new TextEncoder();
const decoder = new TextDecoder();

const toText = (bytes) => decoder.decode(bytes);
const toBytes = (text) => encoder.encode(text);

const readText = async (stream) => {
  const chunks = [];
  for await (const batch of stream) {
    for (const chunk of batch) {
      chunks.push(Buffer.from(chunk));
    }
  }
  return decoder.decode(Buffer.concat(chunks));
};

const writeText = async (stream, text) => {
  const writer = stream.writer;
  await writer.write(toBytes(text));
  await writer.end();
};

const keyPath = path.join(config.CERTS_DIR, 'server.key');
const certPath = path.join(config.CERTS_DIR, 'server.crt');

const key = createPrivateKey(readFileSync(keyPath));
const cert = readFileSync(certPath);

const handleStream = async (stream) => {
  const message = await readText(stream);
  await writeText(stream, `stream echo: ${message}`);
};

const handleSession = (session) => {
  session.onstream = (stream) => {
    handleStream(stream).catch((error) => {
      console.error('stream error:', error);
      stream.destroy(error);
    });
  };

  session.ondatagram = async (datagram) => {
    const message = toText(datagram);
    const id = await session.sendDatagram(`datagram echo: ${message}`);
    console.log('datagram sent:', id.toString());
  };

  session.ondatagramstatus = (id, status) => {
    console.log('datagram status:', id.toString(), status);
  };

  session.onerror = (error) => {
    console.error('session error:', error);
  };
};

export const startQuicServer = async () => {
  const endpoint = await listen(handleSession, {
    endpoint: { address: config.QUIC_ADDRESS },
    alpn: [config.QUIC_PROTOCOL],
    sni: {
      '*': {
        keys: [key],
        certs: [cert],
      },
    },
    transportParams: {
      maxDatagramFrameSize: config.QUIC_MAX_DATAGRAM_FRAME_SIZE,
    },
  });
  console.log('QUIC server listening on', endpoint.address);
};
