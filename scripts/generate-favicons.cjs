const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateAllFavicons() {
  const rootDir = path.resolve(__dirname, '..');
  const logoPath = path.join(rootDir, 'public', 'logo', 'logo-ma-margajaya.png');
  const publicDir = path.join(rootDir, 'public');

  if (!fs.existsSync(logoPath)) {
    throw new Error('Logo source not found at: ' + logoPath);
  }

  console.log('Generating production favicons from:', logoPath);

  // 1. Generate PNGs in standard favicon sizes
  const sizes = [16, 32, 48, 64, 180, 192, 512];
  const pngBuffers = {};

  for (const size of sizes) {
    const buf = await sharp(logoPath)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    pngBuffers[size] = buf;
  }

  // Write individual PNG favicons
  fs.writeFileSync(path.join(publicDir, 'favicon-16x16.png'), pngBuffers[16]);
  fs.writeFileSync(path.join(publicDir, 'favicon-32x32.png'), pngBuffers[32]);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), pngBuffers[48]); // standard 48x48
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), pngBuffers[180]); // 180x180 iOS

  console.log('✓ Created favicon-16x16.png, favicon-32x32.png, favicon.png (48x48), apple-touch-icon.png');

  // 2. Generate standard multi-resolution ICO file (16, 32, 48)
  const icoSizes = [16, 32, 48];
  const icoBuffers = icoSizes.map(s => pngBuffers[s]);

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // Reserved
  header.writeUInt16LE(1, 2); // Type 1 = Icon
  header.writeUInt16LE(icoSizes.length, 4); // Number of images

  let offset = 6 + icoSizes.length * 16;
  const entries = icoSizes.map((size, i) => {
    const entry = Buffer.alloc(16);
    entry.writeUInt8(size >= 256 ? 0 : size, 0); // Width
    entry.writeUInt8(size >= 256 ? 0 : size, 1); // Height
    entry.writeUInt8(0, 2); // Color palette
    entry.writeUInt8(0, 3); // Reserved
    entry.writeUInt16LE(1, 4); // Color planes
    entry.writeUInt16LE(32, 6); // Bits per pixel
    entry.writeUInt32LE(icoBuffers[i].length, 8); // Size of image data
    entry.writeUInt32LE(offset, 12); // Offset of image data
    offset += icoBuffers[i].length;
    return entry;
  });

  const icoFileBuffer = Buffer.concat([header, ...entries, ...icoBuffers]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFileBuffer);
  console.log('✓ Created multi-resolution favicon.ico (' + icoFileBuffer.length + ' bytes)');

  // 3. Generate clean favicon.svg with embedded high-res logo
  const logoBase64 = (await sharp(logoPath)
    .resize(128, 128, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
  ).toString('base64');

  const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <image href="data:image/png;base64,${logoBase64}" width="128" height="128" />
</svg>
`;
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgContent, 'utf-8');
  console.log('✓ Replaced favicon.svg with official MA Margajaya logo');

  console.log('\nAll favicons successfully generated!');
}

generateAllFavicons().catch(err => {
  console.error('Failed to generate favicons:', err);
  process.exit(1);
});
