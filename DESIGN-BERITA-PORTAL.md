# DESIGN + LOGIC — Portal Berita MA Margajaya (`/berita`)

Redesain `/berita` menjadi layout portal berita modern (hero, berita terbaru, sorotan, paling banyak dibaca, populer, sidebar).
**Urutan seksi ditentukan oleh data nyata (traffic dan tren), bukan ditulis manual.**

Dokumen ini melengkapi `DESIGN-IMAGE-CARDS.md`. Di `/berita`, layout portal ini menggantikan lightbox: kartu berita adalah **tautan nyata** ke `/berita/[slug]`. Efek "foto hidup" (Ken Burns pelan, zoom saat hover) dari dokumen itu tetap dipakai di thumbnail.

## 1. Pemetaan layout referensi ke seksi

| Referensi | Nama di situs | Isi | Sumber urutan |
|---|---|---|---|
| Hero besar | **Sorotan Utama** | 1 berita, gambar penuh + gradien hijau tua, judul, ringkasan, tombol "Baca" | `headline=TRUE` di Sheet, jika tidak ada: skor tren tertinggi 3 hari terakhir, jika data belum ada: terbaru |
| News Today | **Berita Terbaru** | 3 kartu (gambar, judul, ringkasan, tanggal) + "Lihat Semua" | Terbaru berdasarkan tanggal |
| Cerita besar + teks | **Pilihan Redaksi** | 1 berita dengan gambar besar, ringkasan panjang, tombol "Baca Selengkapnya" | `unggulan=TRUE`, jika tidak ada: teratas "Paling Banyak Dibaca" yang belum tampil |
| Most Watched | **Paling Banyak Dibaca** | 2 kartu + lencana jumlah dibaca | Views 7 hari terakhir |
| Popular | **Populer** | Grid 2×2 | Views 30 hari terakhir |
| Sidebar Recent/Popular | **Terbaru / Terpopuler** | Tab, 6 item (thumbnail kecil, tanggal, judul) | Terbaru: tanggal; Terpopuler: views 30 hari |
| Select Topic | **Pilih Topik** | Daftar kategori + jumlah artikel | Dihitung otomatis dari kolom kategori |
| Sign up for News | **Ikuti Kami** | Tombol WhatsApp Channel / Instagram / Facebook madrasah yang sudah ada | Tanpa form email (tidak ada backend dan tidak mengumpulkan data pribadi) |

Aturan tampilan:
- **Tanpa duplikat**: satu artikel hanya muncul sekali di area utama (hero, terbaru, pilihan, dibaca, populer). Sidebar boleh mengulang. Urutan prioritas pengisian: hero, pilihan redaksi, terbaru, paling banyak dibaca, populer.
- Lencana jumlah dibaca (mis. "1,2 rb dibaca") **hanya tampil jika ≥ 100**. Angka kecil tidak ditampilkan agar tidak terkesan sepi.
- Jika artikel kurang dari kebutuhan seksi, seksi itu otomatis menyusut atau disembunyikan (jangan ada kotak kosong).
- Pakai font dan token hijau yang sudah ada. Judul hero dan Pilihan Redaksi boleh memakai serif display situs agar selaras dengan panel editorial; sisanya bersih dan modern.
- Mobile: satu kolom; sidebar turun ke bawah (tab Terbaru/Terpopuler, Pilih Topik, Ikuti Kami).

## 2. Logika tren dan traffic

### 2.1 Prinsip
- Situs statis (Astro di Vercel), jadi **ranking dihitung di dua tempat**:
  1. **Saat build**: data statistik terakhir diambil dan urutan awal ditulis ke HTML (SEO baik, tanpa kedip).
  2. **Di browser**: skrip kecil mengambil statistik terbaru (cache 10 menit) dan **menyusun ulang** seksi bertanda `data-live`. Tidak perlu rebuild setiap ada yang membaca.
- Penghitung kunjungan sendiri (Google Apps Script + Google Sheets), tanpa cookie dan tanpa menyimpan IP atau data pribadi. Konsisten dengan arsitektur yang sudah dipakai untuk berita.
- Jika statistik gagal diambil atau masih kosong: **fallback ke urutan terbaru**. Halaman tidak boleh kosong atau rusak.

### 2.2 Penyimpanan (Google Sheets)
Sheet baru `views_daily` dengan kolom: `tanggal` (yyyy-MM-dd), `slug`, `jumlah`. Satu baris per artikel per hari. Tidak ada data pengunjung.
Kolom baru (opsional, kompatibel mundur) di sheet berita: `headline`, `unggulan`. Jika kolom `kategori` belum ada, tambahkan.

### 2.3 Apps Script (`google-apps-script/Code.gs`)
- **`doPost` (hit)**: body teks JSON `{slug, cid}`. Langkah:
  1. validasi `slug` ada di sheet berita;
  2. dedupe: `CacheService` key `v:{cid}:{slug}` selama 6 jam. Jika ada, abaikan;
  3. `LockService` (tunggu maks 5 detik), cari baris `tanggal+slug` dan tambah 1, atau buat baris baru;
  4. hapus cache statistik.
  Respons selalu cepat dan kecil.
