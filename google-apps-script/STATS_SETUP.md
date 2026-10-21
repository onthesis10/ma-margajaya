# STATS SETUP — Panduan Sheet `views_daily` & Deploy Ulang

Panduan ini menjelaskan cara mengaktifkan sistem statistik kunjungan anonim
untuk portal berita MA Margajaya.

---

## 1. Tambah Kolom Baru di Sheet "Berita"

Buka Google Sheets → sheet **Berita**. Tambahkan header kolom baru di baris 1:

| Kolom | Header | Keterangan |
|-------|--------|-----------|
| G | `kategori` | Kategori artikel (mis. `Kegiatan`, `Prestasi`, `Pengumuman`) |
| H | `headline` | Isi `TRUE` agar artikel muncul sebagai Sorotan Utama |
| I | `unggulan` | Isi `TRUE` agar artikel muncul di Pilihan Redaksi |

> **Catatan:** Kolom baru bersifat opsional. Data lama tidak perlu diubah.
> Jika kolom kosong, sistem akan menggunakan logika fallback (terbaru/tren).

---

## 2. Buat Sheet `views_daily`

Sheet ini **dibuat otomatis** oleh Apps Script saat ada kunjungan pertama.
Tapi kamu bisa membuatnya manual untuk memastikan struktur yang benar:

1. Di Google Sheets yang sama, klik **+** (tambah sheet) di bawah.
2. Beri nama persis: `views_daily` (huruf kecil, underscore).
3. Isi baris **1** (header):

| Kolom A | Kolom B | Kolom C |
|---------|---------|---------|
| `tanggal` | `slug` | `jumlah` |

4. Format kolom C sebagai **Angka** (Format → Angka → Angka).
5. Bekukan baris 1 (Tampilan → Bekukan → 1 baris).

**Contoh data:**

| tanggal | slug | jumlah |
|---------|------|--------|
| 2026-10-21 | peringatan-maulid-nabi-921183 | 42 |
| 2026-10-21 | antologi-puisi-madrasah-052196 | 15 |
| 2026-10-20 | peringatan-maulid-nabi-921183 | 28 |

---

## 3. Deploy Ulang Web App

Setelah menambahkan kode baru di `Code.gs`:

1. Di Google Apps Script Editor, buka menu **Deploy** → **Kelola deployment**.
2. Klik ikon ✏️ (Edit) di deployment yang aktif.
3. Di kolom **Versi**, pilih **Versi baru**.
4. Tambahkan catatan versi, mis.: `v2 - Tambah statistik kunjungan`.
5. Klik **Deploy**.
6. **Salin URL Web App** yang baru (formatnya tidak berubah jika pakai deployment yang sama).
7. Pastikan **Siapa yang dapat mengakses** = **Siapa saja**.

> ⚠️ Jika kamu membuat **deployment baru** (bukan memperbarui yang lama),
> URL akan berubah. Perbarui `PUBLIC_NEWS_API_URL` di file `.env` dan
> `PUBLIC_STATS_API_URL` di `.env`.

---

## 4. Variabel Lingkungan yang Dibutuhkan

Tambahkan ke file `.env` (salin dari `.env.example`):

```env
# URL doGet lama untuk daftar berita (tidak berubah)
PUBLIC_NEWS_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec

# URL yang sama — dipakai untuk ?action=stats dan doPost action=hit
PUBLIC_STATS_API_URL=https://script.google.com/macros/s/DEPLOYMENT_ID/exec
```

Kedua URL biasanya **sama** (satu deployment Apps Script menangani semua endpoint).

---

## 5. Uji Endpoint `?action=stats`

Setelah deploy, buka browser dan akses:

```
https://script.google.com/macros/s/DEPLOYMENT_ID/exec?action=stats
```

Respons yang benar:

```json
{
  "status": "success",
  "updatedAt": "2026-10-21T12:00:00.000Z",
  "items": [
    { "slug": "peringatan-maulid-921183", "v24h": 5, "v7d": 42, "v30d": 120, "total": 315 }
  ]
}
```

Jika `items` kosong (`[]`), artinya sheet `views_daily` masih kosong — itu normal.

---

## 6. Uji Endpoint `action=hit` (Pencatat Kunjungan)

Dari browser console atau Postman, kirim POST dengan body JSON:

```json
{ "action": "hit", "slug": "peringatan-maulid-921183", "cid": "test-cid-001" }
```

Respons yang benar: `ok`

Setelah itu, cek sheet `views_daily` — seharusnya ada baris baru.

Kirim ulang dengan **cid yang sama** → respons `deduped` (tidak dihitung dua kali).

---

## 7. Data Uji (Simulasi Traffic)

Untuk menguji apakah urutan portal berubah saat statistik ada, isi sheet `views_daily` dengan data palsu:

```
tanggal       | slug                                    | jumlah
2026-10-21    | peringatan-maulid-nabi-921183           | 150
2026-10-21    | peringatan-maulid-nabi-921183           | [duplikat — jangan]
2026-10-20    | peringatan-maulid-nabi-921183           | 80
2026-10-15    | peringatan-maulid-di-ma-margajaya-052196| 200
```

Kemudian buka `/berita` di browser → seksi "Paling Banyak Dibaca" dan "Populer"
harus berubah urutannya sesuai data di atas (setelah cache 10 menit habis atau dihapus).

---

## 8. Privasi & Kepatuhan

- Tidak ada cookie yang disimpan.
- Tidak ada alamat IP yang dicatat.
- `cid` adalah ID acak per browser tersimpan di `localStorage` — bukan identitas.
- Setiap kunjungan per `cid`+`slug` hanya dihitung **sekali per 6 jam** (dedupe CacheService).
- Pengguna dapat menonaktifkan hitungan dengan menjalankan di console browser:
  ```js
  localStorage.setItem('nocount', '1');
  ```
- Transparansi ditampilkan di footer halaman: *"Situs ini menghitung jumlah pembaca secara anonim."*
