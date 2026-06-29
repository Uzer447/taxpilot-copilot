// Generate placeholder PNG icons for the Chrome extension
// Run: node generate-icons.js

import { writeFileSync } from 'fs';

/**
 * Create a minimal valid PNG file with a solid color.
 * This generates a proper PNG with IHDR, IDAT, and IEND chunks.
 */
function createPNG(size, r, g, b) {
  // PNG uses zlib-compressed data. For simplicity, we'll create
  // an uncompressed deflate stream (stored blocks).

  // Raw image data: for each row, 1 filter byte (0=None) + RGB pixels
  const rowSize = 1 + size * 3;
  const rawData = Buffer.alloc(rowSize * size);

  for (let y = 0; y < size; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
    }
  }

  // Create uncompressed deflate stream
  const deflateData = createUncompressedDeflate(rawData);

  // Build PNG file
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);  // width
  ihdrData.writeUInt32BE(size, 4);  // height
  ihdrData[8] = 8;                   // bit depth
  ihdrData[9] = 2;                   // color type: RGB
  ihdrData[10] = 0;                  // compression
  ihdrData[11] = 0;                  // filter
  ihdrData[12] = 0;                  // interlace
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // IDAT chunk
  const idatChunk = createChunk('IDAT', deflateData);

  // IEND chunk
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);

  const typeBuffer = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = crc32(crcData);

  const crcBuffer = Buffer.alloc(4);
  crcBuffer.writeUInt32BE(crc, 0);

  return Buffer.concat([length, typeBuffer, data, crcBuffer]);
}

function createUncompressedDeflate(data) {
  // Zlib header: CMF=0x78, FLG=0x01 (no dict, low compression)
  const header = Buffer.from([0x78, 0x01]);

  // Split into blocks of max 65535 bytes
  const blocks = [];
  let offset = 0;
  while (offset < data.length) {
    const remaining = data.length - offset;
    const blockSize = Math.min(remaining, 65535);
    const isLast = offset + blockSize >= data.length;

    const blockHeader = Buffer.alloc(5);
    blockHeader[0] = isLast ? 0x01 : 0x00; // BFINAL
    blockHeader.writeUInt16LE(blockSize, 1);
    blockHeader.writeUInt16LE(blockSize ^ 0xFFFF, 3);

    blocks.push(blockHeader);
    blocks.push(data.slice(offset, offset + blockSize));
    offset += blockSize;
  }

  // Adler-32 checksum
  const adler = adler32(data);
  const adlerBuffer = Buffer.alloc(4);
  adlerBuffer.writeUInt32BE(adler, 0);

  return Buffer.concat([header, ...blocks, adlerBuffer]);
}

// CRC32 lookup table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xEDB88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function adler32(buf) {
  let a = 1, b = 0;
  for (let i = 0; i < buf.length; i++) {
    a = (a + buf[i]) % 65521;
    b = (b + a) % 65521;
  }
  return ((b << 16) | a) >>> 0;
}

// Generate icons: Indigo color (#6366f1 = r:99, g:102, b:241)
const sizes = [16, 48, 128];
sizes.forEach(size => {
  const png = createPNG(size, 99, 102, 241);
  writeFileSync(`extension/icons/icon${size}.png`, png);
  console.log(`Created icon${size}.png (${png.length} bytes)`);
});

console.log('Done! Placeholder icons created.');
