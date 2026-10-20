const fs = require('fs');

const content = fs.readFileSync('src/pages/ppdb.astro', 'utf8');
const lines = content.split(/\r?\n/);
const keywords = ['gelombang', 'jadwal', 'biaya', 'rp', 'beasiswa', 'potongan', 'gratis', 'bantuan', 'gel.', 'waktu', 'buka', 'tutup', 'tahap'];

console.log('=== TEMUAN KATA KUNCI DI PPDB.ASTRO ===\n');
lines.forEach((line, i) => {
  const lower = line.toLowerCase();
  for (const kw of keywords) {
    if (lower.includes(kw)) {
      console.log(`Line ${i + 1} [kata: "${kw}"]:`);
      console.log(`   ${line.trim()}\n`);
      break;
    }
  }
});
