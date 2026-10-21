/**
 * API Backend Berita MA Margajaya
 * Fitur:
 * 1. Autentikasi Server-Side dengan Session Token Dinamis (UUID + CacheService)
 * 2. Tambah Warta Baru + Validasi Foto (MIME & Ukuran) ke Google Drive
 * 3. Hapus Warta Berdasarkan ID beserta fotonya di Google Drive (dilindungi autentikasi)
 * 4. Ambil Semua Warta (GET - terurut tanggal terbaru)
 * 5. Trigger Rebuild (Vercel Deploy Hook) otomatis saat data berubah
 * 6. [BARU] Pencatat kunjungan anonim: doPost action=hit + views_daily sheet
 * 7. [BARU] Statistik tren: doGet?action=stats (cache 10 menit)
 *
 * Struktur Kolom Sheet "Berita":
 * A=id | B=judul | C=isi | D=tanggal | E=url_foto | F=penulis | G=kategori | H=headline | I=unggulan
 *
 * Sheet "views_daily" (baru):
 * A=tanggal (yyyy-MM-dd) | B=slug | C=jumlah
 */

const SHEET_NAME = 'Berita';
const SHEET_VIEWS = 'views_daily';
const DRIVE_FOLDER_ID = '1j_oplUYFFesAewJP9JyyydJcnBZZRCFI';

// Properti di Script Properties (File -> Project Settings -> Script Properties)
const SCRIPT_PROP_PASSWORD = 'ADMIN_PASSWORD';
const SCRIPT_PROP_DEPLOY_HOOK = 'DEPLOY_HOOK_URL';

// Durasi cache (detik)
const CACHE_SESSION_TTL  = 21600; // 6 jam – session token admin
const CACHE_HIT_TTL      = 21600; // 6 jam – dedupe kunjungan per cid+slug
// Rate limiting login admin
const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_LOCK_TTL     = 600; // 10 menit (600 detik)

/**
 * Helper untuk mengambil password admin dari Script Properties.
 * TIDAK ADA fallback kata sandi hardcoded demi keamanan sistem.
 */
function getAdminPassword() {
  const props = PropertiesService.getScriptProperties();
  const pass = props.getProperty(SCRIPT_PROP_PASSWORD);
  return pass ? String(pass).trim() : null;
}

/**
 * Perbandingan string waktu-konstan (constant-time comparison)
 * Mencegah timing attack (serangan analisis durasi respons)
 */
function constantTimeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  var lenA = a.length;
  var lenB = b.length;
  var result = lenA ^ lenB;
  var maxLen = Math.max(lenA, lenB);
  for (var i = 0; i < maxLen; i++) {
    var charA = i < lenA ? a.charCodeAt(i) : 0;
    var charB = i < lenB ? b.charCodeAt(i) : 0;
    result |= (charA ^ charB);
  }
  return result === 0;
}

/**
 * Menghasilkan token sesi dinamis berbasis UUID dan menyimpannya di CacheService
 * Masa berlaku: 6 jam (21600 detik)
 */
function generateSessionToken() {
  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  cache.put('session_' + token, 'valid', CACHE_SESSION_TTL);
  return token;
}

/**
 * Memvalidasi apakah token sesi masih aktif di CacheService
 */
function isValidSessionToken(token) {
  if (!token) return false;
  const cache = CacheService.getScriptCache();
  return cache.get('session_' + token) === 'valid';
}

/**
 * Memicu build ulang di Vercel via Deploy Hook
 */
function triggerRebuild() {
  try {
    const props = PropertiesService.getScriptProperties();
    const hookUrl = props.getProperty(SCRIPT_PROP_DEPLOY_HOOK);
    if (hookUrl && hookUrl.startsWith('http')) {
      UrlFetchApp.fetch(hookUrl, {
        method: 'post',
        muteHttpExceptions: true
      });
      Logger.log('Deploy hook berhasil dipanggil ke Vercel.');
    }
  } catch (err) {
    Logger.log('Peringatan: Gagal memicu deploy hook: ' + err.toString());
  }
}

/**
 * Helper untuk menghapus file foto dari Google Drive berdasarkan URL.
 */
