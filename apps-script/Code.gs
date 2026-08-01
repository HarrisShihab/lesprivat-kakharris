const CONFIG = Object.freeze({
  DRIVE_FOLDER_ID: "1Y6cZPRZ0uQI7c5lhChl5kyMS3ywpMUPH",
  FIREBASE_PROJECT_ID: "les-privat-kak-harris",
  FIREBASE_WEB_API_KEY: "AIzaSyA2BVsutEZOJmh3-aBUoPBjJeVmJ2YO7cQ",
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
});

function doGet() {
  return jsonResponse_({
    status: "success",
    message: "Layanan upload bukti pembayaran aktif.",
  });
}

function doPost(e) {
  let uploadedFile = null;
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || "{}");
    if (payload.action !== "uploadBuktiPembayaran") throw new Error("Aksi tidak dikenali.");

    const identity = verifyFirebaseToken_(payload.idToken);
    const uid = identity.localId;
    const idMurid = validateId_(payload.idMurid, "ID murid");
    const userProfile = getUserProfile_(uid, payload.idToken);
    validateParentAccess_(userProfile, idMurid);

    const file = validateFile_(payload.file);
    const nominal = validateNominal_(payload.nominal);
    const keterangan = cleanText_(payload.keterangan, 300);
    if (!keterangan) throw new Error("Keterangan pembayaran wajib diisi.");

    enforceUploadRateLimit_(uid);
    const documentId = Utilities.getUuid();
    const extension = extensionForMime_(file.mimeType);
    const uploadDate = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
    const safeName = `${uploadDate}_${idMurid}_${documentId}.${extension}`;
    const bytes = Utilities.base64Decode(file.base64);
    const blob = Utilities.newBlob(bytes, file.mimeType, safeName);
    const folder = DriveApp.getFolderById(CONFIG.DRIVE_FOLDER_ID);
    uploadedFile = folder.createFile(blob);
    uploadedFile.setDescription(`Bukti pembayaran ${idMurid} | diunggah oleh UID ${uid}`);

    createPaymentProofDocument_({
      documentId,
      uid,
      idMurid,
      fileId: uploadedFile.getId(),
      fileName: safeName,
      originalFileName: cleanText_(file.name, 150),
      mimeType: file.mimeType,
      size: bytes.length,
      nominal,
      keterangan,
      uploadDate,
    });

    return jsonResponse_({
      status: "success",
      message: "Bukti pembayaran berhasil dikirim dan menunggu konfirmasi.",
      data: { id: documentId, status: "Menunggu konfirmasi" },
    });
  } catch (error) {
    if (uploadedFile) {
      try {
        uploadedFile.setTrashed(true);
      } catch (cleanupError) {
        console.error("Gagal membersihkan file setelah error:", cleanupError);
      }
    }
    console.error(error);
    return jsonResponse_({ status: "error", message: error.message || "Upload gagal." });
  }
}

function verifyFirebaseToken_(idToken) {
  const token = String(idToken || "").trim();
  if (!token) throw new Error("Sesi login tidak ditemukan. Silakan login kembali.");
  const response = UrlFetchApp.fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(CONFIG.FIREBASE_WEB_API_KEY)}`,
    {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify({ idToken: token }),
      muteHttpExceptions: true,
    },
  );
  const body = parseJson_(response.getContentText());
  if (response.getResponseCode() !== 200 || !body.users || !body.users[0]) {
    throw new Error("Sesi login tidak valid atau sudah kedaluwarsa.");
  }
  return body.users[0];
}

function getUserProfile_(uid, idToken) {
  const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/(default)/documents/users/${encodeURIComponent(uid)}`;
  const response = UrlFetchApp.fetch(url, {
    method: "get",
    headers: { Authorization: `Bearer ${idToken}` },
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) throw new Error("Profil akun tidak dapat diverifikasi.");
  return parseJson_(response.getContentText()).fields || {};
}

function validateParentAccess_(fields, idMurid) {
  const role = fields.role && fields.role.stringValue;
  const active = fields.aktif && fields.aktif.booleanValue;
  const studentValues = (((fields.muridIds || {}).arrayValue || {}).values || []).map((item) => item.stringValue);
  if (role !== "orangtua" || active !== true) throw new Error("Hanya akun orang tua aktif yang dapat mengunggah bukti.");
  if (!studentValues.includes(idMurid)) throw new Error("Akun tidak terhubung dengan murid yang dipilih.");
}

function validateFile_(file) {
  if (!file || typeof file !== "object") throw new Error("File bukti wajib dipilih.");
  const mimeType = String(file.mimeType || "").toLowerCase();
  const base64 = String(file.base64 || "").replace(/^data:[^;]+;base64,/, "").replace(/\s/g, "");
  if (!CONFIG.ALLOWED_MIME_TYPES.includes(mimeType)) throw new Error("Format file harus JPG, PNG, WebP, atau PDF.");
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64) || !base64) throw new Error("Isi file tidak valid.");
  const estimatedSize = Math.floor((base64.length * 3) / 4) - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  if (estimatedSize <= 0 || estimatedSize > CONFIG.MAX_FILE_SIZE) throw new Error("Ukuran file maksimal 5 MB.");
  return { name: String(file.name || "bukti"), mimeType, base64 };
}

function createPaymentProofDocument_(data) {
  const url = `https://firestore.googleapis.com/v1/projects/${CONFIG.FIREBASE_PROJECT_ID}/databases/(default)/documents/buktiPembayaran?documentId=${encodeURIComponent(data.documentId)}`;
  const fields = {
    idMurid: { stringValue: data.idMurid },
    createdBy: { stringValue: data.uid },
    fileId: { stringValue: data.fileId },
    fileName: { stringValue: data.fileName },
    originalFileName: { stringValue: data.originalFileName },
    mimeType: { stringValue: data.mimeType },
    size: { integerValue: String(data.size) },
    nominal: { integerValue: String(data.nominal) },
    keterangan: { stringValue: data.keterangan },
    tanggalUpload: { stringValue: data.uploadDate },
    status: { stringValue: "Menunggu konfirmasi" },
    createdAt: { timestampValue: new Date().toISOString() },
  };
  const response = UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: `Bearer ${ScriptApp.getOAuthToken()}` },
    payload: JSON.stringify({ fields }),
    muteHttpExceptions: true,
  });
  if (response.getResponseCode() !== 200) {
    console.error(response.getContentText());
    throw new Error("Metadata bukti gagal dicatat. Silakan coba lagi.");
  }
}

function enforceUploadRateLimit_(uid) {
  const cache = CacheService.getScriptCache();
  const key = `upload:${uid}`;
  if (cache.get(key)) throw new Error("Tunggu satu menit sebelum mengunggah bukti berikutnya.");
  cache.put(key, "1", 60);
}

function validateNominal_(value) {
  const nominal = Number(value);
  if (!Number.isInteger(nominal) || nominal < 1000 || nominal > 100000000) throw new Error("Nominal pembayaran tidak valid.");
  return nominal;
}

function validateId_(value, label) {
  const result = String(value || "").trim();
  if (!/^[A-Za-z0-9_-]{1,80}$/.test(result)) throw new Error(`${label} tidak valid.`);
  return result;
}

function cleanText_(value, maxLength) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f<>]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function extensionForMime_(mimeType) {
  return {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  }[mimeType];
}

function parseJson_(text) {
  try {
    return JSON.parse(text || "{}");
  } catch (error) {
    return {};
  }
}

function jsonResponse_(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
