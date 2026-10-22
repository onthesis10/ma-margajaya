const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const SRC_DIR = path.join(__dirname, '..', 'assets-src');
const LOGO_DIR = path.join(__dirname, '..', 'public', 'logo');
const OUT_DIR = path.join(__dirname, '..', 'scratch', 'compare-assets');
const HTML_FILE = path.join(__dirname, '..', 'scratch', 'compare.html');

fs.mkdirSync(OUT_DIR, { recursive: true });

// Configuration for each image
const IMAGES_CONFIG = [
  {
    name: 'hero-bg-2.png',
    role: 'Hero Beranda (LCP)',
    type: 'hero',
    widths: [1200, 828, 480],
    webpQuality: 85, // Higher to prevent banding in dark green gradients
    avifQuality: 65,
    sizes: '100vw'
  },
  {
    name: 'gedung-kampus-ma-margajaya.png',
    role: 'Profil Kampus (Showcase)',
    type: 'hero',
    widths: [1200, 828, 480],
    webpQuality: 85,
    avifQuality: 65,
    sizes: '(max-width: 768px) 100vw, 1200px'
  },
  {
    name: 'kepala-madrasah.png',
    role: 'Sambutan Kepala Madrasah',
    type: 'portrait',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 1024px) 100vw, 500px'
  },
  {
    name: 'poto-bottom.jpeg',
    role: 'PPDB CTA Background',
    type: 'card',
    widths: [1200, 800, 600],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '100vw'
  },
  {
    name: 'gedung-ma-margajaya.jpg',
    role: 'Fasilitas / Galeri Gedung Utama',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'fasilitas-masjid.png',
    role: 'Fasilitas Masjid & Majelis Santri',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'fasilitas-masjid2.png',
    role: 'Fasilitas Masjid Darul Muawanah 2',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'fasilitas-halaman.png',
    role: 'Fasilitas Lapangan & Halaman Kampus',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'organisasi-osis.jpeg',
    role: 'Kesiswaan - OSIS / MPK',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'organisasi-pramuka.jpeg',
    role: 'Kesiswaan - Pramuka Ambalan',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'organisasi-paskibra.jpeg',
    role: 'Kesiswaan - Paskibra',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'organisasi-futsal.png',
    role: 'Kesiswaan - Futsal & Olahraga',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'organisasi-voli.jpeg',
    role: 'Kesiswaan - Bola Voli',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  },
  {
    name: 'pramuka.jpeg',
    role: 'Galeri - Kegiatan Pramuka',
    type: 'card',
    widths: [800, 600, 400],
    webpQuality: 80,
    avifQuality: 55,
    sizes: '(max-width: 768px) 100vw, 600px'
  }
];

const LOGOS_CONFIG = [
  {
    name: 'logo-ma-margajaya.png',
    role: 'Logo Utama MA Margajaya',
    displaySizes: [{ suffix: '-2x', width: 256 }, { suffix: '-1x', width: 128 }]
  },
  {
    name: 'logo-ma-margajaya-sm.png',
    role: 'Logo Navbar MA Margajaya',
    displaySizes: [{ suffix: '-2x', width: 96 }, { suffix: '-1x', width: 48 }]
  },
  {
    name: 'logo-ponpes-darul-muawanah.png',
    role: 'Logo Utama Ponpes',
    displaySizes: [{ suffix: '-2x', width: 256 }, { suffix: '-1x', width: 128 }]
  },
  {
    name: 'logo-ponpes-darul-muawanah-sm.png',
    role: 'Logo Navbar Ponpes',
    displaySizes: [{ suffix: '-2x', width: 96 }, { suffix: '-1x', width: 48 }]
  }
];

function formatKB(bytes) {
  return (bytes / 1024).toFixed(1) + ' KB';
}

async function getBlurPlaceholder(filePath) {
  const buffer = await sharp(filePath)
    .resize(16, null, { withoutEnlargement: true })
    .blur(1)
    .webp({ quality: 20 })
    .toBuffer();
  return `data:image/webp;base64,${buffer.toString('base64')}`;
}

async function getDominantColor(filePath) {
  const { dominant } = await sharp(filePath).stats();
  if (!dominant) return '#075B2A';
  return `#${((1 << 24) + (dominant.r << 16) + (dominant.g << 8) + dominant.b).toString(16).slice(1)}`;
}

