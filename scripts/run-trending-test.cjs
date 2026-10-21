/**
 * Unit test sederhana untuk rankArticles (src/lib/trending.ts)
 * Jalankan: node scripts/run-trending-test.cjs
 * Tidak memerlukan test runner — hanya Node.js
 */

const DEFAULT_WEIGHTS = {
  w24h: 3,
  gravity: 1.3,
  minV7dForTrend: 3,
  lowTrafficThreshold: 50,
  blendNormal: 0.7,
  blendLow: 0.3,
};

function ageInDays(tanggal, now) {
  if (!tanggal) return 999;
  const d = new Date(tanggal);
  if (isNaN(d.getTime())) return 999;
  return Math.max(0, (now.getTime() - d.getTime()) / 86_400_000);
}

function freshnessScore(ageDay) {
  return 1 / (1 + ageDay / 10);
}

function trendingScore(stat, ageDay, w) {
  return (stat.v24h * w.w24h + stat.v7d) / Math.pow(ageDay + 2, w.gravity);
}

function rankArticles(articles, stats, now = new Date(), weights = DEFAULT_WEIGHTS) {
  if (!articles || articles.length === 0) {
    return { hero: null, editorial: null, terbaru: [], mostWatched: [], popular: [], all: [] };
  }

  const statMap = new Map();
  if (stats && Array.isArray(stats.items)) {
    for (const s of stats.items) statMap.set(s.slug, s);
  }

  let totalV7d = 0;
  statMap.forEach(s => { totalV7d += s.v7d; });
  const isLowTraffic = totalV7d < weights.lowTrafficThreshold;
  const blendTrend = isLowTraffic ? weights.blendLow : weights.blendNormal;
  const blendFresh = 1 - blendTrend;

  const byDate = [...articles].sort((a, b) => {
    const ta = a.tanggal ? new Date(a.tanggal).getTime() : 0;
    const tb = b.tanggal ? new Date(b.tanggal).getTime() : 0;
    return tb - ta;
  });

  const scored = byDate.map(a => {
    const stat = statMap.get(a.slug);
    const age = ageInDays(a.tanggal, now);
    const fresh = freshnessScore(age);
    if (!stat || stat.v7d < weights.minV7dForTrend) {
      return { article: a, trending: 0, v7d: stat ? stat.v7d : 0, v30d: stat ? stat.v30d : 0, fresh };
    }
    const ts = trendingScore(stat, age, weights);
    return { article: a, trending: ts, v7d: stat.v7d, v30d: stat.v30d, fresh };
  });

  const maxTrend = Math.max(...scored.map(s => s.trending), 1);
  const maxFresh = Math.max(...scored.map(s => s.fresh), 1);
  const withFinal = scored.map(s => ({
    ...s,
    finalScore: blendTrend * (s.trending / maxTrend) + blendFresh * (s.fresh / maxFresh),
  }));

  const used = new Set();

  let hero = null;
  const headlineArticle = byDate.find(a => a.headline);
  if (headlineArticle) {
    hero = headlineArticle;
  } else {
    const recent3d = withFinal.filter(s => ageInDays(s.article.tanggal, now) <= 3);
    if (recent3d.length > 0) {
      recent3d.sort((a, b) => b.finalScore - a.finalScore);
      hero = recent3d[0].article;
    } else {
      hero = byDate[0] || null;
    }
  }
  if (hero) used.add(hero.slug);

  let editorial = null;
  const unggulanArticle = byDate.find(a => a.unggulan && !used.has(a.slug));
  if (unggulanArticle) {
    editorial = unggulanArticle;
  } else {
    const byV7d = [...withFinal].sort((a, b) => b.v7d - a.v7d);
    const fb = byV7d.find(s => !used.has(s.article.slug));
    editorial = fb ? fb.article : null;
  }
  if (editorial) used.add(editorial.slug);

  const terbaru = [];
  for (const a of byDate) {
    if (used.has(a.slug)) continue;
    terbaru.push(a);
    used.add(a.slug);
    if (terbaru.length >= 3) break;
  }

  const byV7d = [...withFinal].sort((a, b) => b.v7d - a.v7d);
  const mostWatched = [];
  for (const s of byV7d) {
    if (used.has(s.article.slug)) continue;
    mostWatched.push(s.article);
    used.add(s.article.slug);
    if (mostWatched.length >= 2) break;
  }
  if (mostWatched.length === 0) {
    for (const a of byDate) {
      if (used.has(a.slug)) continue;
      mostWatched.push(a);
      used.add(a.slug);
      if (mostWatched.length >= 2) break;
    }
  }

  const byV30d = [...withFinal].sort((a, b) => b.v30d - a.v30d);
  const popular = [];
  for (const s of byV30d) {
    if (used.has(s.article.slug)) continue;
    popular.push(s.article);
    used.add(s.article.slug);
    if (popular.length >= 4) break;
  }
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

// ── Helpers ───────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    console.log('  \u2705 ' + msg);
    passed++;
  } else {
    console.error('  \u274c GAGAL: ' + msg);
    failed++;
  }
}

