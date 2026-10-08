const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function makePng(width, height, getPixel) {
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = Math.max(0, Math.min(255, Math.round(r)));
      rawData[pxOffset + 1] = Math.max(0, Math.min(255, Math.round(g)));
      rawData[pxOffset + 2] = Math.max(0, Math.min(255, Math.round(b)));
      rawData[pxOffset + 3] = Math.max(0, Math.min(255, Math.round(a)));
    }
  }

  const deflated = zlib.deflateSync(rawData, { level: 9 });

  function makeChunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'binary');
    const toCrc = Buffer.concat([typeBuf, data]);
    let crc = 0xFFFFFFFF;
    for (let i = 0; i < toCrc.length; i++) {
      crc ^= toCrc[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
      }
    }
    crc = (crc ^ 0xFFFFFFFF) >>> 0;
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdr = makeChunk('IHDR', ihdrData);
  const idat = makeChunk('IDAT', deflated);
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr, idat, iend]);
}

// Distance from point to line segment
function distToSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1);
  if (l2 === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(px - (x1 + t * (x2 - x1)), py - (y1 + t * (y2 - y1)));
}

function createIconRenderer(isMaskable) {
  return function(x, y, w, h) {
    // Normalized coordinates [0, 1]
    const nx = x / w;
    const ny = y / h;

    // Background gradient: dark slate to midnight navy
    const bgR = 2 + (15 - 2) * ny;
    const bgG = 6 + (23 - 6) * ny;
    const bgB = 23 + (40 - 23) * ny;

    // Scale and center for safe zone if maskable
    const scale = isMaskable ? 0.72 : 0.88;
    const cx = (nx - 0.5) / scale + 0.5;
    const cy = (ny - 0.5) / scale + 0.5;

    // Emblem segments for stylized 'M'
    // Vertices in normalized [0, 1] space
    const pts = [
      [0.26, 0.74], // Bottom-left
      [0.26, 0.32], // Top-left
      [0.42, 0.58], // Mid-left
      [0.50, 0.44], // Apex center
      [0.58, 0.58], // Mid-right
      [0.74, 0.32], // Top-right
      [0.74, 0.74], // Bottom-right
    ];

    let minDist = 999;
    for (let i = 0; i < pts.length - 1; i++) {
      const d = distToSegment(cx, cy, pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1]);
      if (d < minDist) minDist = d;
    }

    // Stroke width
    const strokeWidth = 0.045;
    const strokeFalloff = 0.012;

    // Central jewel / node at (0.50, 0.44)
    const nodeDist = Math.hypot(cx - 0.50, cy - 0.44);

    let mAlpha = 0;
    if (minDist <= strokeWidth) {
      mAlpha = 1;
    } else if (minDist < strokeWidth + strokeFalloff) {
      mAlpha = 1 - (minDist - strokeWidth) / strokeFalloff;
    }

    // Outer glow
    let glow = 0;
    if (minDist > strokeWidth && minDist < strokeWidth + 0.12) {
      glow = (1 - (minDist - strokeWidth) / 0.12) * 0.28;
    }

    // Amber gold colors
    const amberR = 251;
    const amberG = 191;
    const amberB = 36;

    let r = bgR;
    let g = bgG;
    let b = bgB;

    // Apply glow
    if (glow > 0) {
      r += amberR * glow;
      g += amberG * glow;
      b += amberB * glow;
    }

    // Apply M stroke
    if (mAlpha > 0) {
      // Golden gradient
      const strokeGrad = (cy - 0.3) / 0.45;
      const sr = amberR;
      const sg = amberG - 30 * strokeGrad;
      const sb = amberB - 25 * strokeGrad;

      r = r * (1 - mAlpha) + sr * mAlpha;
      g = g * (1 - mAlpha) + sg * mAlpha;
      b = b * (1 - mAlpha) + sb * mAlpha;
    }

    // Center node dot
    if (nodeDist <= 0.035) {
      const dotA = nodeDist <= 0.025 ? 1 : (1 - (nodeDist - 0.025) / 0.01);
      r = r * (1 - dotA) + 255 * dotA;
      g = g * (1 - dotA) + 255 * dotA;
      b = b * (1 - dotA) + 255 * dotA;
    }

    return [r, g, b, 255];
  };
}

const publicDir = path.resolve(__dirname, '../public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

console.log('Generating PWA icons for MYLIFE...');

const icon192 = makePng(192, 192, createIconRenderer(false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), icon192);
console.log('Created pwa-192x192.png');

const icon512 = makePng(512, 512, createIconRenderer(false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), icon512);
console.log('Created pwa-512x512.png');

const maskable512 = makePng(512, 512, createIconRenderer(true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), maskable512);
console.log('Created pwa-maskable-512x512.png');

const appleTouch = makePng(180, 180, createIconRenderer(false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);
console.log('Created apple-touch-icon.png');

console.log('All PWA icons successfully generated!');
