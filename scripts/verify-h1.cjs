const fs = require('fs');
const path = require('path');

let allSingle = true;

function scanH1(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      scanH1(full);
    } else if (f.endsWith('.html') && !full.includes('admin')) {
      const html = fs.readFileSync(full, 'utf8');
      const matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
      const isSingle = matches.length === 1;
      if (!isSingle) allSingle = false;
      const status = isSingle ? '✅ TEPAT 1 H1' : `⚠️ ${matches.length} H1`;
      console.log(`[${status}] ${full}`);
      matches.forEach((m, idx) => {
        const text = m.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        console.log(`   H1: "${text}"`);
      });
      console.log('');
    }
  }
}

console.log('=== AUDIT HIERARKI H1 HALAMAN PUBLIK (DIST) ===\n');
scanH1('dist');

if (allSingle) {
  console.log('🎉 SEMPURNA! Setiap halaman publik memiliki TEPAT 1 tag <h1>.');
} else {
  console.log('⚠️ Masih ada halaman dengan lebih dari 1 tag <h1>.');
}
