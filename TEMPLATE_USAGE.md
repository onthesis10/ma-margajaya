# Panduan Penggunaan Template

Template ini dirancang untuk mudah dimodifikasi tanpa perlu mengubah banyak kode UI.

## Mengganti Identitas Sekolah
Buka file `src/config/school.config.ts`.
Ubah nama sekolah, deskripsi, kontak, alamat, dan link media sosial.

## Mengganti Logo dan Favicon
1. Siapkan logo baru berformat `.png` atau `.svg` dengan latar transparan.
2. Simpan di folder `public/logo/school-logo.png`.
3. Simpan favicon di `public/favicon.svg`.
4. Jika nama file berbeda, pastikan Anda juga mengupdate path-nya di `src/config/school.config.ts`.

## Mengganti Warna Tema
Buka `src/styles/tokens.css` dan `src/config/theme.config.ts`.
Anda bisa mengubah hex code untuk `--color-gold`, `--color-blue`, dll sesuai identitas warna sekolah klien Anda.

## Menambah Berita Baru
1. Buat file `.md` baru di dalam folder `src/content/news/`.
2. Isi *frontmatter* wajib: `title`, `date`, `category`, `excerpt`, `cover`, dan `status`.
3. Tulis isi berita menggunakan format Markdown.

Contoh:
```md
---
title: "Pengumuman Libur Semester"
date: "2026-06-15"
category: "Akademik"
excerpt: "Jadwal libur semester ganjil tahun ajaran 2026/2027."
cover: "/images/placeholder.jpg"
status: "published"
---
Isi pengumuman di sini...
```

## Menambah/Mengubah Fasilitas dan Program
Buka file terkait di folder `src/data/`.
Contoh, untuk fasilitas, edit `src/data/facilities.ts`. Template secara otomatis akan me-render daftar baru di halaman terkait.
