import { copyFile, writeFile } from 'node:fs/promises';

// GitHub Pages must serve Next's _next directory without Jekyll filtering it.
await copyFile('CNAME', 'out/CNAME');
await writeFile('out/.nojekyll', '');
