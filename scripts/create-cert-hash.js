import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const certsDir = path.join(root, 'certs');
const outputDir = path.join(root, 'static');

const readPemBody = (filePath) => readFileSync(filePath, 'utf8')
  .replace(/-----BEGIN CERTIFICATE-----/g, '')
  .replace(/-----END CERTIFICATE-----/g, '')
  .replace(/\s+/g, '');

const certPath = path.join(certsDir, 'server.crt');
const pemBody = readPemBody(certPath);
const certBytes = Buffer.from(pemBody, 'base64');
const certHash = createHash('sha256')
  .update(certBytes)
  .digest('base64');

const content = JSON.stringify([
  {
    algorithm: 'sha-256',
    value: certHash,
  },
], null, 2);

mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, 'cert-hash.json'), `${content}\n`);

console.log('created static/cert-hash.json');
