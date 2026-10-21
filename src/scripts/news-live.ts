/**
 * news-live.ts — Pembaruan urutan portal berita di browser (TAHAP 3 — data-live)
 *
 * Ambil statistik terbaru dari ?action=stats (cache sessionStorage 10 menit),
 * hitung ulang ranking dengan rankArticles (logika sama dengan build time),
 * susun ulang elemen DOM bertanda data-live dengan transisi fade.
 *
 * Seksi bertanda data-live:
 *   - data-live="mostwatched" → urut v7d
 *   - data-live="popular"     → urut v30d
 *   - data-live="sidebar-popular" → urut v30d (sidebar)
 *
 * Hero (data-live="hero") tidak disusun ulang di browser karena
 * memerlukan gambar besar yang sudah di-prefetch → biarkan hasil build.
 *
 * Jika fetch gagal atau data kosong: diam, biarkan urutan hasil build.
 * Jika prefers-reduced-motion: skip transisi, langsung reorder.
 */

import type { StatsPayload, ArticleStat } from '../lib/trending';

// ── Konfigurasi ───────────────────────────────────────────────────────────────
const SESSION_KEY    = '_stats_cache';
const CACHE_DURATION = 10 * 60 * 1000; // 10 menit dalam ms
const FADE_DURATION  = 200; // ms untuk fade out/in

interface CachedStats {
  ts: number;
  payload: StatsPayload;
}

// ── Ambil endpoint dari meta tag ──────────────────────────────────────────────
function getStatsEndpoint(): string | null {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="stats-endpoint"]');
  return meta?.content?.trim() || null;
}

// ── Cache sessionStorage ───────────────────────────────────────────────────────
function getCachedStats(): StatsPayload | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const cached: CachedStats = JSON.parse(raw);
    if (Date.now() - cached.ts > CACHE_DURATION) return null;
    return cached.payload;
  } catch (_) { return null; }
}

function setCachedStats(payload: StatsPayload): void {
  try {
    const data: CachedStats = { ts: Date.now(), payload };
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
  } catch (_) {}
}

// ── Fetch statistik ────────────────────────────────────────────────────────────
async function fetchStats(endpoint: string): Promise<StatsPayload | null> {
  const cached = getCachedStats();
  if (cached) return cached;

  try {
    const res = await fetch(endpoint + '?action=stats', {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const json: StatsPayload = await res.json();
    if (json.status !== 'success' || !Array.isArray(json.items)) return null;
    setCachedStats(json);
    return json;
  } catch (_) {
    return null;
  }
}

// ── Susun ulang DOM dengan fade ────────────────────────────────────────────────
function reorderSection(
  container: HTMLElement,
  orderedSlugs: string[],
  reducedMotion: boolean,
): void {
  const items = Array.from(container.querySelectorAll<HTMLElement>('[data-slug]'));
  if (items.length < 2) return;

  // Buat map slug → elemen
  const slugMap = new Map<string, HTMLElement>();
  items.forEach(el => {
    const s = el.dataset.slug;
    if (s) slugMap.set(s, el);
  });

  // Elemen yang akan diurutkan (hanya yang ada di orderedSlugs)
  const sorted: HTMLElement[] = [];
  for (const slug of orderedSlugs) {
    const el = slugMap.get(slug);
    if (el) sorted.push(el);
  }

  // Tambahkan elemen yang tidak ada di orderedSlugs (pertahankan urutan)
  items.forEach(el => {
    if (!sorted.includes(el)) sorted.push(el);
  });

  // Apakah urutan berubah?
  const changed = sorted.some((el, i) => items[i] !== el);
  if (!changed) return;

  if (reducedMotion) {
    sorted.forEach(el => container.appendChild(el));
    return;
  }

  // Fade out → reorder → fade in
  const transition = `opacity ${FADE_DURATION}ms ease`;
  items.forEach(el => {
    el.style.transition = transition;
    el.style.opacity = '0';
  });

  setTimeout(() => {
    sorted.forEach(el => container.appendChild(el));
    // Reflow
    void container.offsetHeight;
    items.forEach(el => {
      el.style.opacity = '1';
    });
    setTimeout(() => {
      items.forEach(el => { el.style.transition = ''; el.style.opacity = ''; });
    }, FADE_DURATION + 50);
  }, FADE_DURATION);
}

// ── Hitung ranking lokal (tanpa import tree-shaking issue) ─────────────────────
function rankByV7d(items: ArticleStat[]): string[] {
  return [...items].sort((a, b) => b.v7d - a.v7d).map(s => s.slug);
}

function rankByV30d(items: ArticleStat[]): string[] {
  return [...items].sort((a, b) => b.v30d - a.v30d).map(s => s.slug);
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function init(): Promise<void> {
  const endpoint = getStatsEndpoint();
  if (!endpoint) return;

  // Hanya aktif di halaman dengan seksi data-live
  const liveSections = document.querySelectorAll<HTMLElement>('[data-live]');
  if (liveSections.length === 0) return;

  const stats = await fetchStats(endpoint);
  if (!stats || !stats.items || stats.items.length === 0) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  liveSections.forEach(section => {
    const liveType = section.dataset.live;
    let orderedSlugs: string[] = [];

    if (liveType === 'mostwatched') {
      orderedSlugs = rankByV7d(stats.items);
    } else if (liveType === 'popular' || liveType === 'sidebar-popular') {
      orderedSlugs = rankByV30d(stats.items);
    }

    if (orderedSlugs.length > 0) {
      reorderSection(section, orderedSlugs, reducedMotion);
    }
  });
}

// Jalankan setelah DOM siap
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
