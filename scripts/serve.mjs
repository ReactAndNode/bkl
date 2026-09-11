import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon', '.svg': 'image/svg+xml', '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

export function createStaticServer(directory = 'out') {
  const root = path.resolve(directory);
  return createServer(async (request, response) => {
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.writeHead(405, { Allow: 'GET, HEAD' }).end();
      return;
    }
    try {
      const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
      let file = path.resolve(root, `.${pathname}`);
      if (file !== root && !file.startsWith(`${root}${path.sep}`)) {
        response.writeHead(403).end();
        return;
      }
      let status = 200;
      try {
        if ((await stat(file)).isDirectory()) file = path.join(file, 'index.html');
        await stat(file);
      } catch {
        file = path.join(root, '404.html');
        status = 404;
      }
      const body = await readFile(file);
      response.writeHead(status, {
        'Content-Type': types[path.extname(file)] || 'application/octet-stream',
        'Content-Length': body.length,
      });
      response.end(request.method === 'HEAD' ? undefined : body);
    } catch {
      response.writeHead(400).end('Unable to serve this request. Run yarn build first.');
    }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT || 7999);
  createStaticServer().listen(port, '127.0.0.1', () => {
    console.log(`Static preview: http://localhost:${port}`);
  });
}
