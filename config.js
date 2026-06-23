import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));

export default {
  root,
  STATIC_DIR: path.join(root, 'static'),
  CERTS_DIR: path.join(root, 'certs'),
  HOST: '127.0.0.1',
  PORT: 8000,
  QUIC_ADDRESS: '127.0.0.1:4433',
  QUIC_PROTOCOL: 'metarhia-quic',
  QUIC_MAX_DATAGRAM_FRAME_SIZE: 1200,
};
