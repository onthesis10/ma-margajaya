const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function run() {
  console.log('=== OPTIMIZING IMAGES WITH SHARP ===\n');

  // 1. Optimize Logos in public/logo (keeping exact paths for JSON-LD, max 512px, <100KB)
  const logoDir = path.join(__dirname, '..', 'public', 'logo');
  if (fs.existsSync(logoDir)) {
    const logos = [
      { file: 'logo-ma-margajaya.png', max: 512 },
      { file: 'logo-ponpes-darul-muawanah.png', max: 512 },
      { file: 'school-logo.png', max: 512 },
    ];

    for (const item of logos) {
      const srcPath = path.join(logoDir, item.file);
      if (fs.existsSync(srcPath)) {
        const initialSize = fs.statSync(srcPath).size;
        const tempPath = srcPath + '.tmp.png';

        // Resize to max 512px and compress
        await sharp(srcPath)
          .resize({ width: item.max, height: item.max, fit: 'inside', withoutEnlargement: true })
          .png({ compressionLevel: 9, quality: 85, effort: 10 })
          .toFile(tempPath);

        fs.renameSync(tempPath, srcPath);
        const finalSize = fs.statSync(srcPath).size;
        console.log(`[Logo 512px] ${item.file}: ${(initialSize/1024).toFixed(1)} KB -> ${(finalSize/1024).toFixed(1)} KB`);

        // Also create small 160px version for Header & Footer
        const smFile = item.file.replace('.png', '-sm.png');
        const smPath = path.join(logoDir, smFile);
        await sharp(srcPath)
          .resize({ width: 160, height: 160, fit: 'inside', withoutEnlargement: true })
          .png({ compressionLevel: 9, quality: 85, effort: 10 })
          .toFile(smPath);
        const smSize = fs.statSync(smPath).size;
        console.log(`[Logo 160px] ${smFile}: ${(smSize/1024).toFixed(1)} KB`);
      }
    }
  }

  // 2. Prepare src/assets/images and public/images/opt
  const srcAssetsDir = path.join(__dirname, '..', 'src', 'assets', 'images');
  if (!fs.existsSync(srcAssetsDir)) {
    fs.mkdirSync(srcAssetsDir, { recursive: true });
  }

  const pubImagesDir = path.join(__dirname, '..', 'public', 'images');
  const pubWebpDir = path.join(pubImagesDir, 'opt');
  if (!fs.existsSync(pubWebpDir)) {
    fs.mkdirSync(pubWebpDir, { recursive: true });
  }

  // List of images to optimize
  const imagesToOptimize = [
    { name: 'hero-bg-2', src: 'hero-bg-2.png', maxWidth: 1600, quality: 80 },
    { name: 'kepala-madrasah', src: 'kepala-madrasah.png', maxWidth: 800, quality: 82 },
    { name: 'gedung-kampus-ma-margajaya', src: 'gedung-kampus-ma-margajaya.png', maxWidth: 1600, quality: 80 },
    { name: 'gedung-ma-margajaya', src: 'gedung-ma-margajaya.jpg', maxWidth: 1200, quality: 80 },
    { name: 'fasilitas-masjid', src: 'fasilitas-masjid.png', maxWidth: 1200, quality: 80 },
    { name: 'fasilitas-halaman', src: 'fasilitas-halaman.png', maxWidth: 1200, quality: 80 },
    { name: 'fasilitas-masjid2', src: 'fasilitas-masjid2.png', maxWidth: 1200, quality: 80 },
    { name: 'poto-bottom', src: 'poto-bottom.jpeg', maxWidth: 1200, quality: 80 },
    { name: 'organisasi-futsal', src: 'organisasi-futsal.png', maxWidth: 800, quality: 80 },
    { name: 'organisasi-osis', src: 'organisasi-osis.jpeg', maxWidth: 800, quality: 80 },
    { name: 'organisasi-paskibra', src: 'organisasi-paskibra.jpeg', maxWidth: 800, quality: 80 },
    { name: 'organisasi-pramuka', src: 'organisasi-pramuka.jpeg', maxWidth: 800, quality: 80 },
    { name: 'organisasi-voli', src: 'organisasi-voli.jpeg', maxWidth: 800, quality: 80 },
    { name: 'pramuka', src: 'pramuka.jpeg', maxWidth: 800, quality: 80 },
  ];

  console.log('\n=== GENERATING WEBP ASSETS ===\n');

  for (const item of imagesToOptimize) {
    const srcFile = path.join(pubImagesDir, item.src);
    if (!fs.existsSync(srcFile)) {
      console.warn(`File not found: ${srcFile}`);
      continue;
    }
    const initialSize = fs.statSync(srcFile).size;

    // Output to src/assets/images and public/images/opt (for static reference)
    const outSrcPath = path.join(srcAssetsDir, `${item.name}.webp`);
    const outPubPath = path.join(pubWebpDir, `${item.name}.webp`);

    await sharp(srcFile)
      .resize({ width: item.maxWidth, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: item.quality, effort: 6 })
      .toFile(outSrcPath);

    fs.copyFileSync(outSrcPath, outPubPath);

    const finalSize = fs.statSync(outSrcPath).size;
    console.log(`[WebP] ${item.name}.webp: ${(initialSize/1024).toFixed(1)} KB -> ${(finalSize/1024).toFixed(1)} KB (Saved ${(((initialSize-finalSize)/initialSize)*100).toFixed(1)}%)`);
  }

  console.log('\n✅ Image optimization completed successfully.');
}

run().catch(err => {
  console.error('Error during image optimization:', err);
  process.exit(1);
});
