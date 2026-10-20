const fs = require('fs');

const pages = [
  { name: 'Beranda', file: 'dist/index.html' },
  { name: 'Profil', file: 'dist/profil/index.html' },
  { name: 'Akademik', file: 'dist/akademik/index.html' },
  { name: 'Kesiswaan', file: 'dist/kesiswaan/index.html' },
  { name: 'Fasilitas', file: 'dist/fasilitas/index.html' },
  { name: 'Galeri', file: 'dist/galeri/index.html' },
  { name: 'PPDB', file: 'dist/ppdb/index.html' },
  { name: 'Kontak', file: 'dist/kontak/index.html' },
  { name: 'Berita Index', file: 'dist/berita/index.html' },
  { name: 'Berita Detail 1', file: 'dist/berita/peringatan-maulid-nabi-muhammad-saw-ma-margajaya-gelar-muludan-921183/index.html' },
  { name: 'Berita Detail 2', file: 'dist/berita/peringatan-maulid-nabi-di-ma-margajaya-052196/index.html' },
];

console.log('=== AUDIT HASIL BUILD METADATA SEO (DIST) ===\n');

pages.forEach((p, idx) => {
  if (!fs.existsSync(p.file)) {
    console.log(`[FILE MISSING] ${p.file}`);
    return;
  }
  const html = fs.readFileSync(p.file, 'utf8');
  const titleMatch = html.match(/<title>(.*?)<\/title>/);
  const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["'](.*?)["']/);
  
  const title = titleMatch ? titleMatch[1] : 'N/A';
  const desc = descMatch ? descMatch[1] : 'N/A';
  const isValid = desc.length >= 140 && desc.length <= 160;
  
  console.log(`${idx + 1}. ${p.name}`);
  console.log(`   Judul  : ${title}`);
  console.log(`   Desc   : ${desc}`);
  console.log(`   Panjang: ${desc.length} karakter [${isValid ? 'PAS 140-160' : 'INVALID'}]\n`);
});