async function run() {
  console.log('--- Processing Images for Comparison ---');
  const results = [];

  for (const cfg of IMAGES_CONFIG) {
    const srcFile = path.join(SRC_DIR, cfg.name);
    if (!fs.existsSync(srcFile)) {
      console.warn('File not found:', srcFile);
      continue;
    }

    const origStats = fs.statSync(srcFile);
    const origMeta = await sharp(srcFile).metadata();
    const blurData = await getBlurPlaceholder(srcFile);
    const dominantColor = await getDominantColor(srcFile);

    const baseName = path.parse(cfg.name).name;

    // Copy original to compare-assets for direct browser preview
    const origCopyName = `orig_${cfg.name}`;
    fs.copyFileSync(srcFile, path.join(OUT_DIR, origCopyName));

    const itemResult = {
      name: cfg.name,
      role: cfg.role,
      origWidth: origMeta.width,
      origHeight: origMeta.height,
      origSize: origStats.size,
      origFormat: origMeta.format,
      blurData,
      dominantColor,
      variants: {}
    };

    // Primary showcase width (largest target width)
    const primaryWidth = cfg.widths[0];

    // Generate WebP
    const webpName = `${baseName}_${primaryWidth}.webp`;
    const webpBuffer = await sharp(srcFile)
      .resize({ width: primaryWidth, withoutEnlargement: true })
      .webp({ quality: cfg.webpQuality, effort: 6 })
      .toFile(path.join(OUT_DIR, webpName));

    // Generate AVIF
    const avifName = `${baseName}_${primaryWidth}.avif`;
    const avifBuffer = await sharp(srcFile)
      .resize({ width: primaryWidth, withoutEnlargement: true })
      .avif({ quality: cfg.avifQuality, effort: 6 })
      .toFile(path.join(OUT_DIR, avifName));

    itemResult.variants = {
      primaryWidth,
      webpName,
      webpSize: webpBuffer.size,
      webpQuality: cfg.webpQuality,
      avifName,
      avifSize: avifBuffer.size,
      avifQuality: cfg.avifQuality,
      origCopyName
    };

    // Also generate all srcset variants (for inspection)
    const allWidthsData = [];
    for (const w of cfg.widths) {
      if (w > origMeta.width) continue; // never upscale
      const wWebpName = `${baseName}_${w}.webp`;
      const wAvifName = `${baseName}_${w}.avif`;
      const resWebp = await sharp(srcFile)
        .resize({ width: w, withoutEnlargement: true })
        .webp({ quality: cfg.webpQuality, effort: 6 })
        .toFile(path.join(OUT_DIR, wWebpName));
      const resAvif = await sharp(srcFile)
        .resize({ width: w, withoutEnlargement: true })
        .avif({ quality: cfg.avifQuality, effort: 6 })
        .toFile(path.join(OUT_DIR, wAvifName));
      allWidthsData.push({
        width: w,
        webpSize: resWebp.size,
        avifSize: resAvif.size
      });
    }
    itemResult.allWidths = allWidthsData;

    results.push(itemResult);
    console.log(`Processed ${cfg.name}: Orig ${formatKB(origStats.size)} -> WebP ${formatKB(webpBuffer.size)} | AVIF ${formatKB(avifBuffer.size)}`);
  }

  // Process Logos
  console.log('\n--- Processing Logos (Lossless) ---');
  const logoResults = [];
  for (const cfg of LOGOS_CONFIG) {
    const srcFile = path.join(LOGO_DIR, cfg.name);
    if (!fs.existsSync(srcFile)) continue;

    const origStats = fs.statSync(srcFile);
    const origMeta = await sharp(srcFile).metadata();
    const baseName = path.parse(cfg.name).name;

    // Original copy
    const origCopyName = `orig_${cfg.name}`;
    fs.copyFileSync(srcFile, path.join(OUT_DIR, origCopyName));

    const logoEntry = {
      name: cfg.name,
      role: cfg.role,
      origWidth: origMeta.width,
      origHeight: origMeta.height,
      origSize: origStats.size,
      origCopyName,
      variants: []
    };

    for (const d of cfg.displaySizes) {
      // 1. Lossless WebP
      const webpName = `${baseName}${d.suffix}.webp`;
      const webpRes = await sharp(srcFile)
        .resize({ width: d.width, withoutEnlargement: true })
        .webp({ lossless: true, effort: 6 })
        .toFile(path.join(OUT_DIR, webpName));

      // 2. Optimized Lossless PNG
      const pngName = `${baseName}${d.suffix}.png`;
      const pngRes = await sharp(srcFile)
        .resize({ width: d.width, withoutEnlargement: true })
        .png({ compressionLevel: 9, adaptiveFiltering: true, palette: false })
        .toFile(path.join(OUT_DIR, pngName));

      logoEntry.variants.push({
        suffix: d.suffix,
        width: d.width,
        webpName,
        webpSize: webpRes.size,
        pngName,
        pngSize: pngRes.size
      });
    }
    logoResults.push(logoEntry);
    console.log(`Processed logo ${cfg.name}: Orig ${formatKB(origStats.size)} -> WebP 2x ${formatKB(logoEntry.variants[0].webpSize)}`);
  }

  // Generate HTML
  generateHtml(results, logoResults);
  console.log('\nHTML comparison page generated at:', HTML_FILE);
}

