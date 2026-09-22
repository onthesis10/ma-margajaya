/**
 * API Backend Berita MA Margajaya
 * Fitur:
 * 1. Autentikasi Server-Side dengan Session Token Dinamis (UUID + CacheService)
 * 2. Tambah Warta Baru + Validasi Foto (MIME & Ukuran) ke Google Drive
 * 3. Hapus Warta Berdasarkan ID beserta fotonya di Google Drive (dilindungi autentikasi)
 * 4. Ambil Semua Warta (GET - terurut tanggal terbaru)
 * 5. Trigger Rebuild (Cloudflare Deploy Hook) otomatis saat data berubah
 *
 * Struktur Kolom Sheet "Berita":
 * A=id | B=judul | C=isi | D=tanggal | E=url_foto | F=penulis
 */

const SHEET_NAME = 'Berita';
const DRIVE_FOLDER_ID = '1j_oplUYFFesAewJP9JyyydJcnBZZRCFI';

// Properti di Script Properties (File -> Project Settings -> Script Properties)
const SCRIPT_PROP_PASSWORD = 'ADMIN_PASSWORD';
const SCRIPT_PROP_DEPLOY_HOOK = 'DEPLOY_HOOK_URL';

/**
 * Helper untuk mengambil password admin dari Script Properties
 */
function getAdminPassword() {
  const props = PropertiesService.getScriptProperties();
  const pass = props.getProperty(SCRIPT_PROP_PASSWORD);
  return pass || 'Margajaya2026!';
}

/**
 * Menghasilkan token sesi dinamis berbasis UUID dan menyimpannya di CacheService
 * Masa berlaku: 6 jam (21600 detik)
 */
function generateSessionToken() {
  const token = Utilities.getUuid();
  const cache = CacheService.getScriptCache();
  cache.put('session_' + token, 'valid', 21600);
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
 * Memicu build ulang di Cloudflare Pages via Deploy Hook
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
      Logger.log('Deploy hook berhasil dipanggil ke Cloudflare Pages.');
    }
  } catch (err) {
    Logger.log('Peringatan: Gagal memicu deploy hook: ' + err.toString());
  }
}

/**
 * Helper untuk menghapus file foto dari Google Drive berdasarkan URL.
 * Mendukung URL thumbnail (drive.google.com/thumbnail?id=...)
 * maupun URL Drive langsung (drive.google.com/uc?id=... atau /file/d/...)
 * Menggunakan .setTrashed(true) agar file dipindahkan ke Trash.
 * Jika gagal atau file tidak ditemukan, fungsi menangkap error dan tidak menggagalkan proses.
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
 * Handle HTTP GET - Ambil semua berita (terurut tanggal terbaru)
 */
function doGet(e) {
  try {
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
    const result = rows.map(function(row) {
      return {
        id:       row[0] || '',
        judul:    row[1] || '',
        isi:      row[2] || '',
        tanggal:  row[3] || '',
        url_foto: row[4] || '',
        penulis:  row[5] || 'Humas MA Margajaya'
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
 * Handle HTTP POST - Autentikasi, Tambah, & Hapus Berita
 */
function doPost(e) {
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

    const adminPass = getAdminPassword();

    // =========================================================================
    // AKSI 1: AUTENTIKASI LOGIN (action: "login")
    // Mengembalikan token sesi acak unik (UUID) yang berlaku selama 6 jam
    // =========================================================================
    if (data.action === 'login') {
      const inputPass = String(data.password || '').trim();
      if (inputPass && inputPass === adminPass) {
        const sessionToken = generateSessionToken();
        return jsonResponse({
          status: 'success',
          token: sessionToken,
          message: 'Autentikasi berhasil.'
        });
      } else {
        return jsonResponse({
          status: 'error',
          message: 'Kata sandi administrator tidak sesuai.'
        });
      }
    }

    // =========================================================================
    // VALIDASI OTORISASI UNTUK SEMUA OPERASI TULIS (Hapus & Tambah)
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

      // Loop dari baris paling bawah ke atas
      for (var i = values.length - 1; i >= 1; i--) {
        var rowId = String(values[i][0] || '').trim();
        if (rowId === targetId) {
          // Ambil url_foto dari kolom E (index 4) sebelum baris dihapus
          var urlFoto = String(values[i][4] || '').trim();
          if (urlFoto) {
            photoDeleted = deleteDrivePhoto(urlFoto);
          }

          sheet.deleteRow(i + 1);
          deleted = true;
          break;
        }
      }

      if (deleted) {
        // Picu deploy hook Cloudflare jika terkonfigurasi
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
    var judul       = (data.judul   || '').trim();
    var isi         = (data.isi     || '').trim();
    var tanggal     = (data.tanggal || '').trim();
    var penulis     = (data.penulis || 'Humas MA Margajaya').trim();
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
      // 1. Validasi Tipe File (MIME Type)
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(imageType.toLowerCase())) {
        return jsonResponse({
          status: 'error',
          message: 'Format gambar tidak didukung. Harap unggah format JPG, PNG, atau WebP.'
        });
      }

      // 2. Validasi Ukuran File (Maksimal ~10 MB file mentah = ~14 MB string base64)
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

    // Kolom: [id, judul, isi, tanggal, url_foto, penulis]
    sheet.appendRow([id, judul, isi, tanggal, urlFoto, penulis]);

    // Picu deploy hook Cloudflare jika terkonfigurasi
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
