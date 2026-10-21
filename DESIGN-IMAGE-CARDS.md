# DESIGN — "Living Photo Cards, Editorial Frame" MA Margajaya

Redesain UI preview gambar di `/galeri`, `/berita`, `/fasilitas`, `/kesiswaan`.
Tujuan: foto terasa **hidup**, dan saat diklik muncul panel keterangan bergaya **editorial museum**: elegan, tegas, estetik.

Referensi gaya (Dribbble): bingkai tebal berwarna solid dengan panel terbagi, judul serif tebal huruf kapital yang sangat rapat, kata beraksen bertulisan script miring yang menimpa judul, paragraf dengan penekanan abu-abu ke hitam, tombol kotak dengan panah, info kecil rata kanan, foto besar di panel samping.
**Ganti merah-oranye di referensi dengan hijau madrasah.** Latar krem hangat, bukan putih murni.

## 1. Prinsip
1. Desain yang sudah di-ACC kepala madrasah tidak berubah di luar 4 halaman ini. Header, footer, hero, dan warna dasar tetap.
2. **Warna hijau diambil dari token yang sudah ada** (`tailwind.config.*`, `src/styles/*`). Jangan membuat hijau baru. Satu-satunya warna tambahan yang boleh: krem hangat `paper` (turunan tipis dari hijau yang sama, atau token terang yang sudah ada). Jika situs sudah punya aksen emas (seperti di logo), pakai hanya untuk detail kecil.
3. Animasi halus, 300-700 ms, easing `cubic-bezier(.22,1,.36,1)`. Tidak berkedip, tidak ramai.
4. Konten (judul, kategori, keterangan) tetap ada di HTML saat build supaya terbaca Google. Pemisahan kata untuk animasi dilakukan di Astro (build time), bukan dengan JavaScript.
5. Tanpa library animasi. CSS + JavaScript vanilla kecil (< 4 KB).

## 2. Tipografi
- **Judul display:** serif kontras tinggi, tebal, huruf kapital, `line-height` ~0.85, `letter-spacing` negatif (-0.02em), ukuran besar (`clamp(2.5rem, 7vw, 6rem)`).
- **Aksen script:** satu kata/frasa pendek dari judul ditulis dengan font script miring, diputar -4 derajat, **menimpa** baris judul (efek seperti "A Story" di referensi). Warnanya hijau terang dengan outline krem tipis (`paint-order: stroke`) agar tetap terbaca di atas huruf judul.
- **Isi:** serif elegan (ukuran 1.05-1.25rem, `line-height` 1.35), rata kiri-kanan di desktop.
- **Meta/tombol:** sans-serif bersih, huruf kapital kecil, tracking lebar.
- Cek font yang SUDAH dipakai situs. Jika sudah ada serif display dan italic aksen (judul situs memakai bagian italic), pakai itu. Jika belum ada, tambahkan maksimal 2 font Google: misalnya **Playfair Display** (700/800/900) untuk display dan **Pinyon Script** untuk aksen, dimuat lewat `<link rel="preconnect">` + `<link rel="stylesheet">` dengan `display=swap`, bukan `@import`. Subset latin saja.

## 3. Komponen
`src/components/ui/PhotoCard.astro` + `src/scripts/photo-card.ts`, dipakai ulang di 4 halaman.

Props: `src`, `alt`, `title`, `titleAccent?` (kata untuk aksen script), `category`, `meta` (tanggal / lokasi), `description`, `href?`, `ctaLabel?`, `width`, `height`, `variant: 'lightbox' | 'expand'`, `priority?`.

### State 1 — Kartu diam ("hidup")
- Foto `object-cover`, radius sedang (sekitar 16 px) dengan **garis bingkai hijau tipis** (2 px) agar selaras dengan bahasa visual panel.
- **Ken Burns** sangat pelan: scale 1.00 ke 1.06 selama sekitar 14 s, bolak-balik, `animation-delay` acak per kartu.
- Scrim gradien hijau tua di bagian bawah. Chip kategori kapital kecil di kiri atas, judul satu baris di kiri bawah.
- Desktop: tilt ringan mengikuti kursor (maks 4 derajat, hanya `transform`). Nonaktif di layar sentuh.

### State 2 — Hover / fokus (desktop)
- Foto zoom 1.08. Bingkai hijau menebal dari 2 px ke 4 px.
- Tombol kotak kecil "LIHAT DETAIL →" naik dari bawah.

### State 3 — Klik / ketuk: panel editorial
Panel muncul di tengah layar di atas latar hijau-hitam 85% + blur. Kartu **membesar dari posisinya** (FLIP atau View Transitions API, fallback fade + scale).