function deleteDrivePhoto(urlFoto) {
  if (!urlFoto) return false;
  try {
    var fileId = null;
    var idMatch = urlFoto.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (idMatch && idMatch[1]) {
      fileId = idMatch[1];
    } else {
      var dMatch = urlFoto.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (dMatch && dMatch[1]) {
        fileId = dMatch[1];
      }
    }
    if (fileId) {
      var file = DriveApp.getFileById(fileId);
      file.setTrashed(true);
      Logger.log('Foto Google Drive berhasil dipindah ke Trash: ' + fileId);
      return true;
    }
  } catch (err) {
    Logger.log('Peringatan: Gagal menghapus foto dari Drive: ' + err.toString());
  }
  return false;
}

/**
 * Helper response JSON standar
 */
function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper response text/plain (dipakai untuk hit endpoint agar tidak memicu CORS preflight)
 */
function textResponse(msg) {
  return ContentService.createTextOutput(msg)
    .setMimeType(ContentService.MimeType.TEXT);
}

// ===========================================================================
// STATISTIK: Fungsi bantu untuk sheet views_daily
// ===========================================================================

/**
 * Pastikan sheet views_daily ada; buat jika belum ada.
 */
function getOrCreateViewsSheet(ss) {
  var sheet = ss.getSheetByName(SHEET_VIEWS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_VIEWS);
    sheet.appendRow(['tanggal', 'slug', 'jumlah']);
    sheet.setFrozenRows(1);
    // Format kolom C sebagai angka
    sheet.getRange('C:C').setNumberFormat('0');
    Logger.log('Sheet views_daily berhasil dibuat.');
  }
  return sheet;
}

/**
 * Hitung statistik kunjungan dari sheet views_daily.
 * Kembalikan array: [{slug, v24h, v7d, v30d, total}]
 */
function computeStats() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_VIEWS);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const now = new Date();
  const msPerDay = 86400000;
  const cutoff24h = new Date(now - 1 * msPerDay);
  const cutoff7d  = new Date(now - 7 * msPerDay);
  const cutoff30d = new Date(now - 30 * msPerDay);

  // slug -> { v24h, v7d, v30d, total }
  const map = {};

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var rawDate = String(row[0] || '').trim();
    var slug    = String(row[1] || '').trim();
    var jumlah  = parseInt(row[2]) || 0;
    if (!slug || jumlah <= 0) continue;

    // Parse tanggal yyyy-MM-dd
    var d = new Date(rawDate + 'T00:00:00');
    if (isNaN(d.getTime())) continue;

    if (!map[slug]) map[slug] = { v24h: 0, v7d: 0, v30d: 0, total: 0 };
    map[slug].total += jumlah;
    if (d >= cutoff30d) map[slug].v30d += jumlah;
    if (d >= cutoff7d)  map[slug].v7d  += jumlah;
    if (d >= cutoff24h) map[slug].v24h  += jumlah;
  }

  var result = [];
  for (var s in map) {
    result.push({ slug: s, v24h: map[s].v24h, v7d: map[s].v7d, v30d: map[s].v30d, total: map[s].total });
  }
  return result;
}

/**
 * Validasi apakah slug ada di sheet Berita.
 * Gunakan cache CacheService agar tidak membaca sheet setiap kali.
 */
function isValidSlug(slug, ss) {
  if (!slug) return false;
  var cache = CacheService.getScriptCache();
  var cacheKey = 'slugset_v1';
  var cached = cache.get(cacheKey);
  var slugSet;

  if (cached) {
    try { slugSet = JSON.parse(cached); } catch(e) { slugSet = null; }
  }

  if (!slugSet) {
    // Bangun set slug dari sheet Berita (kolom B=judul + A=id untuk generate slug)
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    var values = sheet.getDataRange().getValues();
    slugSet = {};
    for (var i = 1; i < values.length; i++) {
      var id    = String(values[i][0] || '').trim();
      var judul = String(values[i][1] || '').trim();
      if (!id) continue;
      // Replicate generateNewsSlug logic (harus identik dengan news.ts)
      var cleanTitle = judul.toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .substring(0, 50);
      var rawId = id.replace(/^news_/, '');
      var shortId = rawId.length > 6 ? rawId.slice(-6) : rawId;
      var generatedSlug = cleanTitle ? (cleanTitle + '-' + shortId) : ('warta-' + shortId);
      slugSet[generatedSlug] = true;
    }
    cache.put(cacheKey, JSON.stringify(slugSet), 300); // cache 5 menit
  }

  return !!slugSet[slug];
}

// ===========================================================================
// HANDLER UTAMA
// ===========================================================================

