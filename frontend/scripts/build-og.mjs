// Rasterizes `assets/og.svg` into `public/og.png` (1200x630), the social share card.
//
// Run by hand (`npm run og:build`) and the PNG is committed, so neither the Vercel build nor the
// deploy depends on `sharp` being installed. Social scrapers do not reliably render SVG, which is
// why this exists at all rather than pointing og:image at the SVG.

import { readFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'assets', 'og.svg');
const target = join(root, 'public', 'og.png');

mkdirSync(join(root, 'public'), { recursive: true });

const info = await sharp(readFileSync(source), { density: 144 })
  .resize(1200, 630, { fit: 'fill' })
  .png({ compressionLevel: 9 })
  .toFile(target);

console.log(`${target} — ${info.width}x${info.height}, ${Math.round(info.size / 1024)} kB`);
