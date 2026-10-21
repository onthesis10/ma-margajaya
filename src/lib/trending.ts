/**
 * trending.ts — Logika ranking artikel berita berdasarkan tren dan traffic.
 *
 * Fungsi murni: tidak ada side effect, tidak ada import runtime-only.
 * Dipakai bersama oleh:
 *   - Build time: pages/berita/index.astro
 *   - Browser:    scripts/news-live.ts
 *
 * Unit test: src/lib/trending.test.ts (node scripts/run-trending-test.cjs)
 */

// ============================================================================
// TIPE DATA
// ============================================================================

export interface ArticleStat {
  slug: string;
  v24h: number;
  v7d: number;
  v30d: number;
  total: number;
}

export interface StatsPayload {
  status: string;
  updatedAt: string;
  items: ArticleStat[];
}

export interface RankableArticle {
  slug: string;
  tanggal: string; // ISO string atau yyyy-MM-dd
  headline?: boolean;
  unggulan?: boolean;
  kategori?: string;
}

export interface SectionResult<T extends RankableArticle> {
  hero: T | null;
  editorial: T | null;
  terbaru: T[];
  mostWatched: T[];
  popular: T[];
  all: T[];           // semua artikel terurut tanggal (fallback)
}

// ============================================================================
// KONFIGURASI BOBOT (ubah di sini tanpa menyentuh logika)
// ============================================================================

export interface TrendingWeights {
  /** Bobot v24h dalam rumus trending */
  w24h: number;
  /** Gravity exponent untuk faktor umur */
  gravity: number;
  /** Minimum v7d agar masuk ranking tren */
  minV7dForTrend: number;
  /** Total views 7d seluruh situs di bawah ini → fallback ke kebaruan */
  lowTrafficThreshold: number;
  /** Rasio skor tren vs skor kebaruan saat traffic normal */
  blendNormal: number;
  /** Rasio skor tren vs skor kebaruan saat traffic rendah */
  blendLow: number;
}

export const DEFAULT_WEIGHTS: TrendingWeights = {
  w24h:               3,
  gravity:            1.3,
  minV7dForTrend:     3,
  lowTrafficThreshold: 50,
  blendNormal:        0.7,
  blendLow:           0.3,
};

// ============================================================================
// FUNGSI HELPER
// ============================================================================

/** Usia artikel dalam hari relatif terhadap `now` */
function ageInDays(tanggal: string, now: Date): number {
  if (!tanggal) return 999;
  const d = new Date(tanggal);
  if (isNaN(d.getTime())) return 999;
  const ms = now.getTime() - d.getTime();
  return Math.max(0, ms / 86_400_000);
}

/** Skor kebaruan: makin baru = makin tinggi, maks 1.0 */
function freshnessScore(ageDay: number): number {
  // Decays from 1 to ~0 over 30 days
  return 1 / (1 + ageDay / 10);
}

/**
 * Hitung skor trending per artikel.
 * trending = (v24h * w24h + v7d) / (umurHari + 2)^gravity
 */
function trendingScore(stat: ArticleStat, ageDay: number, w: TrendingWeights): number {
  return (stat.v24h * w.w24h + stat.v7d) / Math.pow(ageDay + 2, w.gravity);
}

// ============================================================================
// FUNGSI UTAMA — rankArticles
// ============================================================================

/**
 * Hitung ranking artikel dan bagikan ke seksi-seksi portal.
 *
 * @param articles   Semua artikel (dari fetchNewsArticles)
 * @param stats      Data statistik dari ?action=stats (null = tidak ada data)
 * @param now        Waktu referensi (Date.now()) — agar testable
 * @param weights    Konfigurasi bobot (opsional, pakai DEFAULT_WEIGHTS jika tidak disediakan)
 * @returns SectionResult dengan artikel tanpa duplikat di area utama
 */