/**
 * Handle HTTP GET
 * - Default (tanpa action): Ambil semua berita (terurut tanggal terbaru) — TIDAK BERUBAH
 * - ?action=stats : Statistik tren dari views_daily (cache 10 menit)
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';

    // =========================================================================
    // BARU: AKSI STATS — kembalikan data tren dari views_daily
    // =========================================================================
    if (action === 'stats') {
      var cache = CacheService.getScriptCache();
      var statsKey = 'stats_v1';
      var cached = cache.get(statsKey);
      if (cached) {
        return jsonResponse(JSON.parse(cached));
      }
      var items = computeStats();
      var payload = {
        status: 'success',
        updatedAt: new Date().toISOString(),
        items: items
      };
      cache.put(statsKey, JSON.stringify(payload), CACHE_STATS_TTL);
      return jsonResponse(payload);
    }

    // =========================================================================
    // PERILAKU LAMA: Ambil semua berita (TIDAK BERUBAH)
    // =========================================================================
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];
    const data = sheet.getDataRange().getValues();

    if (data.length <= 1) {
      return jsonResponse({
        status: 'success',
        total: 0,
        data: []
      });
    }

    const rows = data.slice(1);

    // Kolom: [0]=id | [1]=judul | [2]=isi | [3]=tanggal | [4]=url_foto | [5]=penulis
    //        [6]=kategori | [7]=headline | [8]=unggulan  (baru, kompatibel mundur)
    const result = rows.map(function(row) {
      return {
        id:        row[0] || '',
        judul:     row[1] || '',
        isi:       row[2] || '',
        tanggal:   row[3] || '',
        url_foto:  row[4] || '',
        penulis:   row[5] || 'Humas MA Margajaya',
        kategori:  row[6] || '',
        headline:  String(row[7] || '').toUpperCase() === 'TRUE',
        unggulan:  String(row[8] || '').toUpperCase() === 'TRUE'
      };
    }).filter(function(item) {
      return item.judul || item.isi;
    });

    // Urutkan berdasarkan tanggal terbaru (descending)
    result.sort(function(a, b) {
      const timeA = a.tanggal ? new Date(a.tanggal).getTime() : 0;
      const timeB = b.tanggal ? new Date(b.tanggal).getTime() : 0;
      if (timeB !== timeA) return timeB - timeA;
      const idA = parseInt((a.id || '').replace('news_', '')) || 0;
      const idB = parseInt((b.id || '').replace('news_', '')) || 0;
      return idB - idA;
    });

    return jsonResponse({
      status: 'success',
      total: result.length,
      data: result
    });

  } catch (err) {
    return jsonResponse({
      status: 'error',
      message: err.toString()
    });
  }
}

/**
 * Handle HTTP POST - Autentikasi, Tambah, Hapus Berita + Pencatat Kunjungan (action=hit)
 */