**Layout desktop (mengikuti referensi):**
```
┌──────────────────────┬─────────────────┐
│  KATEGORI · TAHUN    │                 │
│  JUDUL BESAR KAPITAL │   FOTO BESAR    │
│  ~aksen script~      │   (Ken Burns    │
│  BERTUMPUK           │   pelan)        │
├──────────────────────┤                 │
│ [logo samar]         │                 │
│ Paragraf keterangan  │                 │
│ abu → hitam          │                 │
│ [ TOMBOL → ]  meta   │                 │
└──────────────────────┴─────────────────┘
```
- Seluruh panel dibingkai **garis hijau tebal (6-8 px)**; pembagi antar-panel juga 6-8 px, warna sama. Latar dalam krem `paper`.
- Panel kiri atas: chip kategori, judul display kapital, kata aksen script menimpa.
- Panel kiri bawah: ornamen samar di pojok (logo madrasah monokrom 10-15% opacity, **bukan** gambar elang). Paragraf keterangan. Tombol kotak hijau solid dengan teks krem dan panah (`BACA SELENGKAPNYA →` untuk berita, `TUTUP` untuk lainnya). Info meta kecil rata kanan (tanggal, lokasi).
- Panel kanan: foto penuh tinggi panel, `object-cover`.
- Teks keterangan: **efek reveal kata demi kata**. Saat panel terbuka, setiap kata beranimasi dari abu-abu (ink 35%) ke hitam penuh dengan stagger sekitar 18 ms, sehingga paragraf "menyala" dari awal ke akhir. Teks tetap ada di HTML (kata dibungkus `<span>` di Astro).
- Judul masuk dengan mask naik per baris, lalu aksen script menyusul dengan fade + miring ke posisi.
- Navigasi: tombol sebelumnya/berikutnya, counter "03 / 12", swipe di mobile. Tutup: tombol X, Esc, klik latar. Fokus kembali ke kartu asal.

**Layout mobile:** satu kolom, urutan: foto (rasio 4:5), judul + aksen, paragraf, tombol, meta. Bingkai tetap tebal tapi 4 px.

### Varian `expand` (fasilitas, kesiswaan di desktop)
- Baris kartu horizontal; kartu yang di-hover/diklik melebar dan menyempit yang lain. Isi kartu yang melebar memakai tipografi editorial yang sama (judul kapital + aksen script, paragraf, tombol kotak).
- Di mobile berubah jadi kartu bertumpuk; ketuk membuka panel State 3.

## 4. Penerapan per halaman
| Halaman | Sumber data | Varian | Catatan |
|---|---|---|---|
| `/galeri` | array di `galeri.astro` (Kampus, Akademik, Tradisi, Kesiswaan, Prestasi) | `lightbox` | Filter kategori berupa chip dengan gaya kotak bingkai |
| `/berita` | `src/lib/news.ts` | `lightbox`, `href` ke `/berita/[slug]` | Kartu tetap tautan nyata agar bisa di-crawl |
| `/fasilitas` | `src/config/facilities.ts` | `expand` | Pakai foto asli madrasah jika ada |
| `/kesiswaan` | konten di `kesiswaan.astro` | `expand` | Jangan menambah klaim ekskul baru |

Pemilihan kata aksen script: ambil otomatis kata terakhir yang bermakna dari judul, atau field `titleAccent` jika tersedia. Jangan sampai aksen menutupi lebih dari separuh satu baris judul.

## 5. Aksesibilitas dan kinerja (wajib)
- Kartu = `<a>`/`<button>` yang bisa difokus; panel `role="dialog" aria-modal="true"`, focus trap, label dari judul.
- `prefers-reduced-motion`: matikan Ken Burns, tilt, reveal kata, dan transisi besar; sisakan fade 150 ms. Teks langsung hitam penuh.
- Kontras teks minimal 4.5:1. Abu-abu tahap awal reveal hanya sementara; teks akhir harus kontras penuh.
- Aksen script bersifat dekoratif dan tidak boleh mengganti judul yang bisa dibaca; judul lengkap tetap ada di HTML (aksen = bagian dari judul yang sama, dengan `aria-hidden` pada duplikat visual jika ada).
- `<img>` punya `alt` deskriptif, `width`/`height` eksplisit, `loading="lazy"` kecuali yang paling atas. Tanpa layout shift.
- Gambar besar di panel: untuk Google Drive pakai `lh3.googleusercontent.com/d/ID=w1600`.
- Animasi hanya `transform` dan `opacity`.
- Satu `<h1>` per halaman. Judul kartu `<h3>` (atau `<h2>`), judul di panel dialog tidak membuat `<h1>` baru.

## 6. Kriteria selesai
- [ ] 4 halaman memakai komponen yang sama, rapi di mobile dan desktop.
- [ ] Hijau hanya dari token yang sudah ada; tambahan warna hanya `paper`.
- [ ] Font tambahan maksimal 2, dimuat tanpa `@import`, tanpa layout shift.
- [ ] Tanpa JavaScript, kartu berita tetap tautan dan teks kartu tetap ada di HTML.
- [ ] `npm run build` sukses; `node scripts/verify-h1.cjs` dan `node scripts/check-img-alt.cjs` lolos.
- [ ] Lighthouse mobile: Performance dan Accessibility tidak turun (catat angka sebelum dan sesudah).
- [ ] Sitemap dan JSON-LD tidak berubah.