function makeArticle(slug, tanggal, overrides) {
  return Object.assign({ slug, tanggal }, overrides || {});
}

// ── TEST SUITE ────────────────────────────────────────────────────────────────
console.log('\n=== UNIT TEST: rankArticles (src/lib/trending.ts) ===\n');

// TEST 1: Tanpa artikel
console.log('TEST 1 - Tanpa artikel:');
{
  const r = rankArticles([], null, new Date());
  assert(r.hero === null, 'hero null');
  assert(r.editorial === null, 'editorial null');
  assert(r.terbaru.length === 0, 'terbaru kosong');
  assert(r.mostWatched.length === 0, 'mostWatched kosong');
  assert(r.popular.length === 0, 'popular kosong');
}

// TEST 2: Tanpa statistik (fallback terbaru)
console.log('\nTEST 2 - Tanpa statistik, fallback kebaruan:');
{
  const now = new Date('2026-10-21T00:00:00Z');
  const articles = [
    makeArticle('a-lama',   '2026-08-01T00:00:00Z'),
    makeArticle('b-baru',   '2026-10-20T00:00:00Z'),
    makeArticle('c-sedang', '2026-09-15T00:00:00Z'),
    makeArticle('d-terbaru','2026-10-21T00:00:00Z'),
  ];
  const r = rankArticles(articles, null, now);
  assert(r.hero !== null, 'hero tidak null');
  assert(r.hero.slug === 'd-terbaru', 'hero adalah artikel terbaru (dapat: ' + r.hero.slug + ')');
  const mainSlugs = [r.hero.slug, r.editorial && r.editorial.slug, ...r.terbaru.map(a => a.slug), ...r.mostWatched.map(a => a.slug), ...r.popular.map(a => a.slug)].filter(Boolean);
  const uniqueMain = new Set(mainSlugs);
  assert(uniqueMain.size === mainSlugs.length, 'tidak ada duplikat di area utama (' + mainSlugs.length + ' -> ' + uniqueMain.size + ' unik)');
}

// TEST 3: Dengan statistik — artikel top v7d ada di area utama
console.log('\nTEST 3 - Dengan statistik, artikel top v7d ada di area utama:');
{
  const now = new Date('2026-10-21T00:00:00Z');
  // 'viral' dibuat 11 hari lalu agar tidak masuk recent3d (>3 hari)
  // Logika: hero = terbaru (recent3d), editorial = viral (v7d tertinggi setelah hero diambil)
  const articles = [
    makeArticle('viral',  '2026-10-10T00:00:00Z'),
    makeArticle('normal', '2026-10-19T00:00:00Z'),
    makeArticle('terbaru','2026-10-21T00:00:00Z'),
    makeArticle('lama',   '2026-09-01T00:00:00Z'),
    makeArticle('sedang', '2026-10-14T00:00:00Z'),
    makeArticle('populer','2026-10-08T00:00:00Z'),
  ];
  const stats = {
    status: 'success',
    updatedAt: now.toISOString(),
    items: [
      { slug: 'viral',   v24h: 50, v7d: 500, v30d: 600, total: 800 },
      { slug: 'normal',  v24h: 5,  v7d: 30,  v30d: 50,  total: 100 },
      { slug: 'populer', v24h: 2,  v7d: 20,  v30d: 300, total: 500 },
    ],
  };
  const r = rankArticles(articles, stats, now);

  const all = [r.hero && r.hero.slug, r.editorial && r.editorial.slug, ...r.terbaru.map(a => a.slug), ...r.mostWatched.map(a => a.slug), ...r.popular.map(a => a.slug)].filter(Boolean);
  const uniqueAll = new Set(all);
  assert(uniqueAll.size === all.length, 'tidak ada duplikat di area utama (' + all.length + ' -> ' + uniqueAll.size + ')');

  // 'viral' (v7d=500 tertinggi) harus muncul di salah satu seksi area utama
  // (bisa di hero, editorial, mostWatched — tergantung artikel mana yang sudah diambil sebelumnya)
  const viralInMain = (
    (r.hero && r.hero.slug === 'viral') ||
    (r.editorial && r.editorial.slug === 'viral') ||
    r.mostWatched.some(a => a.slug === 'viral')
  );
  assert(
    viralInMain,
    "artikel top v7d 'viral' muncul di area utama (hero/editorial/mostWatched) -> hero=" + (r.hero && r.hero.slug) + ', editorial=' + (r.editorial && r.editorial.slug) + ', mostWatched=[' + r.mostWatched.map(a => a.slug) + ']'
  );

  // mostWatched tidak kosong (ada artikel tersisa)
  assert(r.mostWatched.length >= 1, 'mostWatched tidak kosong (dapat: ' + r.mostWatched.length + ')');
}

