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

// Distance from point (px, py) to line segment (x1, y1)-(x2, y2)
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

// Draw icon with Codepackr brand gradient (#5B52E8 -> #009F88) and white Terminal prompt > _
function drawIcon(x, y, w, h) {
  const nx = (x + 0.5) / w;
  const ny = (y + 0.5) / h;
  const cx = 0.5;
  const cy = 0.5;

  // Background rounded square
  const r = 0.22; // corner radius normalized
  const dx = Math.max(0, Math.abs(nx - cx) - (0.45 - r));
  const dy = Math.max(0, Math.abs(ny - cy) - (0.45 - r));
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist > r) {
    return [0, 0, 0, 0]; // Transparent outside rounded container
  }

  // Brand gradient: #5B52E8 (91, 82, 232) to #009F88 (0, 159, 136)
  const grad = Math.max(0, Math.min(1, (nx + ny) * 0.5));
  let bgR = Math.round(91 * (1 - grad));
  let bgG = Math.round(82 * (1 - grad) + 159 * grad);
  let bgB = Math.round(232 * (1 - grad) + 136 * grad);

  // Terminal prompt symbol:
  // Polyline: (0.24, 0.30) -> (0.44, 0.50) -> (0.24, 0.70)
  // Underline: (0.52, 0.70) -> (0.76, 0.70)
  const strokeWidth = w <= 20 ? 0.08 : 0.06;

  const d1 = distToSegment(nx, ny, 0.24, 0.30, 0.44, 0.50);
  const d2 = distToSegment(nx, ny, 0.44, 0.50, 0.24, 0.70);
  const d3 = distToSegment(nx, ny, 0.52, 0.70, 0.76, 0.70);

  const minDist = Math.min(d1, d2, d3);

  if (minDist <= strokeWidth) {
    // Sharp white terminal stroke
    return [255, 255, 255, 255];
  } else if (minDist <= strokeWidth + 0.03) {
    // Subtle anti-aliasing edge
    const alpha = 1 - (minDist - strokeWidth) / 0.03;
    return [
      Math.round(255 * alpha + bgR * (1 - alpha)),
      Math.round(255 * alpha + bgG * (1 - alpha)),
      Math.round(255 * alpha + bgB * (1 - alpha)),
      255
    ];
  }

  return [bgR, bgG, bgB, 255];
}

// Generate DIB ICO file containing multiple sizes (16x16 and 32x32)
// This is standard 32bpp BMP DIB format compatible with all crawlers & browsers
function createIcoFile(sizes) {
  const numImages = sizes.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type (1 = icon)
  header.writeUInt16LE(numImages, 4); // count

  const dirEntries = [];
  const imageBuffers = [];

  let currentOffset = 6 + numImages * 16;

  for (const size of sizes) {
    const width = size;
    const height = size;

    // BitmapInfoHeader (40 bytes)
    const bih = Buffer.alloc(40);
    bih.writeUInt32LE(40, 0); // biSize
    bih.writeInt32LE(width, 4); // biWidth
    bih.writeInt32LE(height * 2, 8); // biHeight (doubled for XOR + AND mask)
    bih.writeUInt16LE(1, 12); // biPlanes
    bih.writeUInt16LE(32, 14); // biBitCount (32-bit RGBA)
    bih.writeUInt32LE(0, 16); // biCompression (BI_RGB)
    bih.writeUInt32LE(width * height * 4, 20); // biSizeImage
    bih.writeInt32LE(0, 24); // biXPelsPerMeter
    bih.writeInt32LE(0, 28); // biYPelsPerMeter
    bih.writeUInt32LE(0, 32); // biClrUsed
    bih.writeUInt32LE(0, 36); // biClrImportant

    // Pixel data: bottom-to-top rows
    const pixelData = Buffer.alloc(width * height * 4);
    let pOffset = 0;
    for (let y = height - 1; y >= 0; y--) {
      for (let x = 0; x < width; x++) {
        const [r, g, b, a] = drawIcon(x, y, width, height);
        pixelData[pOffset++] = b; // Blue
        pixelData[pOffset++] = g; // Green
        pixelData[pOffset++] = r; // Red
        pixelData[pOffset++] = a; // Alpha
      }
    }

    // AND mask (1 bit per pixel, rows padded to multiple of 4 bytes)
    const rowBytes = Math.ceil(width / 32) * 4;
    const andMask = Buffer.alloc(rowBytes * height, 0); // 0 means opaque (since alpha channel is used)

    const imgBuf = Buffer.concat([bih, pixelData, andMask]);
    imageBuffers.push(imgBuf);

    // Directory entry (16 bytes)
    const entry = Buffer.alloc(16);
    entry.writeUInt8(width >= 256 ? 0 : width, 0);
    entry.writeUInt8(height >= 256 ? 0 : height, 1);
    entry.writeUInt8(0, 2); // color palette count
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // color planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(imgBuf.length, 8); // image size in bytes
    entry.writeUInt32LE(currentOffset, 12); // offset

    dirEntries.push(entry);
    currentOffset += imgBuf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...imageBuffers]);
}

