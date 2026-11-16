import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const SRC = path.resolve('src-img');
const OUT = path.resolve('assets/img');
fs.mkdirSync(OUT, { recursive: true });

const MAX_W = 1800;

for (const file of fs.readdirSync(SRC)) {
  const ext = path.extname(file).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) continue;
  const name = path.basename(file, ext);
  const out = path.join(OUT, `${name}.webp`);
  const img = sharp(path.join(SRC, file)).rotate();
  const meta = await img.metadata();
  const info = await img
    .resize({ width: Math.min(meta.width, MAX_W), withoutEnlargement: true })
    .webp({ quality: 74, effort: 5 })
    .toFile(out);
  console.log(
    `${file.padEnd(16)} ${meta.width}x${meta.height}  ->  ${name}.webp  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} KB`
  );
}
