#!/usr/bin/env node
/**
 * restore-originals.cjs
 * Restore original images from git history to assets-src/
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const COMMIT = '9e3c8ca';
const DEST = 'assets-src';

const FILES = [
  'public/images/fasilitas-halaman.png',
  'public/images/fasilitas-masjid.png',
  'public/images/fasilitas-masjid2.png',
  'public/images/gedung-kampus-ma-margajaya.png',
  'public/images/gedung-ma-margajaya.jpg',
  'public/images/hero-bg-2.png',
  'public/images/kepala-madrasah.png',
  'public/images/organisasi-futsal.png',
  'public/images/organisasi-osis.jpeg',
  'public/images/organisasi-paskibra.jpeg',
  'public/images/organisasi-pramuka.jpeg',
  'public/images/organisasi-voli.jpeg',
  'public/images/poto-bottom.jpeg',
  'public/images/pramuka.jpeg',
];

fs.mkdirSync(DEST, { recursive: true });

for (const file of FILES) {
  const baseName = path.basename(file);
  const destPath = path.join(DEST, baseName);
  try {
    const buf = execSync(`git show ${COMMIT}:${file}`, { maxBuffer: 50 * 1024 * 1024 });
    fs.writeFileSync(destPath, buf);
    const kb = (buf.length / 1024).toFixed(1);
    console.log(`✅ ${baseName} — ${kb} KB`);
  } catch (e) {
    console.log(`❌ ${baseName} — ${e.message}`);
  }
}

// Report
console.log('\n📁 assets-src/:');
for (const f of fs.readdirSync(DEST)) {
  const kb = (fs.statSync(path.join(DEST, f)).size / 1024).toFixed(1);
  console.log(`   ${f.padEnd(40)} ${kb} KB`);
}
