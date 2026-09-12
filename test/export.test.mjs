import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import path from 'node:path';
import { test, before, after } from 'node:test';
import { once } from 'node:events';
import { createStaticServer } from '../scripts/serve.mjs';

const pages = [
  ['/', 'About | Bowen K Liu', 'A little about myself'],
  ['/about/', 'Picture | Bowen K Liu', 'Not the best photographer'],
  ['/resume/', 'Resume | Bowen K Liu', 'University of Maryland'],
  ['/projects/', 'Projects | Bowen K Liu', 'Reveney'],
  ['/math/', 'Sumday — A little math, every day', 'Sharper thinking'],
  ['/contact/', 'Contact | Bowen K Liu', 'Feel free to get in touch'],
];

const server = createStaticServer();
let origin;
before(async () => {
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  origin = `http://127.0.0.1:${server.address().port}`;
});
after(() => new Promise(resolve => server.close(resolve)));

for (const [route, title, content] of pages) {
  test(`${route} works as a direct static request without JavaScript`, async () => {
    const response = await fetch(`${origin}${route}`);
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.ok(html.includes(`<title>${title}</title>`));
    assert.ok(html.includes(content));
    assert.ok(html.includes(`https://bowenkliu.com${route}`));
    if (route === '/math/') {
      for (const mode of ['math', 'stats', 'tips', 'poker', 'stocks']) {
        assert.ok(html.includes(`id="tab-${mode}"`), `Missing ${mode} practice tab`);
      }
      assert.ok(html.includes('Poker Lab'));
      assert.ok(html.includes('Stock Lab'));
    }
    for (const [link] of pages) {
      assert.match(html, new RegExp(`href="${link === '/' ? '/' : link.slice(0, -1) + '/?'}"`));
    }
    for (const [, asset] of html.matchAll(/(?:src|href)="(\/[^"?#]+)(?:\?[^"#]*)?"/g)) {
      if (!asset.startsWith('/_next/') && !asset.startsWith('/images/')) continue;
      await access(path.join('out', asset));
    }
    // Visitors following the old URLs should still receive their page.
    if (route !== '/') assert.equal((await fetch(`${origin}${route.slice(0, -1)}`)).status, 200);
  });
}

test('unknown routes return the real 404 page', async () => {
  const response = await fetch(`${origin}/does-not-exist`);
  assert.equal(response.status, 404);
  assert.match(await response.text(), /Page Not Found/);
});

test('GitHub Pages export preserves the domain and Next.js assets', async () => {
  assert.equal(await readFile('out/CNAME', 'utf8'), 'bowenkliu.com\n');
  await access('out/.nojekyll');
  await access('out/_next/static');
  const manifest = JSON.parse(await readFile('out/images/favicon/site.webmanifest', 'utf8'));
  for (const icon of manifest.icons) await access(path.join('out', icon.src));
});
