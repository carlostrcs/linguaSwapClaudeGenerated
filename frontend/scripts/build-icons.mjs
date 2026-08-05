// Rasterizes `assets/icon.svg` into the PWA / home-screen icons in `public/`.
//
// Run by hand (`npm run icons:build`) and the PNGs are committed, so neither the Vercel build nor
// the deploy depends on `sharp` being installed — same arrangement as `build-og.mjs`. PNG rather
// than SVG because Android's installer and iOS's apple-touch-icon do not accept SVG.

import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'assets', 'icon.svg'));
const publicDir = join(root, 'public');

// 192 + 512 are the two sizes the manifest declares (the pair Chrome wants for install prompts and
// splash screens); 180 is what iOS reads from <link rel="apple-touch-icon">.
const targets = [
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  { file: 'apple-touch-icon.png', size: 180 },
];

mkdirSync(publicDir, { recursive: true });

for (const { file, size } of targets) {
  const target = join(publicDir, file);
  // density scales the SVG rasterization so downscaling never softens the mark's edges.
  // flatten drops the alpha channel: the art is full-bleed opaque already, and iOS composites any
  // transparency in an apple-touch-icon against black.
  const info = await sharp(source, { density: 384 })
    .resize(size, size, { fit: 'fill' })
    .flatten({ background: '#4338ca' })
    .png({ compressionLevel: 9 })
    .toFile(target);
  console.log(`${file} — ${info.width}x${info.height}, ${Math.round(info.size / 1024)} kB`);
}
