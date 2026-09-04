import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let crc = 0 ^ -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function createPng(width, height, drawFn) {
  const header = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // RGBA
  ihdr.writeUInt8(0, 10);
  ihdr.writeUInt8(0, 11);
  ihdr.writeUInt8(0, 12);

  const rawScanlines = Buffer.alloc(height * (1 + width * 4));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    rawScanlines[offset++] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawScanlines[offset++] = r;
      rawScanlines[offset++] = g;
      rawScanlines[offset++] = b;
      rawScanlines[offset++] = a;
    }
  }

  const compressed = zlib.deflateSync(rawScanlines);
  const idat = makeChunk('IDAT', compressed);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([header, makeChunk('IHDR', ihdr), idat, iend]);
}

// Draw icon with Brand purple #5B52E8 and white code brackets
function drawIcon(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;

  // Background rounded square
  const r = 0.22; // corner radius normalized
  const dx = Math.max(0, Math.abs(nx - cx) - (0.42 - r));
  const dy = Math.max(0, Math.abs(ny - cy) - (0.42 - r));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > r) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Brand gradient: Indigo #5B52E8 to Deep Violet #4338CA
  const grad = (nx + ny) * 0.5;
  let bgR = Math.round(91 - grad * 24);
  let bgG = Math.round(82 - grad * 26);
  let bgB = Math.round(232 - grad * 30);

  // Center code bracket symbol </>
  // Left bracket <
  const inLeftBracket =
    (nx >= 0.26 && nx <= 0.44) &&
    (
      (ny >= 0.32 && ny <= 0.50 && Math.abs((ny - 0.50) + (nx - 0.32) * 1.5) < 0.07) ||
      (ny >= 0.50 && ny <= 0.68 && Math.abs((ny - 0.50) - (nx - 0.32) * 1.5) < 0.07)
    );

  // Right bracket >
  const inRightBracket =
    (nx >= 0.56 && nx <= 0.74) &&
    (
      (ny >= 0.32 && ny <= 0.50 && Math.abs((ny - 0.50) - (nx - 0.68) * 1.5) < 0.07) ||
      (ny >= 0.50 && ny <= 0.68 && Math.abs((ny - 0.50) + (nx - 0.68) * 1.5) < 0.07)
    );

  // Slash /
  const inSlash =
    (nx >= 0.44 && nx <= 0.56) &&
    (ny >= 0.28 && ny <= 0.72) &&
    Math.abs((ny - 0.50) + (nx - 0.50) * 2.8) < 0.08;

  if (inLeftBracket || inRightBracket || inSlash) {
    return [255, 255, 255, 255]; // White
  }

  return [bgR, bgG, bgB, 255];
}

// Draw OpenGraph preview banner (1200x630)
function drawOgBanner(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Modern dark navy gradient background: #0B0F19 to #171E2E
  const bgR = Math.round(11 + nx * 14 + ny * 6);
  const bgG = Math.round(15 + nx * 18 + ny * 8);
  const bgB = Math.round(25 + nx * 28 + ny * 12);

  // Top accent line in Brand Violet
  if (ny < 0.015) {
    return [91, 82, 232, 255];
  }

  // Left card icon preview (center around nx: 0.20, ny: 0.5)
  if (nx >= 0.12 && nx <= 0.28 && ny >= 0.35 && ny <= 0.65) {
    const iconX = Math.round((nx - 0.12) / 0.16 * 128);
    const iconY = Math.round((ny - 0.35) / 0.30 * 128);
    const [ir, ig, ib, ia] = drawIcon(iconX, iconY, 128, 128);
    if (ia > 0) return [ir, ig, ib, ia];
  }

  // Title area horizontal glow bars (simulating typography banner)
  if (nx >= 0.33 && nx <= 0.85) {
    // Title bar
    if (ny >= 0.38 && ny <= 0.44) return [255, 255, 255, 240];
    // Subtitle bars
    if (ny >= 0.48 && ny <= 0.51 && nx <= 0.78) return [160, 174, 192, 220];
    if (ny >= 0.53 && ny <= 0.56 && nx <= 0.68) return [160, 174, 192, 220];
    // Tag pill
    if (ny >= 0.62 && ny <= 0.67 && nx <= 0.52) return [91, 82, 232, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const publicDir = path.resolve('public');
const ogDir = path.join(publicDir, 'assets', 'og');
fs.mkdirSync(ogDir, { recursive: true });

console.log('Generating favicon assets...');
const sizes = [
  { file: 'favicon-16x16.png', size: 16 },
  { file: 'favicon-32x32.png', size: 32 },
  { file: 'apple-touch-icon.png', size: 180 },
  { file: 'android-chrome-192x192.png', size: 192 },
  { file: 'android-chrome-512x512.png', size: 512 }
];

for (const { file, size } of sizes) {
  const png = createPng(size, size, drawIcon);
  fs.writeFileSync(path.join(publicDir, file), png);
  console.log(`Generated ${file} (${size}x${size})`);
}

// favicon.ico (can be a 32x32 PNG inside standard ICO header or 32x32 PNG file)
// Standard single-image ICO container:
const png32 = fs.readFileSync(path.join(publicDir, 'favicon-32x32.png'));
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0); // reserved
icoHeader.writeUInt16LE(1, 2); // icon type
icoHeader.writeUInt16LE(1, 4); // 1 image

const icoDirEntry = Buffer.alloc(16);
icoDirEntry.writeUInt8(32, 0); // width
icoDirEntry.writeUInt8(32, 1); // height
icoDirEntry.writeUInt8(0, 2); // color count
icoDirEntry.writeUInt8(0, 3); // reserved
icoDirEntry.writeUInt16LE(1, 4); // color planes
icoDirEntry.writeUInt16LE(32, 6); // bits per pixel
icoDirEntry.writeUInt32LE(png32.length, 8); // size of image data
icoDirEntry.writeUInt32LE(22, 12); // offset of image data (6 + 16 = 22)

const icoFile = Buffer.concat([icoHeader, icoDirEntry, png32]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
console.log('Generated favicon.ico');

// OG Default preview image
console.log('Generating assets/og/default.png (1200x630)...');
const ogPng = createPng(1200, 630, drawOgBanner);
fs.writeFileSync(path.join(ogDir, 'default.png'), ogPng);
console.log('Generated assets/og/default.png');