export function rankArticles<T extends RankableArticle>(
  articles: T[],
  stats: StatsPayload | null,
  now: Date = new Date(),
  weights: TrendingWeights = DEFAULT_WEIGHTS,
): SectionResult<T> {
  if (!articles || articles.length === 0) {
    return { hero: null, editorial: null, terbaru: [], mostWatched: [], popular: [], all: [] };
  }

  // Buat lookup stat per slug
  const statMap = new Map<string, ArticleStat>();
  if (stats && Array.isArray(stats.items)) {
    for (const s of stats.items) {
      statMap.set(s.slug, s);
    }
  }

  // Total views 7d seluruh situs (untuk deteksi low-traffic)
  let totalV7d = 0;
  statMap.forEach(s => { totalV7d += s.v7d; });
  const isLowTraffic = totalV7d < weights.lowTrafficThreshold;
  const blendTrend = isLowTraffic ? weights.blendLow : weights.blendNormal;
  const blendFresh = 1 - blendTrend;

  // Urutkan artikel berdasarkan tanggal terbaru (urutan dasar)
  const byDate = [...articles].sort((a, b) => {
    const ta = a.tanggal ? new Date(a.tanggal).getTime() : 0;
    const tb = b.tanggal ? new Date(b.tanggal).getTime() : 0;
    return tb - ta;
  });

  // Hitung skor gabungan per artikel
  type Scored = { article: T; trending: number; v7d: number; v30d: number; fresh: number };
  const scored: Scored[] = byDate.map(a => {
    const stat = statMap.get(a.slug);
    const age = ageInDays(a.tanggal, now);
    const fresh = freshnessScore(age);

    if (!stat || stat.v7d < weights.minV7dForTrend) {
      // Tidak ada data / kurang data: skor trending = 0, hanya kebaruan
      return { article: a, trending: 0, v7d: stat?.v7d ?? 0, v30d: stat?.v30d ?? 0, fresh };
    }

    const ts = trendingScore(stat, age, weights);
    return { article: a, trending: ts, v7d: stat.v7d, v30d: stat.v30d, fresh };
  });

  // Hitung skor akhir campuran (normalisasi ke [0,1] secara relatif)
  const maxTrend = Math.max(...scored.map(s => s.trending), 1);
  const maxFresh = Math.max(...scored.map(s => s.fresh), 1);

  const withFinal = scored.map(s => ({
    ...s,
    finalScore: blendTrend * (s.trending / maxTrend) + blendFresh * (s.fresh / maxFresh),
  }));

  // ---- Tentukan artikel per seksi tanpa duplikat ----
  const used = new Set<string>();

  // 1. HERO: headline=TRUE → tren tertinggi 3 hari terakhir → terbaru
  let hero: T | null = null;
  const headlineArticle = byDate.find(a => a.headline);
  if (headlineArticle) {
    hero = headlineArticle;
  } else {
    // Ambil artikel dengan skor trending tertinggi dalam 3 hari
    const recent3d = withFinal.filter(s => ageInDays(s.article.tanggal, now) <= 3);
    if (recent3d.length > 0) {
      recent3d.sort((a, b) => b.finalScore - a.finalScore);
      hero = recent3d[0].article;
    } else {
      hero = byDate[0] ?? null;
    }
  }
  if (hero) used.add(hero.slug);

  // 2. EDITORIAL: unggulan=TRUE → top "mostWatched" yang belum tampil
  let editorial: T | null = null;
  const unggulanArticle = byDate.find(a => a.unggulan && !used.has(a.slug));
  if (unggulanArticle) {
    editorial = unggulanArticle;
  } else {
    // Ambil top v7d yang belum dipakai
    const byV7d = [...withFinal].sort((a, b) => b.v7d - a.v7d);
    const fallbackEdit = byV7d.find(s => !used.has(s.article.slug));
    editorial = fallbackEdit?.article ?? null;
  }
  if (editorial) used.add(editorial.slug);

  // 3. TERBARU: 3 artikel terbaru yang belum dipakai
  const terbaru: T[] = [];
  for (const a of byDate) {
    if (used.has(a.slug)) continue;
    terbaru.push(a);
    used.add(a.slug);
    if (terbaru.length >= 3) break;
  }

  // 4. MOST WATCHED: 2 artikel v7d tertinggi yang belum dipakai
  const byV7d = [...withFinal].sort((a, b) => b.v7d - a.v7d);
  const mostWatched: T[] = [];
  for (const s of byV7d) {
    if (used.has(s.article.slug)) continue;
    mostWatched.push(s.article);
    used.add(s.article.slug);
    if (mostWatched.length >= 2) break;
  }
  // Fallback jika tidak ada data statistik
  if (mostWatched.length === 0) {
    for (const a of byDate) {
      if (used.has(a.slug)) continue;
      mostWatched.push(a);
      used.add(a.slug);
      if (mostWatched.length >= 2) break;
    }
  }

  // 5. POPULAR: 4 artikel v30d tertinggi yang belum dipakai (grid 2×2)
  const byV30d = [...withFinal].sort((a, b) => b.v30d - a.v30d);
  const popular: T[] = [];
  for (const s of byV30d) {
    if (used.has(s.article.slug)) continue;
    popular.push(s.article);
    used.add(s.article.slug);
    if (popular.length >= 4) break;
  }
  // Fallback
  if (popular.length === 0) {
    for (const a of byDate) {
      if (used.has(a.slug)) continue;
      popular.push(a);
      used.add(a.slug);
      if (popular.length >= 4) break;
    }
  }

  return { hero, editorial, terbaru, mostWatched, popular, all: byDate };
}

// ============================================================================
// HELPER EXPORT: Daftar topik + jumlah artikel
// ============================================================================

export function buildTopicList<T extends RankableArticle>(articles: T[]): Array<{ topik: string; jumlah: number }> {
  const map = new Map<string, number>();
  for (const a of articles) {
    if (a.kategori && a.kategori.trim()) {
      const k = a.kategori.trim();
      map.set(k, (map.get(k) ?? 0) + 1);
    }
  }
  return Array.from(map.entries())
    .map(([topik, jumlah]) => ({ topik, jumlah }))
    .sort((a, b) => b.jumlah - a.jumlah);
}

// ============================================================================
// HELPER EXPORT: Sidebar "Terpopuler" (v30d, 6 item, boleh duplikat dari utama)
// ============================================================================

export function rankSidebarPopular<T extends RankableArticle>(
  articles: T[],
  stats: StatsPayload | null,
  limit = 6,
): T[] {
  if (!articles.length) return [];

  const statMap = new Map<string, ArticleStat>();
  if (stats?.items) {
    for (const s of stats.items) statMap.set(s.slug, s);
  }

  const scored = articles.map(a => ({
    article: a,
    v30d: statMap.get(a.slug)?.v30d ?? 0,
    tanggal: a.tanggal,
  }));

  scored.sort((a, b) => {
    if (b.v30d !== a.v30d) return b.v30d - a.v30d;
    const ta = a.tanggal ? new Date(a.tanggal).getTime() : 0;
    const tb = b.tanggal ? new Date(b.tanggal).getTime() : 0;
    return tb - ta;
  });

  return scored.slice(0, limit).map(s => s.article);
}
