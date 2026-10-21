/**
 * view-counter.ts — Pencatat kunjungan artikel berita (TAHAP 4)
 *
 * Dipasang hanya di halaman /berita/[slug].
 * Menghitung kunjungan setelah tab terlihat ≥ 5 detik.
 * Tidak menyimpan data pribadi; tanpa cookie; privasi penuh.
 *
 * Kondisi agar dihitung:
 *   1. visibilityState === 'visible' selama ≥ 5 detik berturut-turut
 *   2. navigator.webdriver === false (bukan bot Playwright/Puppeteer/Selenium)
 *   3. UA tidak cocok pola bot umum
 *   4. localStorage.nocount !== '1' (admin/penulis dapat menonaktifkan)
 *   5. Belum dihitung di sesi ini untuk slug ini (sessionStorage)
 *
 * cid = ID acak per browser tersimpan di localStorage ('_mcid').
 * Tidak terkait identitas; bukan cookie; tidak dikirim ke pihak ketiga.
 */

(function viewCounter() {
  // ── Konfigurasi ──────────────────────────────────────────────────────────
  const DWELL_MS       = 5000;  // diam-diam baca 5 detik sebelum dihitung
  const STORAGE_KEY_CID = '_mcid';
  const SESSION_PREFIX  = '_vc_';

  // ── Baca endpoint dari meta tag (ditulis oleh Astro saat build) ───────────
  const metaEndpoint = document.querySelector<HTMLMetaElement>('meta[name="vc-endpoint"]');
  const metaSlug     = document.querySelector<HTMLMetaElement>('meta[name="vc-slug"]');

  const endpoint = metaEndpoint?.content?.trim();
  const slug     = metaSlug?.content?.trim();

  if (!endpoint || !slug) return; // halaman ini tidak memerlukan counter

  // ── Cek bot ──────────────────────────────────────────────────────────────
  function isBot(): boolean {
    if (typeof navigator === 'undefined') return true;
    if ((navigator as any).webdriver) return true;
    const ua = (navigator.userAgent || '').toLowerCase();
    return /bot|crawl|spider|slurp|facebookexternalhit|twitterbot|whatsapp|linkedinbot|googlebot|bingbot|yandex|baidu/i.test(ua);
  }

  // ── Cek kondisi opt-out ────────────────────────────────────────────────────
  function shouldSkip(): boolean {
    try {
      if (localStorage.getItem('nocount') === '1') return true;
      if (sessionStorage.getItem(SESSION_PREFIX + slug)) return true;
    } catch (_) { /* privacy mode */ }
    return false;
  }

  // ── Baca atau buat cid ─────────────────────────────────────────────────────
  function getCid(): string {
    try {
      let cid = localStorage.getItem(STORAGE_KEY_CID);
      if (!cid) {
        // UUID v4 lite tanpa crypto dependency
        cid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
          const r = (Math.random() * 16) | 0;
          return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
        });
        localStorage.setItem(STORAGE_KEY_CID, cid);
      }
      return cid;
    } catch (_) {
      return 'anon-' + Math.random().toString(36).slice(2);
    }
  }

  // ── Kirim hit ke Apps Script ───────────────────────────────────────────────
  function sendHit(): void {
    if (isBot() || shouldSkip()) return;

    const cid = getCid();
    const body = JSON.stringify({ action: 'hit', slug, cid });

    // sendBeacon: fire-and-forget, tidak memicu CORS preflight karena text/plain
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'text/plain' }));
    } else {
      fetch(endpoint, { method: 'POST', body, keepalive: true }).catch(() => {});
    }

    // Tandai sesi ini agar tidak dihitung dua kali
    try { sessionStorage.setItem(SESSION_PREFIX + slug, '1'); } catch (_) {}
  }

  // ── Timer dwell (5 detik visible) ─────────────────────────────────────────
  let dwellTimer: ReturnType<typeof setTimeout> | null = null;
  let counted = false;

  function startDwell(): void {
    if (counted || dwellTimer) return;
    dwellTimer = setTimeout(() => {
      counted = true;
      sendHit();
    }, DWELL_MS);
  }

  function cancelDwell(): void {
    if (dwellTimer) {
      clearTimeout(dwellTimer);
      dwellTimer = null;
    }
  }

  // ── Visibility API ─────────────────────────────────────────────────────────
  function onVisibilityChange(): void {
    if (document.visibilityState === 'visible') {
      startDwell();
    } else {
      cancelDwell();
    }
  }

  // Mulai segera jika tab sudah terlihat
  if (document.visibilityState === 'visible') {
    startDwell();
  }
  document.addEventListener('visibilitychange', onVisibilityChange);
})();
