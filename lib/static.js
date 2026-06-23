import { readFile } from 'node:fs/promises';
import Channel from './channel.js';

const fileCache = new Map();

const serveFile = async (res, filePath) => {
  if (!fileCache.has(filePath)) {
    try {
      fileCache.set(filePath, await readFile(filePath));
    } catch (error) {
      if (error?.code === 'ENOENT') {
        new Channel(null, res).notFound();
        return;
      }
      throw error;
    }
  }
  res.writeHead(200, { 'Content-Type': Channel.contentType(filePath) });
  res.end(fileCache.get(filePath));
};

export default { serveFile };
