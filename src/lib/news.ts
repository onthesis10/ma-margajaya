export interface NewsArticle {
  id: string;
  slug: string;
  judul: string;
  isi: string;
  tanggal: string;
  url_foto: string;
  penulis: string;
}

/**
 * Format thumbnail Google Drive agar dapat di-load cepat dan andal
 */
export function formatDriveImageUrl(url: string, width = 1200): string {
  if (!url) return '';
  const str = String(url).trim();
  const match = str.match(/\/d\/([a-zA-Z0-9_-]+)/) || str.match(/id=([a-zA-Z0-9_-]+)/) || str.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w${width}`;
  }
  return str;
}

/**
 * Helper pembuat slug URL ramah SEO dari judul dan ID warta
 * Mengambil 6 digit terakhir id agar slug ringkas & elegan namun tetap unik
 */
export function generateNewsSlug(item: { id: string; judul: string }): string {
  const cleanTitle = (item.judul || 'warta')
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .substring(0, 50);
  
  const rawId = (item.id || '').replace(/^news_/, '');
  const shortId = rawId.length > 6 ? rawId.slice(-6) : rawId;
  return cleanTitle ? `${cleanTitle}-${shortId}` : `warta-${shortId || Date.now()}`;
}

/**
 * Format tanggal Indonesia ramah baca
 */
export function formatIndonesianDate(rawDate: string): string {
  if (!rawDate) return '—';
  const d = new Date(rawDate);
  if (isNaN(d.getTime())) return String(rawDate);
  const months = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Estimasi durasi membaca warta
 */
export function estimateReadingTime(text: string): string {
  if (!text) return '1 Menit Baca';
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 180));
  return `${minutes} Menit Baca`;
}

// Data simulasi KHUSUS lingkungan pengembangan lokal (astro dev)
const devFallbackArticles: NewsArticle[] = [
  {
    id: 'news_dev_mock_1',
    slug: 'contoh-warta-ma-margajaya-mode-dev',
    judul: '[DEV MODE] Contoh Warta Simulasi MA Margajaya',
    isi: 'Ini adalah warta contoh simulasi yang hanya muncul saat menjalankan `npm run dev` tanpa koneksi internet atau bila endpoint Google Apps Script belum aktif.',
    tanggal: '2026-09-01',
    url_foto: '',
    penulis: 'Tim Pengembang'
  }
];

let cachedArticles: NewsArticle[] | null = null;

/**
 * Fetch dengan retry & backoff untuk mengantisipasi cold-start Google Apps Script
 */
async function fetchWithRetry(url: string, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message || 'Gagal memuat data warta.');
      return json.data;
    } catch (e) {
      if (i === tries - 1) throw e;
      // Exponential backoff untuk cold start Apps Script
      await new Promise((r) => setTimeout(r, 2000 * (i + 1)));
    }
  }
}

/**
 * Mengambil semua warta dari Google Apps Script saat build time.
 * PENTING: Pada mode produksi (build), fungsi ini AKAN GAGAL (throw error) jika
 * data tidak berhasil ditarik, agar Cloudflare Pages TIDAK menimpa versi live yang bagus
 * dengan situs dummy/kosong.
 */
export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  if (cachedArticles && cachedArticles.length > 0) {
    return cachedArticles;
  }

  const apiUrl = import.meta.env.PUBLIC_NEWS_API_URL;

  try {
    if (!apiUrl) {
      throw new Error("Variabel lingkungan PUBLIC_NEWS_API_URL belum disetel.");
    }

    const rawData = await fetchWithRetry(apiUrl, 3);
    if (Array.isArray(rawData) && rawData.length > 0) {
      cachedArticles = rawData.map((item: any) => ({
        id: item.id || `news_${Date.now()}`,
        slug: generateNewsSlug(item),
        judul: item.judul || 'Tanpa Judul',
        isi: item.isi || '',
        tanggal: item.tanggal || '',
        url_foto: formatDriveImageUrl(item.url_foto),
        penulis: item.penulis || 'Humas MA Margajaya'
      }));

      // Urutkan tanggal terbaru
      cachedArticles.sort((a, b) => {
        const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
        const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        const idA = parseInt((a.id || '').replace('news_', '')) || 0;
        const idB = parseInt((b.id || '').replace('news_', '')) || 0;
        return idB - idA;
      });

      return cachedArticles;
    }

    return [];
  } catch (err) {
    // Pada build produksi (!import.meta.env.DEV): LEMPAR ERROR!
    // Mencegah Cloudflare Pages menimpa live deployment dengan data kosong/dummy
    if (!import.meta.env.DEV) {
      throw new Error(`[CRITICAL BUILD ERROR] Gagal mengambil warta dari Apps Script: ${(err as Error).message}. Build dibatalkan untuk melindungi deployment live.`);
    }

    console.warn('[news] Mode DEV aktif: Menggunakan data simulasi dev:', (err as Error).message);
    return devFallbackArticles;
  }
}
