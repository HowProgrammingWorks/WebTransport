const encoder = new TextEncoder();
const decoder = new TextDecoder();

const urlInput = document.getElementById('url');
const connectButton = document.getElementById('connect');
const clearButton = document.getElementById('clear');
const output = document.getElementById('output');

const log = (message) => {
  output.textContent += `${message}\n`;
};

const fromBase64 = (value) => {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

const concat = (chunks) => {
  const size = chunks.reduce((sum, chunk) => sum + chunk.byteLength, 0);
  const result = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
};

const readStreamText = async (readable) => {
  const reader = readable.getReader();
  const chunks = [];
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return decoder.decode(concat(chunks));
};

const writeStreamText = async (writable, message) => {
  const writer = writable.getWriter();
  await writer.write(encoder.encode(message));
  await writer.close();
};

const readCertificateHashes = async () => {
  const response = await fetch('/cert-hash.json', { cache: 'no-store' });
  if (!response.ok) return [];
  const hashes = await response.json();
  return hashes.map((hash) => ({
    algorithm: hash.algorithm,
    value: fromBase64(hash.value),
  }));
};

const connectWebTransport = async (url) => {
  const serverCertificateHashes = await readCertificateHashes();
  const options = serverCertificateHashes.length === 0 ? {} : {
    serverCertificateHashes,
  };
  return new WebTransport(url, options);
};

const readDatagrams = async (transport) => {
  const reader = transport.datagrams.readable.getReader();
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    log(`datagram <- ${decoder.decode(value)}`);
  }
};

const sendDatagram = async (transport, message) => {
  const writer = transport.datagrams.writable.getWriter();
  await writer.write(encoder.encode(message));
  writer.releaseLock();
  log(`datagram -> ${message}`);
};

const sendBidirectionalStream = async (transport, message) => {
  const stream = await transport.createBidirectionalStream();
  await Promise.all([
    writeStreamText(stream.writable, message),
    readStreamText(stream.readable).then((reply) => {
      log(`stream <- ${reply}`);
    }),
  ]);
  log(`stream -> ${message}`);
};

const main = async () => {
  if (!('WebTransport' in globalThis)) {
    log('WebTransport is not available in this browser.');
    return;
  }

  const url = urlInput.value.trim();
  const transport = await connectWebTransport(url);

  log(`connecting ${url}`);
  await transport.ready;
  log('connected');

  readDatagrams(transport).catch((error) => {
    log(`datagram read error: ${error.message}`);
  });

  await sendBidirectionalStream(transport, 'ping over WebTransport stream');
  await sendDatagram(transport, 'ping over WebTransport datagram');

  await transport.closed;
  log('closed');
};

connectButton.addEventListener('click', () => {
  main().catch((error) => {
    log(`error: ${error.message}`);
  });
});

clearButton.addEventListener('click', () => {
  output.textContent = '';
});
