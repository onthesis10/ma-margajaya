const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function makeOgDefault() {
  const width = 1200;
  const height = 630;
  
  const rootDir = path.resolve(__dirname, '..');
  const logoPath = path.join(rootDir, 'public', 'logo', 'logo-ma-margajaya.png');
  const outputPath = path.join(rootDir, 'public', 'og-default.png');
  
  const logoBuffer = await sharp(logoPath)
    .resize(200, 200, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
    
  const logoBase64 = logoBuffer.toString('base64');
  
  const svg = `
  <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#042014" />
        <stop offset="50%" stop-color="#073a22" />
        <stop offset="100%" stop-color="#02140c" />
      </linearGradient>
      <radialGradient id="centerGlow" cx="50%" cy="38%" r="45%">
        <stop offset="0%" stop-color="#e8b923" stop-opacity="0.18" />
        <stop offset="60%" stop-color="#073a22" stop-opacity="0" />
      </radialGradient>
      <filter id="dropShadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000000" flood-opacity="0.5" />
      </filter>
    </defs>

    <!-- Background -->
    <rect width="${width}" height="${height}" fill="url(#bgGradient)" />
    <rect width="${width}" height="${height}" fill="url(#centerGlow)" />

    <!-- Outer Decorative Border -->
    <rect x="32" y="32" width="1136" height="566" rx="28" fill="none" stroke="rgba(232,185,35,0.35)" stroke-width="1.5" />
    <rect x="42" y="42" width="1116" height="546" rx="20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />

    <!-- Top Badge -->
    <g transform="translate(600, 80)">
      <rect x="-150" y="-17" width="300" height="34" rx="17" fill="rgba(232,185,35,0.12)" stroke="rgba(232,185,35,0.4)" stroke-width="1" />
      <text x="0" y="5" text-anchor="middle" fill="#e8b923" font-family="system-ui, sans-serif" font-size="12" font-weight="700" letter-spacing="3">WEBSITE RESMI MADRASAH</text>
    </g>

    <!-- Circular Logo Backdrop -->
    <circle cx="600" cy="225" r="105" fill="rgba(255,255,255,0.07)" filter="url(#dropShadow)" />
    <circle cx="600" cy="225" r="102" fill="none" stroke="rgba(232,185,35,0.5)" stroke-width="2" />

    <!-- Center Logo -->
    <image x="500" y="125" width="200" height="200" href="data:image/png;base64,${logoBase64}" filter="url(#dropShadow)" />

    <!-- Main Title -->
    <text x="600" y="395" text-anchor="middle" fill="#ffffff" font-family="Georgia, serif" font-size="40" font-weight="bold" letter-spacing="1">
      MADRASAH ALIYAH MARGAJAYA
    </text>

    <!-- Subtitle -->
    <text x="600" y="438" text-anchor="middle" fill="rgba(255,255,255,0.88)" font-family="system-ui, sans-serif" font-size="20" font-weight="500" letter-spacing="0.5">
      Kompleks Pondok Pesantren Darul Muawanah · Sukadana, Ciamis
    </text>

    <!-- Divider Line -->
    <line x1="440" y1="472" x2="760" y2="472" stroke="rgba(232,185,35,0.5)" stroke-width="1.5" stroke-linecap="round" />

    <!-- Tagline -->
    <text x="600" y="512" text-anchor="middle" fill="#e8b923" font-family="system-ui, sans-serif" font-size="14" font-weight="700" letter-spacing="3">
      BERAKHLAK MULIA &amp; BERPRESTASI
    </text>
    
    <!-- Location Footer -->
    <text x="600" y="540" text-anchor="middle" fill="rgba(255,255,255,0.55)" font-family="system-ui, sans-serif" font-size="12" font-weight="400" letter-spacing="1">
      NPSN: 69955696 · Jln. Ciilat - Gardu Margajaya, Sukadana, Ciamis 46272
    </text>
  </svg>
  `;

  await sharp(Buffer.from(svg))
    .png({ compressionLevel: 8 })
    .toFile(outputPath);
    
  console.log('Successfully generated public/og-default.png, size:', fs.statSync(outputPath).size, 'bytes');
}

makeOgDefault().catch(console.error);