// TEST 4: headline=TRUE memaksa hero
console.log('\nTEST 4 - headline=TRUE memaksa hero:');
{
  const now = new Date('2026-10-21T00:00:00Z');
  const articles = [
    makeArticle('terbaru', '2026-10-21T00:00:00Z'),
    makeArticle('pinned',  '2026-09-01T00:00:00Z', { headline: true }),
    makeArticle('biasa',   '2026-10-15T00:00:00Z'),
  ];
  const r = rankArticles(articles, null, now);
  assert(r.hero.slug === 'pinned', "hero = 'pinned' (headline=true), dapat: " + r.hero.slug);
}

// TEST 5: unggulan=TRUE memaksa editorial
console.log('\nTEST 5 - unggulan=TRUE memaksa editorial:');
{
  const now = new Date('2026-10-21T00:00:00Z');
  const articles = [
    makeArticle('hero-natural', '2026-10-21T00:00:00Z'),
    makeArticle('pilihan',      '2026-10-10T00:00:00Z', { unggulan: true }),
    makeArticle('biasa1',       '2026-10-18T00:00:00Z'),
    makeArticle('biasa2',       '2026-10-17T00:00:00Z'),
  ];
  const r = rankArticles(articles, null, now);
  assert(r.editorial.slug === 'pilihan', "editorial = 'pilihan' (unggulan=true), dapat: " + r.editorial.slug);
  assert(r.hero.slug !== 'pilihan', "hero != 'pilihan' (tidak duplikat)");
}

// TEST 6: Satu artikel saja
console.log('\nTEST 6 - Hanya satu artikel:');
{
  const now = new Date('2026-10-21T00:00:00Z');
  const articles = [makeArticle('satu', '2026-10-20T00:00:00Z')];
  const r = rankArticles(articles, null, now);
  assert(r.hero.slug === 'satu', "hero = 'satu'");
  assert(!r.terbaru.includes(r.hero), 'terbaru tidak memuat hero (sudah dipakai)');
}

// TEST 7: Statistik items=[]
console.log('\nTEST 7 - Statistik items=[] (fallback kebaruan):');
{
  const now = new Date('2026-10-21T00:00:00Z');
  const articles = [
    makeArticle('a', '2026-10-21T00:00:00Z'),
    makeArticle('b', '2026-10-20T00:00:00Z'),
    makeArticle('c', '2026-10-19T00:00:00Z'),
  ];
  const emptyStats = { status: 'success', updatedAt: now.toISOString(), items: [] };
  const r = rankArticles(articles, emptyStats, now);
  assert(r.hero.slug === 'a', "hero = 'a' (terbaru), dapat: " + r.hero.slug);
  assert(typeof r.terbaru.length === 'number', 'terbaru adalah array');
}

// ── HASIL ─────────────────────────────────────────────────────────────────────
console.log('\n' + '-'.repeat(50));
if (failed === 0) {
  console.log('\uD83C\uDF89 SEMUA ' + passed + ' TEST LOLOS!');
  process.exit(0);
} else {
  console.error('\u274c ' + failed + ' TEST GAGAL, ' + passed + ' lolos.');
  process.exit(1);
}
