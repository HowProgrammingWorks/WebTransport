import path from 'node:path';
import Channel from './channel.js';
import config from '../config.js';
import staticFiles from './static.js';

const loadRoutes = async () => {
  const indexPath = path.join(config.STATIC_DIR, 'index.html');
  const index = (req, res) => staticFiles.serveFile(res, indexPath);
  return { '': index, 'index.html': index };
};

const safeJoin = (base, requestPath) => {
  const cleaned = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
  const full = path.join(base, cleaned);
  const rel = path.relative(config.root, full);
  if (!rel || rel.startsWith('..') || path.isAbsolute(rel)) return null;
  return full;
};

const serveStatic = async (req, res, pathname) => {
  const target = safeJoin(config.STATIC_DIR, pathname);
  if (!target) {
    new Channel(req, res).notFound();
    return;
  }
  await staticFiles.serveFile(res, target);
};

export default { loadRoutes, serveStatic };
