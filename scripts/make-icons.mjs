/**
 * Generates the PWA icons with no image dependencies.
 * Run: node scripts/make-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT_DIR = path.join(ROOT, 'public', 'icons');

const BG = [11, 15, 20, 255]; // --color-ink-950
const FG = [33, 191, 153, 255]; // --color-brand-400

const CRC_TABLE = (() => {
  const table = new Int32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, 'latin1'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

function encodePng(width, height, rgba) {
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y += 1) {
    raw[y * (stride + 1)] = 0; // filtro "None"
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Distance from point to segment, used to draw thick round-capped strokes. */
function distanceToSegment(px, py, ax, ay, bx, by) {
  const dx = bx - ax;
  const dy = by - ay;
  const lengthSquared = dx * dx + dy * dy;
  const t = lengthSquared === 0 ? 0 : Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / lengthSquared));
  const cx = ax + t * dx;
  const cy = ay + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function drawIcon(size, { maskable = false } = {}) {
  const rgba = Buffer.alloc(size * size * 4);
  // Um ícone maskable preenche o quadrado todo e mantém o desenho na zona segura.
  const radius = maskable ? 0 : size * 0.22;
  const inset = maskable ? size * 0.1 : 0;
  const scale = maskable ? 0.8 : 1;

  // Duas setas empilhadas: progressão constante.
  const strokes = [];
  for (const offset of [-0.1, 0.1]) {
    const cx = size / 2;
    const top = size * (0.42 + offset) + inset / 2;
    const spread = size * 0.2 * scale;
    const drop = size * 0.14 * scale;
    strokes.push([cx - spread, top + drop, cx, top]);
    strokes.push([cx, top, cx + spread, top + drop]);
  }
  const thickness = size * 0.075 * scale;

  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const inCard = insideRoundedRect(x + 0.5, y + 0.5, size, radius);
      const color = inCard ? BG : [0, 0, 0, 0];
      let pixel = color;

      if (inCard) {
        for (const [ax, ay, bx, by] of strokes) {
          if (distanceToSegment(x + 0.5, y + 0.5, ax, ay, bx, by) <= thickness / 2) {
            pixel = FG;
            break;
          }
        }
      }
      rgba[index] = pixel[0];
      rgba[index + 1] = pixel[1];
      rgba[index + 2] = pixel[2];
      rgba[index + 3] = pixel[3];
    }
  }
  return encodePng(size, size, rgba);
}

function insideRoundedRect(x, y, size, radius) {
  const r = Math.min(radius, size / 2);
  const minX = r;
  const maxX = size - r;
  const minY = r;
  const maxY = size - r;
  const cx = Math.min(Math.max(x, minX), maxX);
  const cy = Math.min(Math.max(y, minY), maxY);
  if (x >= minX && x <= maxX) return y >= 0 && y <= size;
  if (y >= minY && y <= maxY) return x >= 0 && x <= size;
  return Math.hypot(x - cx, y - cy) <= r;
}

mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(path.join(OUT_DIR, 'icon-192.png'), drawIcon(192));
writeFileSync(path.join(OUT_DIR, 'icon-512.png'), drawIcon(512));
writeFileSync(path.join(OUT_DIR, 'icon-maskable-512.png'), drawIcon(512, { maskable: true }));
process.stdout.write(`Ícones escritos em ${OUT_DIR}\n`);
