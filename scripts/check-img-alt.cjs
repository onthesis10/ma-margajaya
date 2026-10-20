const fs = require('fs');
const path = require('path');

let missingAltCount = 0;
let totalImgCount = 0;

function checkImgAlt(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      checkImgAlt(full);
    } else if (f.endsWith('.astro')) {
      const content = fs.readFileSync(full, 'utf8');
      const imgRegex = /<img\s+([^>]*?)>/gi;
      let match;
      while ((match = imgRegex.exec(content)) !== null) {
        totalImgCount++;
        const tag = match[0];
        const altMatch = tag.match(/alt=["'](.*?)["']/i) || tag.match(/alt=\{([^}]+)\}/i);
        if (!altMatch) {
          missingAltCount++;
          console.log(`⚠️ MISSING ALT di ${full}:\n   ${tag}\n`);
        }
      }
    }
  }
}

console.log('=== AUDIT ATRIBUT ALT PADA TAG <img> ===\n');
checkImgAlt('src');
console.log(`Total elemen <img> diperiksa: ${totalImgCount}`);
console.log(`Elemen tanpa alt: ${missingAltCount}`);
if (missingAltCount === 0) {
  console.log('✅ SEMUA TAG <img> MEMILIKI ATRIBUT ALT YANG VALID!');
}
