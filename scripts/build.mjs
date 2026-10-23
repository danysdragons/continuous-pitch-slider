import { mkdir, copyFile, cp, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const output = new URL('dist/', root);
await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'styles.css', 'favicon.svg']) {
  await copyFile(new URL(file, root), new URL(file, output));
}
await cp(new URL('src/', root), new URL('src/', output), { recursive: true });
console.log(`Built static app: ${fileURLToPath(output)}`);
