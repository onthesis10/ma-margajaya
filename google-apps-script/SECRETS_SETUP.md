# SECRETS SETUP — Konfigurasi Rahasia & Kredensial Administrator

Dokumen ini menjelaskan langkah-langkah mengonfigurasi kata sandi administrator (`ADMIN_PASSWORD`) dan Vercel Deploy Hook (`DEPLOY_HOOK_URL`) secara aman di **Google Apps Script Script Properties**, sehingga tidak ada rahasia atau token yang tersimpan di kode sumber atau repositori Git.

---

## 1. Mengapa Menggunakan Script Properties?

- **Keamanan Server-Side**: Disimpan terenkripsi di infrastruktur server Google.
- **Terisolasi**: Tidak dapat dilihat oleh pengunjung situs atau crawler publik.
- **Bebas Git Leak**: Repositori GitHub tetap bersih dari kata sandi dan token rahasia.
- **Proteksi Brute-Force**: Dilengkapi pembatasan maksimal 5 kali percobaan gagal per 10 menit via `CacheService`.
- **Timing-Attack Resistant**: Menggunakan fungsi perbandingan string waktu-konstan (`constantTimeCompare`).

---

## 2. Langkah Pengaturan di Google Apps Script

1. **Buka Project Apps Script**:
   - Dari Google Spreadsheet warta Anda, klik menu **Ekstensi** (Extensions) → **Apps Script**.
   - Atau langsung buka melalui [script.google.com](https://script.google.com).

2. **Buka Menu Project Settings**:
   - Pada panel sidebar kiri, klik ikon ⚙️ **Project Settings** (Setelan Project).

3. **Tambahkan Properti Skrip**:
   - Gulir ke bawah hingga menemukan bagian **Script Properties** (Properti Skrip).
   - Klik tombol **Add script property** (Tambahkan properti skrip).
   - Masukkan 2 properti berikut:

   | Property | Value | Keterangan |
   |---|---|---|
   | `ADMIN_PASSWORD` | *(Masukkan kata sandi admin pilihan Anda)* | Wajib. Digunakan untuk login ke panel `/admin`. Gunakan kombinasi huruf, angka, dan simbol. |
   | `DEPLOY_HOOK_URL` | *(Masukkan URL Deploy Hook Vercel Anda)* | Opsional. Digunakan Apps Script untuk memicu build otomatis saat warta dibuat/dihapus. |

4. **Simpan Properti**:
   - Klik tombol **Save script properties** (Simpan properti skrip).

---

## 3. Deploy Ulang Web App

Setiap ada pembaruan kode pada `Code.gs`, Anda harus memperbarui deployment aktif:

1. Di Google Apps Script Editor, klik tombol biru **Deploy** di sudut kanan atas.
2. Pilih **Manage deployments** (Kelola deployment).
3. Klik ikon ✏️ (**Edit**) pada deployment aktif.
4. Pada pilihan **Version**, ubah menjadi **New version** (Versi baru).
5. Klik **Deploy**.
6. Deployment URL akan tetap sama dengan sebelumnya (tidak perlu mengubah URL di file `.env`).

---

## 4. Mekanisme Keamanan yang Berlaku di `Code.gs`

1. **Pencegahan Default Password**:
   - Jika `ADMIN_PASSWORD` belum diisi di Script Properties, server menolak login dengan pesan instruksi konfigurasi, tanpa pernah mengizinkan kata sandi cadangan hardcoded.
2. **Rate Limiting 5x dalam 10 Menit**:
   - Setiap kegagalan login dicatat di `CacheService`.
   - Setelah 5 kali gagal berturut-turut, sistem memblokir akses login selama 10 menit (600 detik).
   - Setiap percobaan salah menampilkan sisa kesempatan yang tersedia.
   - Counter otomatis direset begitu login berhasil.
3. **Perbandingan Waktu-Konstan (`constantTimeCompare`)**:
   - Mencegah serangan *timing attack* dengan memastikan waktu pemrosesan verifikasi kata sandi seragam terlepas dari karakter mana yang cocok atau tidak cocok.
4. **Validasi Sesi Dinamis**:
   - Saat login berhasil, backend menerbitkan session token UUID yang disimpan di `CacheService` selama 6 jam.
   - Seluruh operasi tulis (tambah warta, hapus warta) memvalidasi token sesi ini di server.