- **`doGet?action=stats`**: JSON `{updatedAt, items:[{slug, v24h, v7d, v30d, total}]}` dihitung dari `views_daily`, **di-cache `CacheService` 10 menit**. Perilaku `doGet` lama untuk daftar berita tidak boleh berubah.
- Pencatatan memakai `Content-Type: text/plain` dari `navigator.sendBeacon` / `fetch` agar tidak memicu preflight CORS.
- Jaga kuota Apps Script: tanpa penulisan per tampilan beruntun, kunci singkat, dan statistik selalu dari cache.

### 2.4 Kapan satu kunjungan dihitung (klien: `src/scripts/view-counter.ts`, hanya di `berita/[slug]`)
Hitung hanya jika semua terpenuhi:
- tab terlihat (`visibilityState === 'visible'`) selama **≥ 5 detik**;
- bukan bot (`navigator.webdriver` salah, UA tidak cocok pola bot umum);
- `localStorage.nocount !== '1'` (admin/penulis bisa menandai browsernya agar tidak terhitung);
- belum dihitung di sesi ini untuk slug yang sama (`sessionStorage`).
`cid` = ID acak di `localStorage` (bukan identitas, tidak terkait orang).

### 2.5 Rumus skor (`src/lib/trending.ts`, bobot di satu objek konfigurasi yang mudah diubah)
```
mostWatched = v7d
popular     = v30d
trending    = (v24h * 3 + v7d) / (umurHari + 2) ^ 1.3     // makin baru dan makin ramai, makin tinggi
                                                            // (gaya "gravity")
```
- Ambang minimum: artikel dengan `v7d < 3` tidak masuk peringkat tren (kurang data, mudah terdistorsi).
- **Campuran dengan kebaruan** saat traffic masih rendah: skor akhir = `0.7 * skorNormal + 0.3 * skorKebaruan`, bobot beralih otomatis ke kebaruan jika total views seluruh situs 7 hari < 50.
- Satu fungsi murni `rankArticles(articles, stats, now)` dipakai di build dan di browser (satu sumber logika), dengan **unit test** (`vitest` atau skrip node sederhana) untuk: tanpa statistik, ketiadaan artikel, seri skor, dan deduplikasi antar seksi.

### 2.6 Pembaruan di browser (`src/scripts/news-live.ts`)
- Ambil `?action=stats` (cache `sessionStorage` 10 menit), hitung ulang, urutkan ulang elemen berpenanda `data-live="mostwatched|popular|trending|sidebar-popular"`.
- Susun ulang DOM dengan transisi fade pendek. Jika ukuran/gambar berubah, tidak boleh ada layout shift (tinggi slot tetap).
- Jika fetch gagal: diam, biarkan urutan hasil build.

## 3. Topik
- Generate halaman statis `/berita/topik/[topik]` lewat `getStaticPaths` dari kolom kategori (bukan filter berbasis query) supaya bisa dirayapi Google dan masuk sitemap otomatis. Judul dan deskripsi unik per topik lewat `SEO.astro`.
- "Pilih Topik" di sidebar menampilkan nama + jumlah artikel, tertaut ke halaman topik.

## 4. SEO, kinerja, aksesibilitas (wajib)
- Semua teks kartu (judul, ringkasan, tanggal) ada di HTML hasil build. Kartu = `<a>` nyata.
- Satu `<h1>` per halaman (judul halaman), judul seksi `<h2>`, judul kartu `<h3>`.
- `<img>`: `alt` deskriptif, `width`/`height` eksplisit, `loading="lazy"` kecuali hero. Gambar Drive pakai `lh3.googleusercontent.com/d/ID=w{ukuran}`.
- `prefers-reduced-motion`: matikan Ken Burns dan transisi susun ulang.
- JSON-LD dan sitemap tidak rusak; halaman topik masuk sitemap.
- Tanpa library baru kecuali perangkat uji ringan jika diperlukan. JavaScript klien total < 6 KB.
- Privasi: tidak ada cookie, tidak ada IP, tidak ada data pribadi. Boleh ditambahkan satu kalimat transparansi di footer: "Situs ini menghitung jumlah pembaca secara anonim."

## 5. Kriteria selesai
- [ ] Layout sesuai pemetaan di bagian 1, rapi di mobile dan desktop.
- [ ] Mengubah traffic (uji dengan data palsu di `views_daily`) mengubah urutan "Paling Banyak Dibaca", "Populer", dan hero tanpa rebuild.
- [ ] Tanpa statistik: halaman tetap lengkap (fallback terbaru), tanpa error di konsol.
- [ ] Tidak ada artikel duplikat di area utama.
- [ ] Unit test `rankArticles` lolos.
- [ ] `npm run build` sukses; `verify-h1.cjs` dan `check-img-alt.cjs` lolos; halaman topik ada di `sitemap-0.xml`.
- [ ] Lighthouse mobile tidak turun dari sebelumnya.
- [ ] Panduan singkat `google-apps-script/STATS_SETUP.md`: cara membuat sheet `views_daily`, deploy ulang Web App, dan menguji dengan `?action=stats`.