// Generate SVG Favicon
function generateSvgFavicon() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <defs>
    <linearGradient id="codepackr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5B52E8"/>
      <stop offset="100%" stop-color="#009f88"/>
    </linearGradient>
  </defs>
  <rect width="64" height="64" rx="14" fill="url(#codepackr-grad)"/>
  <!-- Terminal Prompt Icon > _ -->
  <polyline points="18 42 32 28 18 14" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
  <line x1="36" y1="42" x2="48" y2="42" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
</svg>
`;
}

// Draw OpenGraph preview banner (1200x630)
function drawOgBanner(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;

  // Modern dark navy gradient background: #0B0F19 to #171E2E
  const bgR = Math.round(11 + nx * 14 + ny * 6);
  const bgG = Math.round(15 + nx * 18 + ny * 8);
  const bgB = Math.round(25 + nx * 28 + ny * 12);

  // Top accent line in Brand Violet / Teal gradient
  if (ny < 0.015) {
    return [Math.round(91 * (1 - nx)), Math.round(82 * (1 - nx) + 159 * nx), Math.round(232 * (1 - nx) + 136 * nx), 255];
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
const distDir = path.resolve('dist');
const ogDir = path.join(publicDir, 'assets', 'og');
fs.mkdirSync(ogDir, { recursive: true });

console.log('Generating favicon assets...');

// 1. Generate PNGs
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
  if (fs.existsSync(distDir)) {
    fs.writeFileSync(path.join(distDir, file), png);
  }
  console.log(`Generated ${file} (${size}x${size})`);
}

// 2. Generate SVG Favicon
const svgFavicon = generateSvgFavicon();
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgFavicon, 'utf8');
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'favicon.svg'), svgFavicon, 'utf8');
}
console.log('Generated favicon.svg');

// 3. Generate multi-resolution DIB ICO file (16x16 and 32x32)
const icoFile = createIcoFile([16, 32]);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);
if (fs.existsSync(distDir)) {
  fs.writeFileSync(path.join(distDir, 'favicon.ico'), icoFile);
}
console.log(`Generated favicon.ico (Dual 16x16 & 32x32 DIB, ${icoFile.length} bytes)`);

// 4. Generate OG Default preview image
console.log('Generating assets/og/default.png (1200x630)...');
const ogPng = createPng(1200, 630, drawOgBanner);
fs.writeFileSync(path.join(ogDir, 'default.png'), ogPng);
if (fs.existsSync(distDir)) {
  const distOgDir = path.join(distDir, 'assets', 'og');
  fs.mkdirSync(distOgDir, { recursive: true });
  fs.writeFileSync(path.join(distOgDir, 'default.png'), ogPng);
}
console.log('Generated assets/og/default.png');