function doPost(e) {
  // =========================================================================
  // BARU: AKSI HIT — pencatat kunjungan anonim (tanpa auth, tanpa lock besar)
  // Terima: Content-Type: text/plain JSON {slug, cid}
  // Diakses via fetch/sendBeacon dari browser; tidak memerlukan auth token.
  // =========================================================================
  try {
    var rawBody = (e && e.postData && e.postData.contents) ? e.postData.contents : '';
    var hitData;
    try { hitData = JSON.parse(rawBody); } catch(_) { hitData = {}; }

    if (hitData && hitData.action === 'hit') {
      var slug = String(hitData.slug || '').trim().substring(0, 200);
      var cid  = String(hitData.cid  || '').trim().substring(0, 64);

      if (!slug || !cid) return textResponse('bad_request');

      // Validasi slug ada di sheet Berita
      var ss0 = SpreadsheetApp.getActiveSpreadsheet();
      if (!isValidSlug(slug, ss0)) return textResponse('invalid_slug');

      // Dedupe: CacheService key v:{cid}:{slug} selama 6 jam
      var dedupeCache = CacheService.getScriptCache();
      var dedupeKey = 'v:' + cid + ':' + slug;
      if (dedupeCache.get(dedupeKey)) return textResponse('deduped');
      dedupeCache.put(dedupeKey, '1', CACHE_HIT_TTL);

      // Tulis ke views_daily dengan LockService (tunggu maks 5 detik)
      var hitLock = LockService.getScriptLock();
      var hasHitLock = hitLock.tryLock(5000);
      if (!hasHitLock) return textResponse('busy');

      try {
        var viewsSheet = getOrCreateViewsSheet(ss0);
        var today = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd');
        var viewData = viewsSheet.getDataRange().getValues();
        var found = false;

        // Cari baris tanggal+slug hari ini
        for (var vi = 1; vi < viewData.length; vi++) {
          if (String(viewData[vi][0]).trim() === today && String(viewData[vi][1]).trim() === slug) {
            var currentCount = parseInt(viewData[vi][2]) || 0;
            viewsSheet.getRange(vi + 1, 3).setValue(currentCount + 1);
            found = true;
            break;
          }
        }
        if (!found) {
          viewsSheet.appendRow([today, slug, 1]);
        }

        // Hapus cache statistik agar stats endpoint fresh
        var statsCache = CacheService.getScriptCache();
        statsCache.remove('stats_v1');

      } finally {
        hitLock.releaseLock();
      }

      return textResponse('ok');
    }
  } catch (hitErr) {
    Logger.log('hit error: ' + hitErr.toString());
    return textResponse('error');
  }

  // =========================================================================
  // PERILAKU LAMA: Autentikasi, Tambah, Hapus (dijaga LockService 15 detik)
  // =========================================================================
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(15000);

  if (!hasLock) {
    return jsonResponse({
      status: 'error',
      message: 'Server sedang sibuk memproses antrean. Silakan coba kembali dalam beberapa detik.'
    });
  }

  try {
    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      throw new Error('Tidak ada payload data yang diterima.');
    }

    // =========================================================================
    // AKSI 1: AUTENTIKASI LOGIN (action: "login")
    // Dilindungi: Server-side validation, constant-time compare, rate limiting 5x/10m
    // =========================================================================
    if (data.action === 'login') {
      const adminPass = getAdminPassword();
      if (!adminPass) {
        return jsonResponse({
          status: 'error',
          message: 'Konfigurasi keamanan belum lengkap: ADMIN_PASSWORD belum diatur di Script Properties.'
        });
      }

      const cache = CacheService.getScriptCache();
      const clientKey = data.cid ? String(data.cid).trim().substring(0, 64) : 'admin_default';
      const lockKey = 'login_lock_' + clientKey;
      const failKey = 'login_fails_' + clientKey;

      // 1. Cek apakah IP/klien sedang dalam masa lockout (5x salah)
      if (cache.get(lockKey)) {
        return jsonResponse({
          status: 'error',
          message: 'Akses diblokir sementara: Terlalu banyak percobaan kata sandi yang salah (5x). Silakan coba lagi setelah 10 menit.'
        });
      }

      const inputPass = String(data.password || '').trim();
      const isMatch = constantTimeCompare(inputPass, adminPass);

      if (isMatch) {
        // Reset counter kesalahan saat login berhasil
        cache.remove(failKey);
        cache.remove(lockKey);

        const sessionToken = generateSessionToken();
        return jsonResponse({
          status: 'success',
          token: sessionToken,
          message: 'Autentikasi berhasil.'
        });
      } else {
        // Catat percobaan gagal ke CacheService (TTL 10 menit)
        let fails = parseInt(cache.get(failKey) || '0', 10) + 1;
        if (fails >= RATE_LIMIT_MAX_ATTEMPTS) {
          cache.put(lockKey, 'locked', RATE_LIMIT_LOCK_TTL);
          cache.remove(failKey);
          return jsonResponse({
            status: 'error',
            message: 'Batas percobaan gagal terlampaui (5x). Akses login diblokir selama 10 menit demi keamanan.'
          });
        } else {
          cache.put(failKey, String(fails), RATE_LIMIT_LOCK_TTL);
          const remaining = RATE_LIMIT_MAX_ATTEMPTS - fails;
          return jsonResponse({
            status: 'error',
            message: 'Kata sandi administrator tidak sesuai. Sisa kesempatan: ' + remaining + ' kali sebelum dikunci 10 menit.'
          });
        }
      }
    }

    // =========================================================================
    // VALIDASI OTORISASI UNTUK SEMUA OPERASI TULIS
    // =========================================================================
    const clientToken = String(data.token || '').trim();
    if (!isValidSessionToken(clientToken)) {
      return jsonResponse({
        status: 'error',
        message: 'Akses ditolak: Token autentikasi tidak valid atau sesi telah kedaluwarsa. Silakan login kembali.'
      });
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME) || ss.getSheets()[0];

    // =========================================================================
    // AKSI 2: HAPUS WARTA (action: "delete")
    // =========================================================================
    if (data.action === 'delete') {
      var targetId = String(data.id || '').trim();
      if (!targetId) {
        return jsonResponse({
          status: 'error',
          message: 'ID warta yang akan dihapus wajib disertakan.'
        });
      }

      var values = sheet.getDataRange().getValues();
      var deleted = false;
      var photoDeleted = false;

      for (var i = values.length - 1; i >= 1; i--) {
        var rowId = String(values[i][0] || '').trim();
        if (rowId === targetId) {
          var urlFoto = String(values[i][4] || '').trim();
          if (urlFoto) {
            photoDeleted = deleteDrivePhoto(urlFoto);
          }
          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      // Invalidasi cache slug set
      CacheService.getScriptCache().remove('slugset_v1');

      if (deleted) {
        triggerRebuild();
        return jsonResponse({
          status: 'success',
          message: 'Warta berita berhasil dihapus' + (photoDeleted ? ' beserta fotonya dari Google Drive.' : ' dari Google Sheets.'),
          deletedId: targetId,
          photoDeleted: photoDeleted
        });
      } else {
        return jsonResponse({
          status: 'error',
          message: 'Warta dengan ID tersebut tidak ditemukan.'
        });
      }
    }

    // =========================================================================
    // AKSI 3: TAMBAH WARTA BARU
    // =========================================================================
    var judul       = (data.judul     || '').trim();
    var isi         = (data.isi       || '').trim();
    var tanggal     = (data.tanggal   || '').trim();
    var penulis     = (data.penulis   || 'Humas MA Margajaya').trim();
    var kategori    = (data.kategori  || '').trim();
    var headlineVal = data.headline   ? 'TRUE' : '';
    var unggulanVal = data.unggulan   ? 'TRUE' : '';
    var imageBase64 = data.image_base64;
    var imageName   = data.image_name || ('foto_' + Date.now() + '.jpg');
    var imageType   = data.image_type || 'image/jpeg';

    if (!judul || !isi || !tanggal) {
      return jsonResponse({
        status: 'error',
        message: 'Field judul, isi, dan tanggal wajib diisi.'
      });
    }

    var urlFoto = '';

    if (imageBase64) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(imageType.toLowerCase())) {
        return jsonResponse({
          status: 'error',
          message: 'Format gambar tidak didukung. Harap unggah format JPG, PNG, atau WebP.'
        });
      }
      if (imageBase64.length > 14 * 1024 * 1024) {
        return jsonResponse({
          status: 'error',
          message: 'Ukuran foto melebihi batas maksimal 10 MB.'
        });
      }
      try {
        var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
        var decodedBytes = Utilities.base64Decode(imageBase64);
        var blob = Utilities.newBlob(decodedBytes, imageType, imageName);
        var file = folder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        urlFoto = 'https://drive.google.com/thumbnail?id=' + file.getId() + '&sz=w1200';
      } catch (driveErr) {
        Logger.log('Gagal upload ke Drive: ' + driveErr.toString());
        return jsonResponse({
          status: 'error',
          message: 'Gagal mengunggah gambar ke Google Drive: ' + driveErr.message
        });
      }
    }

    var id = 'news_' + new Date().getTime();

    // Kolom: [id, judul, isi, tanggal, url_foto, penulis, kategori, headline, unggulan]
    sheet.appendRow([id, judul, isi, tanggal, urlFoto, penulis, kategori, headlineVal, unggulanVal]);

    // Invalidasi cache slug set agar hit endpoint bisa memvalidasi slug baru
    CacheService.getScriptCache().remove('slugset_v1');

    triggerRebuild();

    return jsonResponse({
      status: 'success',
      message: 'Berita dan foto berhasil disimpan ke database.',
      data: {
        id:       id,
        judul:    judul,
        tanggal:  tanggal,
        penulis:  penulis,
        url_foto: urlFoto
      }
    });

  } catch (error) {
    return jsonResponse({
      status: 'error',
      message: error.toString()
    });
  } finally {
    lock.releaseLock();
  }
}

function testDriveAuth() {
  var folder = DriveApp.getFolderById(DRIVE_FOLDER_ID);
  var testFile = folder.createFile("test_izin.txt", "Tes Izin Drive Sukses!");
  Logger.log("File tes berhasil dibuat: " + testFile.getName() + " (ID: " + testFile.getId() + ")");
  testFile.setTrashed(true);
  Logger.log("Izin Tulis Google Drive Berhasil 100%!");
}

/**
 * Fungsi tes untuk endpoint stats (jalankan dari editor Apps Script)
 */
function testStats() {
  var items = computeStats();
  Logger.log('Stats: ' + JSON.stringify(items));
}
