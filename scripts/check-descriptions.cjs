const descriptions = [
  {
    page: "Beranda (/)",
    file: "src/pages/index.astro",
    title: "MA Margajaya Sukadana — Madrasah Aliyah Terpadu Ciamis",
    desc: "Website resmi MA Margajaya Sukadana, Ciamis. Pendidikan Islam terpadu bersama Ponpes Darul Muawanah di bawah naungan Kemenag dan Yayasan PUI Ciamis."
  },
  {
    page: "Profil (/profil)",
    file: "src/pages/profil.astro",
    title: "Profil Madrasah & Pondok Pesantren",
    desc: "Mengenal MA Margajaya Sukadana, Ciamis: sejarah pendirian, visi misi, profil kepala madrasah, dan sinergi terpadu bersama Ponpes Darul Muawanah."
  },
  {
    page: "Akademik (/akademik)",
    file: "src/pages/akademik.astro",
    title: "Akademik & Kurikulum Terpadu",
    desc: "Program pendidikan MA Margajaya memadukan kurikulum madrasah Kemenag RI dengan pengkajian kitab kuning dan kepesantrenan di Ponpes Darul Muawanah."
  },
  {
    page: "Kesiswaan (/kesiswaan)",
    file: "src/pages/kesiswaan.astro",
    title: "Kesiswaan, Organisasi & Ekstrakurikuler",
    desc: "Kegiatan santri MA Margajaya Sukadana: organisasi OSIS & MPK, kepanduan Pramuka, tradisi keagamaan santri, serta pembinaan akhlak dan kepemimpinan."
  },
  {
    page: "Fasilitas (/fasilitas)",
    file: "src/pages/fasilitas.astro",
    title: "Fasilitas & Sarana Prasarana Belajar",
    desc: "Sarana prasarana belajar MA Margajaya di Kompleks Ponpes Darul Muawanah Sukadana: gedung kelas, masjid santri, asrama pondok, dan area olahraga."
  },
  {
    page: "Galeri (/galeri)",
    file: "src/pages/galeri.astro",
    title: "Galeri Foto & Dokumentasi Kegiatan",
    desc: "Dokumentasi visual aktivitas belajar, kegiatan keagamaan santri, kepanduan, dan momen silaturahmi keluarga besar MA Margajaya Sukadana, Ciamis."
  },
  {
    page: "PPDB (/ppdb)",
    file: "src/pages/ppdb.astro",
    title: "PPDB 2027/2028 — Penerimaan Santri Baru",
    desc: "Penerimaan Peserta Didik Baru (PPDB) MA Margajaya Sukadana T.A. 2027/2028. Informasi syarat berkas, alur pendaftaran, dan konsultasi via WhatsApp."
  },
  {
    page: "Kontak (/kontak)",
    file: "src/pages/kontak.astro",
    title: "Kontak & Alamat Madrasah",
    desc: "Hubungi MA Margajaya Sukadana via WA 0813-2287-6849 atau kunjungi Kompleks Ponpes Darul Muawanah, Jln. Ciilat - Gardu Margajaya, Sukadana, Ciamis 46272."
  },
  {
    page: "Berita Index (/berita)",
    file: "src/pages/berita/index.astro",
    title: "Warta & Publikasi Berita Madrasah",
    desc: "Kumpulan warta resmi, publikasi kegiatan santri, agenda kepesantrenan, dan pengumuman terbaru civitas akademika MA Margajaya Sukadana, Ciamis."
  },
  {
    page: "Berita Fallback (/berita/[slug])",
    file: "src/pages/berita/[slug].astro",
    title: "{article.judul} (Dinamis)",
    desc: "Warta dan informasi resmi civitas akademika MA Margajaya Sukadana bersama Pondok Pesantren Darul Muawanah, Jln. Ciilat - Gardu Margajaya, Ciamis."
  }
];

console.log("=== PEMERIKSAAN PANJANG META DESCRIPTION (TARGET: 140 - 160 KARAKTER) ===");
let allValid = true;

descriptions.forEach((item, index) => {
  const len = item.desc.length;
  const isValid = len >= 140 && len <= 160;
  if (!isValid) allValid = false;
  const status = isValid ? "✅ PAS" : (len < 140 ? "❌ KURANG" : "❌ LEBIH");
  console.log(`${index + 1}. [${status}] ${item.page.padEnd(30)} : ${len} karakter`);
  console.log(`   "${item.desc}"\n`);
});

if (allValid) {
  console.log("🎉 SEMUA META DESCRIPTION LOLOS VALIDASI 140 - 160 KARAKTER!");
} else {
  console.error("⚠️ Ada deskripsi yang belum memenuhi rentang 140-160 karakter.");
  process.exit(1);
}
