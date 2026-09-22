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

const DEFAULT_NEWS_API_URL = "https://script.google.com/macros/s/AKfycbwboX_4labGuJ9412coI1JrXzpxb11B3xJOlmloGnEsTsRui-yIdssRFl8i2CGga1IF/exec";

// Fallback artikel jika Google Apps Script lambat / cold start / offline saat build
const fallbackArticles: NewsArticle[] = [
  {
    id: 'news_1788179921183',
    slug: 'peringatan-maulid-nabi-muhammad-saw-ma-margajaya-gelar-muludan-921183',
    judul: 'Peringatan Maulid Nabi Muhammad SAW: MA Margajaya Gelar Muludan Penuh Khidmat',
    isi: 'Dalam rangka memperingati kelahiran Nabi Muhammad SAW, keluarga besar MA Margajaya menggelar acara Muludan yang berlangsung khidmat di lingkungan madrasah. Acara yang diikuti oleh seluruh siswa, dewan guru, serta pengurus Pondok Pesantren Darul Muawanah ini diawali dengan pembacaan Shalawat dan Marhaban, dilanjutkan dengan tausiyah yang mengupas keteladanan akhlak Rasulullah SAW sebagai suri tauladan dalam kehidupan sehari-hari.\n\nRangkaian kegiatan turut diisi dengan lomba-lomba bernuansa islami antar kelas, seperti lomba adzan, tilawah Al-Qur\'an, dan kaligrafi, yang bertujuan menumbuhkan semangat cinta terhadap nilai-nilai keislaman sejak dini di kalangan siswa. Selain itu, acara ini juga menjadi momentum bagi madrasah untuk mempererat silaturahmi antara siswa, guru, dan wali santri yang turut hadir menyaksikan jalannya kegiatan.\n\nKepala MA Margajaya dalam sambutannya menyampaikan bahwa peringatan Maulid Nabi bukan sekadar seremonial tahunan, melainkan momen untuk merefleksikan dan meneladani akhlak mulia Rasulullah SAW dalam kehidupan sehari-hari, sejalan dengan visi madrasah "Berakhlak Mulia & Berprestasi". Acara ditutup dengan doa bersama dan pembagian santunan kepada anak yatim di lingkungan sekitar madrasah.',
    tanggal: '2026-08-30T17:00:00.000Z',
    url_foto: 'https://drive.google.com/thumbnail?id=1H1iYgoYDwzIwc78QV83xPh4UtxDiiHhM&sz=w1200',
    penulis: 'Mansur Sumansur'
  },
  {
    id: 'news_1788172052196',
    slug: 'peringatan-maulid-nabi-di-ma-margajaya-052196',
    judul: 'Peringatan Maulid Nabi di MA Margajaya',
    isi: 'Peringatan Maulid Nabi Muhammad SAW di lingkungan MA Margajaya yang diikuti oleh dewan guru dan seluruh siswa madrasah.',
    tanggal: '2026-08-30T17:00:00.000Z',
    url_foto: 'https://lh3.googleusercontent.com/d/1id46NwYOyelkIk88gnGwK_u2zEFSyiHI',
    penulis: 'Humas MA Margajaya'
  }
];

let cachedArticles: NewsArticle[] | null = null;

/**
 * Fetch dengan retry & backoff untuk mengantisipasi cold-start Google Apps Script
 */
async function fetchWithRetry(url: string, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status !== 'success') throw new Error(json.message || 'Gagal memuat data warta.');
      return json.data;
    } catch (e) {
      if (i === tries - 1) throw e;
      // Exponential backoff untuk cold start Apps Script
      await new Promise((r) => setTimeout(r, 1500 * (i + 1)));
    }
  }
}

/**
 * Mengambil semua warta dari Google Apps Script saat build time.
 * Dilengkapi graceful fallback agar build deployment tidak pernah gagal.
 */
export async function fetchNewsArticles(): Promise<NewsArticle[]> {
  if (cachedArticles && cachedArticles.length > 0) {
    return cachedArticles;
  }

  const apiUrl = import.meta.env.PUBLIC_NEWS_API_URL || DEFAULT_NEWS_API_URL;

  try {
    const rawData = await fetchWithRetry(apiUrl, 2);
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

    return fallbackArticles;
  } catch (err) {
    console.warn('[news] Gagal mengambil warta dari Apps Script, menggunakan fallback:', (err as Error).message);
    return fallbackArticles;
  }
}
