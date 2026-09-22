# Panduan Deployment

Template ini dirancang sebagai *Static Site* sehingga sangat mudah, murah, dan cepat untuk dideploy di platform seperti Vercel, Cloudflare Pages, atau Netlify.

## Build Command
Saat mengatur project di platform deployment, gunakan konfigurasi berikut:

- **Framework Preset**: Astro
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install` (otomatis)

## Cara Deploy ke Vercel
1. Buat akun di [Vercel](https://vercel.com).
2. Hubungkan repository GitHub Anda.
3. Klik "Add New Project" dan pilih repository website sekolah.
4. Vercel secara otomatis akan mendeteksi framework `Astro`.
5. Klik **Deploy**.

## Cara Deploy ke Cloudflare Pages
1. Login ke akun Cloudflare.
2. Buka menu **Workers & Pages**, lalu pilih **Create Application** > **Pages**.
3. Hubungkan ke repository GitHub Anda.
4. Pilih **Astro** di *Framework preset*.
5. Klik **Save and Deploy**.

## Custom Domain
Setelah deployment selesai, Anda bisa mengatur custom domain (misal: `www.sman1cianjay.sch.id`) melalui menu Domain di dashboard Vercel atau Cloudflare. Pastikan untuk memperbarui DNS *record* di registrar domain sesuai instruksi dari platform bersangkutan.
