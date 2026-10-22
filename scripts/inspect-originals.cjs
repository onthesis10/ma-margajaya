#!/usr/bin/env node
/**
 * inspect-originals.cjs
 * Check dimensions and metadata of original images in assets-src/
 */
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function main() {
  const dir = 'assets-src';
  const files = fs.readdirSync(dir).filter(f => /\.(png|jpg|jpeg)$/i.test(f));
  
  console.log('Image'.padEnd(44) + 'Width'.padEnd(8) + 'Height'.padEnd(8) + 'Channels'.padEnd(10) + 'Size (KB)');
  console.log('-'.repeat(80));
  
  for (const f of files) {
    const fp = path.join(dir, f);
    const kb = (fs.statSync(fp).size / 1024).toFixed(1);
    try {
      const meta = await sharp(fp).metadata();
      const flag = meta.width < 800 ? ' ⚠️ LOW RES' : '';
      console.log(f.padEnd(44) + String(meta.width).padEnd(8) + String(meta.height).padEnd(8) + String(meta.channels).padEnd(10) + kb + flag);
    } catch(e) {
      console.log(f.padEnd(44) + 'ERROR: ' + e.message);
    }
  }
}

main();
