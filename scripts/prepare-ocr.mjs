import { cpSync, mkdirSync } from 'node:fs';
const destination = new URL('../public/ocr/runtime/', import.meta.url);
mkdirSync(destination, { recursive: true });
cpSync(new URL('../node_modules/tesseract.js/dist/worker.min.js', import.meta.url), new URL('worker.min.js', destination));
for (const variant of ['', '-simd', '-relaxedsimd']) {
  const file = `tesseract-core${variant}-lstm.wasm.js`;
  cpSync(new URL(`../node_modules/tesseract.js-core/${file}`, import.meta.url), new URL(file, destination));
}
cpSync(new URL('../node_modules/tesseract.js/LICENSE.md', import.meta.url), new URL('TESSERACT-JS-LICENSE', destination));
cpSync(new URL('../node_modules/tesseract.js-core/LICENSE', import.meta.url), new URL('TESSERACT-CORE-LICENSE', destination));