function generateHtml(items, logos) {
  const totalOrigBytes = items.reduce((acc, i) => acc + i.origSize, 0);
  const totalWebpBytes = items.reduce((acc, i) => acc + i.variants.webpSize, 0);
  const totalAvifBytes = items.reduce((acc, i) => acc + i.variants.avifSize, 0);

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perbandingan Visual & Kompresi Gambar — MA Margajaya</title>
  <style>
    :root {
      --bg: #0b1120;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --emerald: #10b981;
      --gold: #f59e0b;
      --border: #334155;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.5;
      padding: 2rem 1rem 4rem;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      background: linear-gradient(135deg, #064e3b, #0f172a);
      padding: 2.5rem;
      border-radius: 1.25rem;
      border: 1px solid rgba(16, 185, 129, 0.2);
      margin-bottom: 2.5rem;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: 0.5rem; color: #fff; }
    .subtitle { color: #a7f3d0; font-size: 1.1rem; }
    .stats-bar {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-top: 1.5rem;
    }
    .stat-box {
      background: rgba(0,0,0,0.3);
      padding: 1.2rem;
      border-radius: 0.75rem;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .stat-label { font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-muted); }
    .stat-value { font-size: 1.6rem; font-weight: 700; margin-top: 0.25rem; }
    .text-emerald { color: #34d399; }
    .text-gold { color: #fbbf24; }
    
    .section-title {
      font-size: 1.5rem;
      font-weight: 700;
      margin: 2.5rem 0 1.25rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: #fff;
    }
    .section-title::before {
      content: '';
      display: inline-block;
      width: 6px;
      height: 24px;
      background: var(--emerald);
      border-radius: 3px;
    }

    .card {
      background: var(--card-bg);
      border: 1px solid var(--border);
      border-radius: 1rem;
      padding: 1.5rem;
      margin-bottom: 2rem;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1.25rem;
      flex-wrap: wrap;
      gap: 1rem;
      border-bottom: 1px solid var(--border);
      padding-bottom: 1rem;
    }
    .card-title { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .card-role { font-size: 0.85rem; color: #38bdf8; font-weight: 600; }
    .card-badges { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.65rem;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 600;
    }
    .badge-gray { background: #334155; color: #cbd5e1; }
    .badge-emerald { background: rgba(16, 185, 129, 0.2); color: #6ee7b7; border: 1px solid rgba(16, 185, 129, 0.3); }
    .badge-blue { background: rgba(56, 189, 248, 0.2); color: #7dd3fc; border: 1px solid rgba(56, 189, 248, 0.3); }

    .comparison-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
      gap: 1.5rem;
    }
    .image-panel {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .image-panel-header {
      padding: 0.75rem 1rem;
      background: #1e293b;
      font-size: 0.85rem;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #334155;
    }
    .image-view-wrapper {
      position: relative;
      background: #020617;
      min-height: 240px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    .image-view-wrapper img {
      width: 100%;
      height: 280px;
      object-fit: cover;
      display: block;
      transition: transform 0.3s ease;
      cursor: zoom-in;
    }
    .image-view-wrapper img:hover {
      transform: scale(1.4);
      z-index: 20;
    }
    .panel-footer {
      padding: 0.75rem 1rem;
      background: #0f172a;
      font-size: 0.8rem;
      color: var(--text-muted);
      border-top: 1px solid #1e293b;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .placeholder-preview {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .blur-thumb {
      width: 28px;
      height: 20px;
      border-radius: 3px;
      object-fit: cover;
      border: 1px solid #475569;
    }
    .color-chip {
      width: 16px;
      height: 16px;
      border-radius: 3px;
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.2);
    }

    /* Breakpoint table */
    .responsive-table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 1rem;
      font-size: 0.8rem;
    }
    .responsive-table th, .responsive-table td {
      padding: 0.5rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid #334155;
    }
    .responsive-table th { color: var(--text-muted); font-weight: 600; }

    /* Logos */
    .logo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1.5rem;
    }
    .logo-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 0.75rem;
      padding: 1.25rem;
      text-align: center;
    }
    .logo-preview-box {
      background: #ffffff;
      border-radius: 0.5rem;
      padding: 1.5rem;
      margin: 1rem 0;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 120px;
    }
    .logo-preview-box img { max-height: 80px; width: auto; object-fit: contain; }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Audit & Perbandingan Optimasi Gambar</h1>
      <p class="subtitle">Evaluasi Visual Kompresi Gambar MA Margajaya — Original (assets-src/) vs WebP vs AVIF</p>
      
      <div class="stats-bar">
        <div class="stat-box">
          <div class="stat-label">Total Ukuran Asli</div>
          <div class="stat-value text-gold">${formatKB(totalOrigBytes)}</div>
          <small style="color: #94a3b8;">14 Foto Full Original</small>
        </div>
        <div class="stat-box">
          <div class="stat-label">Hasil WebP (Q=80-85)</div>
          <div class="stat-value text-emerald">${formatKB(totalWebpBytes)}</div>
          <small class="text-emerald">Hemat -${((1 - totalWebpBytes / totalOrigBytes) * 100).toFixed(1)}%</small>
        </div>
        <div class="stat-box">
          <div class="stat-label">Hasil AVIF (Q=55-65)</div>
          <div class="stat-value text-emerald">${formatKB(totalAvifBytes)}</div>
          <small class="text-emerald">Hemat -${((1 - totalAvifBytes / totalOrigBytes) * 100).toFixed(1)}%</small>
        </div>
        <div class="stat-box">
          <div class="stat-label">Penghematan Payload</div>
          <div class="stat-value text-emerald">-${formatKB(totalOrigBytes - totalAvifBytes)}</div>
          <small style="color: #38bdf8;">Visual pixel-perfect & tajam</small>
        </div>
      </div>
    </header>

    <h2 class="section-title">Foto & Banner Halaman (14 Gambar)</h2>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Arahkan mouse ke atas foto untuk memperbesar (zoom in 1.4x) guna memeriksa artefak atau kehalusan gradien.</p>

    ${items.map(item => {
      const webpSavings = ((1 - item.variants.webpSize / item.origSize) * 100).toFixed(1);
      const avifSavings = ((1 - item.variants.avifSize / item.origSize) * 100).toFixed(1);

      return `
      <div class="card" id="${item.name}">
        <div class="card-header">
          <div>
            <div class="card-role">${item.role}</div>
            <div class="card-title">${item.name}</div>
          </div>
          <div class="card-badges">
            <span class="badge badge-gray">${item.origWidth} &times; ${item.origHeight} px</span>
            <span class="badge badge-blue">WebP Q=${item.variants.webpQuality}</span>
            <span class="badge badge-emerald">AVIF Q=${item.variants.avifQuality}</span>
            <div class="placeholder-preview">
              <span class="color-chip" style="background: ${item.dominantColor}" title="Dominant: ${item.dominantColor}"></span>
              <img src="${item.blurData}" class="blur-thumb" title="Blur Placeholder" alt="blur" />
              <span>Placeholder</span>
            </div>
          </div>
        </div>

        <div class="comparison-grid">
          <!-- ORIGINAL -->
          <div class="image-panel">
            <div class="image-panel-header">
              <span>Original (${item.origFormat.toUpperCase()})</span>
              <span style="color: #fbbf24;">${formatKB(item.origSize)}</span>
            </div>
            <div class="image-view-wrapper">
              <img src="compare-assets/${item.variants.origCopyName}" alt="Original" loading="lazy" />
            </div>
            <div class="panel-footer">
              <span>Resolusi Asli: ${item.origWidth}&times;${item.origHeight}</span>
              <span>100% Uncompressed</span>
            </div>
          </div>

          <!-- WEBP -->
          <div class="image-panel">
            <div class="image-panel-header">
              <span>Hasil WebP (${item.variants.primaryWidth}px)</span>
              <span class="text-emerald">${formatKB(item.variants.webpSize)} (-${webpSavings}%)</span>
            </div>
            <div class="image-view-wrapper">
              <img src="compare-assets/${item.variants.webpName}" alt="WebP" loading="lazy" />
            </div>
            <div class="panel-footer">
              <span>Quality: ${item.variants.webpQuality}</span>
              <span class="text-emerald">Hemat ${(item.origSize / item.variants.webpSize).toFixed(1)}&times;</span>
            </div>
          </div>

          <!-- AVIF -->
          <div class="image-panel">
            <div class="image-panel-header">
              <span>Hasil AVIF (${item.variants.primaryWidth}px)</span>
              <span class="text-emerald">${formatKB(item.variants.avifSize)} (-${avifSavings}%)</span>
            </div>
            <div class="image-view-wrapper">
              <img src="compare-assets/${item.variants.avifName}" alt="AVIF" loading="lazy" />
            </div>
            <div class="panel-footer">
              <span>Quality: ${item.variants.avifQuality}</span>
              <span class="text-emerald">Hemat ${(item.origSize / item.variants.avifSize).toFixed(1)}&times;</span>
            </div>
          </div>
        </div>

        <!-- Multi-width Breakpoints Table -->
        <table class="responsive-table">
          <thead>
            <tr>
              <th>Breakpoint Width</th>
              <th>WebP Size</th>
              <th>AVIF Size</th>
              <th>Penghematan vs Asli</th>
              <th>Peruntukan Viewport</th>
            </tr>
          </thead>
          <tbody>
            ${item.allWidths.map(w => `
              <tr>
                <td><strong>${w.width}px</strong></td>
                <td>${formatKB(w.webpSize)}</td>
                <td class="text-emerald">${formatKB(w.avifSize)}</td>
                <td>-${((1 - w.avifSize / item.origSize) * 100).toFixed(1)}%</td>
                <td style="color: var(--text-muted);">${w.width <= 480 ? 'Mobile (360-480px)' : w.width <= 828 ? 'Tablet / Small Desktop' : 'Full Desktop (1024px+)'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      `;
    }).join('')}

    <h2 class="section-title">Logo Sekolah & Ponpes (Lossless)</h2>
    <p style="color: var(--text-muted); margin-bottom: 1.5rem;">Logo diproses secara Lossless (tanpa kehilangan ketajaman atau blur pada teks/garis logo), dengan ukuran 2x display untuk retina display.</p>

    <div class="logo-grid">
      ${logos.map(logo => `
        <div class="logo-card">
          <div style="font-weight: 700; color: #fff;">${logo.name}</div>
          <div style="font-size: 0.8rem; color: #38bdf8; margin-bottom: 0.5rem;">${logo.role}</div>
          <div class="badge badge-gray" style="margin-bottom: 0.5rem;">Asli: ${logo.origWidth}&times;${logo.origHeight} (${formatKB(logo.origSize)})</div>
          
          <div class="logo-preview-box">
            <img src="compare-assets/${logo.variants[0].webpName}" alt="${logo.name}" />
          </div>

          <div style="font-size: 0.8rem; text-align: left; background: #1e293b; padding: 0.75rem; border-radius: 0.5rem;">
            ${logo.variants.map(v => `
              <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                <span>${v.suffix.replace('-', '')} (${v.width}px):</span>
                <span><strong>WebP Lossless:</strong> <span class="text-emerald">${formatKB(v.webpSize)}</span></span>
              </div>
            `).join('')}
          </div>
        </div>
      `).join('')}
    </div>

  </div>
</body>
</html>`;

  fs.writeFileSync(HTML_FILE, html, 'utf8');
}

run().catch(console.error);
