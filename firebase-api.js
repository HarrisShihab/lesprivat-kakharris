/* global firebase */
(function () {
  "use strict";

  const API_URL = "firebase://secure-api";
  window.FIREBASE_API_URL = API_URL;

  const cfg = window.FIREBASE_CONFIG || {};
  const notConfigured = !cfg.apiKey || cfg.apiKey.startsWith("ISI_") || !cfg.appId || cfg.appId.startsWith("ISI_");
  let auth = null;
  let db = null;
  let profilePromise = null;
  let authReadyPromise = null;

  const OK = (data, message) => ({ status: "success", ...(message ? { message } : {}), ...(data === undefined ? {} : { data }) });
  const ERR = (message) => ({ status: "error", message });
  const serverTime = () => firebase.firestore.FieldValue.serverTimestamp();
  const today = () => new Date().toISOString().slice(0, 10);

  function init() {
    if (notConfigured) throw new Error("Firebase belum dikonfigurasi. Isi firebase-config.js terlebih dahulu.");
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    auth = firebase.auth();
    db = firebase.firestore();
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
    if (!authReadyPromise) {
      authReadyPromise = new Promise((resolve) => {
        const stop = auth.onAuthStateChanged((user) => {
          stop();
          resolve(user);
        });
      });
    }
  }

  function plain(value, max = 500) {
    return String(value ?? "")
      .normalize("NFKC")
      .replace(/[\u0000-\u001f\u007f]/g, " ")
      .replace(/[<>]/g, "")
      .replace(/"/g, "”")
      .replace(/'/g, "’")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, max);
  }

  function idValue(value) {
    const out = String(value ?? "").trim();
    if (!/^[A-Za-z0-9_-]{1,80}$/.test(out)) throw new Error("ID tidak valid.");
    return out;
  }

  function dateValue(value) {
    const out = String(value ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(out)) throw new Error("Tanggal tidak valid.");
    return out;
  }

  function timeValue(value) {
    const out = String(value ?? "").trim();
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(out)) throw new Error("Jam tidak valid.");
    return out;
  }

  function safeHttpUrl(value, allowedHosts) {
    const raw = String(value || "").trim();
    if (!raw) return "";
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:") throw new Error("Tautan wajib menggunakan HTTPS.");
    if (allowedHosts && !allowedHosts.some((host) => parsed.hostname === host || parsed.hostname.endsWith("." + host))) {
      throw new Error("Domain tautan tidak diizinkan.");
    }
    return parsed.toString().slice(0, 1500);
  }

  function safeMultiUrl(value, hosts) {
    return String(value || "")
      .split("|")
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => safeHttpUrl(part, hosts))
      .join("|");
  }

  function usernameToEmail(identifier) {
    const value = String(identifier || "")
      .trim()
      .toLowerCase();
    if (value.includes("@")) return value;
    const username = value.replace(/[^a-z0-9._-]/g, "");
    if (!username) throw new Error("Username tidak valid.");
    return `${username}@${window.FIREBASE_USERNAME_DOMAIN || "akun.lesprivat-kakharris.id"}`;
  }

  function usernameValue(value) {
    const username = String(value || "")
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9][a-z0-9._-]{2,39}$/.test(username)) {
      throw new Error("Username harus 3–40 karakter dan hanya berisi huruf kecil, angka, titik, garis bawah, atau tanda hubung.");
    }
    return username;
  }

  async function waitAuth() {
    init();
    return authReadyPromise;
  }

  async function currentProfile(force = false) {
    await waitAuth();
    // Always read the current Auth state after the initial listener settles.
    // The listener promise may have resolved with `null` before a login occurs,
    // while `auth.currentUser` is already populated after signIn completes.
    const user = auth.currentUser;
    if (!user) return null;
    if (!profilePromise || force) {
      profilePromise = db
        .collection("users")
        .doc(user.uid)
        .get()
        .then((snap) => (snap.exists ? { uid: user.uid, ...snap.data() } : null));
    }
    return profilePromise;
  }

  async function requireProfile(roles) {
    const profile = await currentProfile();
    if (!profile || profile.aktif === false) throw new Error("Sesi tidak aktif.");
    if (roles && !roles.includes(profile.role)) throw new Error("Anda tidak memiliki izin untuk aksi ini.");
    return profile;
  }

  function validContactEmail(value) {
    const email = plain(value, 160).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Email kontak tidak valid.");
    return email;
  }

  function validPhone(value) {
    const phone = String(value || "")
      .replace(/\D/g, "")
      .slice(0, 18);
    if (phone && phone.length < 9) throw new Error("Nomor WhatsApp minimal 9 digit.");
    return phone;
  }

  async function login(identifier, password) {
    init();
    const credential = await auth.signInWithEmailAndPassword(usernameToEmail(identifier), String(password || ""));
    profilePromise = null;
    const profile = await currentProfile(true);
    if (!profile || profile.aktif === false || !["admin", "orangtua", "murid"].includes(profile.role)) {
      await auth.signOut();
      throw new Error("Akun belum terhubung atau sedang dinonaktifkan.");
    }
    return { user: credential.user, profile };
  }

  async function logout() {
    init();
    profilePromise = null;
    await auth.signOut();
    localStorage.removeItem("role");
    localStorage.removeItem("dataMurid");
    sessionStorage.removeItem("role");
    sessionStorage.removeItem("dataMurid");
  }

  async function updateAccountProfile(values) {
    init();
    const profile = await requireProfile(["orangtua", "murid"]);
    const nama = plain(values?.nama, 120);
    const emailKontak = validContactEmail(values?.emailKontak);
    const telepon = validPhone(values?.telepon);
    if (!nama) throw new Error("Nama akun wajib diisi.");

    await auth.currentUser.updateProfile({ displayName: nama });
    await db.collection("users").doc(profile.uid).update({
      nama,
      emailKontak,
      telepon,
      updatedAt: serverTime(),
    });
    profilePromise = null;
    return currentProfile(true);
  }

  async function changePassword(passwordLama, passwordBaru) {
    init();
    await requireProfile(["orangtua", "murid"]);
    const oldPassword = String(passwordLama || "");
    const newPassword = String(passwordBaru || "");
    if (newPassword.length < 10) throw new Error("Password baru minimal 10 karakter.");
    if (newPassword === oldPassword) throw new Error("Password baru harus berbeda dari password lama.");
    const user = auth.currentUser;
    if (!user?.email) throw new Error("Akun Authentication tidak ditemukan.");
    const credential = firebase.auth.EmailAuthProvider.credential(user.email, oldPassword);
    await user.reauthenticateWithCredential(credential);
    await user.updatePassword(newPassword);
    return true;
  }

  function readFileAsBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
      reader.onerror = () => reject(new Error("File tidak dapat dibaca."));
      reader.readAsDataURL(file);
    });
  }

  async function uploadPaymentProof(values) {
    init();

    const profile = await requireProfile(["orangtua"]);
    const endpoint = String(window.PAYMENT_UPLOAD_WEB_APP_URL || "").trim();

    if (!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint)) {
      throw new Error("Layanan upload belum diaktifkan oleh admin. Gunakan WhatsApp untuk sementara.");
    }

    const file = values?.file;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

    if (!(file instanceof File)) {
      throw new Error("Pilih file bukti pembayaran.");
    }

    if (!allowedTypes.includes(file.type)) {
      throw new Error("Format file harus JPG, PNG, WebP, atau PDF.");
    }

    if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
      throw new Error("Ukuran file maksimal 5 MB.");
    }

    const nominal = Number(values?.nominal);

    if (!Number.isInteger(nominal) || nominal < 1000 || nominal > 100000000) {
      throw new Error("Nominal pembayaran tidak valid.");
    }

    const idMurid = idValue(values?.idMurid);
    const owned = await ownedStudentIds(profile);

    if (!owned.includes(idMurid)) {
      throw new Error("Akun tidak terhubung dengan murid yang dipilih.");
    }

    const keterangan = plain(values?.keterangan, 300);

    if (!keterangan) {
      throw new Error("Keterangan pembayaran wajib diisi.");
    }

    const idToken = await auth.currentUser.getIdToken(true);
    const base64 = await readFileAsBase64(file);

    const proofCollection = db.collection("buktiPembayaran");

    const beforeUpload = await proofCollection.where("idMurid", "==", idMurid).get();

    const existingProofIds = new Set(beforeUpload.docs.map((doc) => doc.id));

    const controller = new AbortController();

    const timeout = setTimeout(() => {
      controller.abort();
    }, 60000);

    try {
      /*
       * Respons dari Apps Script dialihkan ke
       * script.googleusercontent.com.
       *
       * Beberapa browser dapat memblokir respons redirect tersebut.
       * Karena itu, website tidak membaca respons Google.
       *
       * Keberhasilan upload diperiksa melalui dokumen baru
       * yang dibuat di Firestore.
       */
      await nativeFetch(endpoint, {
        method: "POST",

        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },

        body: JSON.stringify({
          action: "uploadBuktiPembayaran",
          idToken,
          idMurid,
          nominal,
          keterangan,

          file: {
            name: file.name,
            mimeType: file.type,
            size: file.size,
            base64,
          },
        }),

        signal: controller.signal,
        mode: "no-cors",
        redirect: "follow",
      });

      /*
       * Tunggu maksimal sekitar 12 detik.
       * Upload dianggap berhasil apabila dokumen baru
       * benar-benar muncul di Firestore.
       */
      for (let attempt = 0; attempt < 12; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => {
            setTimeout(resolve, 1000);
          });
        }

        const afterUpload = await proofCollection.where("idMurid", "==", idMurid).get();

        const createdProof = afterUpload.docs.find((doc) => {
          if (existingProofIds.has(doc.id)) {
            return false;
          }

          const data = doc.data();

          return data.createdBy === profile.uid && Number(data.nominal) === nominal && data.keterangan === keterangan;
        });

        if (createdProof) {
          return {
            status: "success",

            message: "Bukti pembayaran berhasil dikirim dan menunggu konfirmasi.",

            data: {
              id: createdProof.id,

              status: createdProof.data().status || "Menunggu konfirmasi",
            },
          };
        }
      }

      throw new Error("Upload belum tercatat. Periksa folder Drive dan log Apps Script, lalu coba lagi.");
    } catch (error) {
      if (error.name === "AbortError") {
        throw new Error("Upload terlalu lama. Periksa koneksi lalu coba lagi.");
      }

      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function guard(roles) {
    try {
      const profile = await requireProfile(roles);
      return profile;
    } catch (error) {
      const next = encodeURIComponent(location.pathname.split("/").pop() || "");
      location.replace(`login.html?next=${next}`);
      throw error;
    }
  }

  async function allDocs(collectionName) {
    const snap = await db.collection(collectionName).get();
    return snap.docs.map((doc) => ({ _docId: doc.id, ...doc.data() }));
  }

  async function getParentAccounts() {
    await requireProfile(["admin"]);
    const snap = await db.collection("users").where("role", "==", "orangtua").get();
    return snap.docs
      .map((doc) => {
        const row = doc.data();
        return {
          uid: doc.id,
          nama: row.nama || "",
          username: row.username || "",
          telepon: row.telepon || "",
          emailKontak: row.emailKontak || "",
          muridIds: Array.isArray(row.muridIds) ? row.muridIds.map(String) : [],
          aktif: row.aktif !== false,
        };
      })
      .sort((a, b) => a.nama.localeCompare(b.nama, "id"));
  }

  async function usernameAvailable(username) {
    const snap = await db.collection("users").where("username", "==", username).limit(1).get();
    return snap.empty;
  }

  async function provisioningAuth() {
    const appName = "accountProvisioning";
    let app;
    try {
      app = firebase.app(appName);
    } catch {
      app = firebase.initializeApp(cfg, appName);
    }
    const secondaryAuth = app.auth();
    await secondaryAuth.setPersistence(firebase.auth.Auth.Persistence.NONE);
    if (secondaryAuth.currentUser) await secondaryAuth.signOut();
    return secondaryAuth;
  }

  async function removeProvisionedAccount(secondaryAuth, username, password) {
    try {
      const credential = await secondaryAuth.signInWithEmailAndPassword(usernameToEmail(username), password);
      await credential.user.delete();
    } catch (error) {
      console.error("Akun yang gagal diprovisi perlu diperiksa di Firebase Authentication:", username, error);
    }
  }

  async function provisionStudentAccounts(values) {
    await requireProfile(["admin"]);
    const idMurid = idValue(values?.idMurid);
    const studentUsername = usernameValue(values?.studentUsername);
    const studentPassword = String(values?.studentPassword || "");
    const parentMode = values?.parentMode === "existing" ? "existing" : "new";
    if (studentPassword.length < 10) throw new Error("Password sementara murid minimal 10 karakter.");

    const studentRef = db.collection("murid").doc(idMurid);
    const studentSnap = await studentRef.get();
    if (!studentSnap.exists || studentSnap.data().status === "Dihapus") throw new Error("Data murid tidak ditemukan.");
    if (studentSnap.data().authStatus === "aktif") throw new Error("Akun murid ini sudah terhubung.");
    if (!(await usernameAvailable(studentUsername))) throw new Error("Username murid sudah digunakan.");

    let parentUid;
    let parentName;
    let parentUsername;
    let parentPhone;
    let parentEmail;
    let parentPassword = "";
    let createParent = false;

    if (parentMode === "existing") {
      parentUid = idValue(values?.parentUid);
      const parentSnap = await db.collection("users").doc(parentUid).get();
      const parent = parentSnap.data();
      if (!parentSnap.exists || parent?.role !== "orangtua" || parent?.aktif === false) {
        throw new Error("Akun orang tua yang dipilih tidak valid atau sedang nonaktif.");
      }
      parentName = plain(parent.nama, 120);
      parentUsername = usernameValue(parent.username);
      parentPhone = validPhone(parent.telepon || studentSnap.data().wa);
      parentEmail = validContactEmail(parent.emailKontak);
    } else {
      createParent = true;
      parentName = plain(values?.parentName, 120);
      parentUsername = usernameValue(values?.parentUsername);
      parentPhone = validPhone(values?.parentPhone);
      parentEmail = validContactEmail(values?.parentEmail);
      parentPassword = String(values?.parentPassword || "");
      if (!parentName || parentPhone.length < 9) throw new Error("Nama dan WhatsApp orang tua wajib valid.");
      if (parentPassword.length < 10) throw new Error("Password sementara orang tua minimal 10 karakter.");
      if (parentPassword === studentPassword) throw new Error("Password sementara orang tua dan murid harus berbeda.");
      if (parentUsername === studentUsername) throw new Error("Username orang tua dan murid harus berbeda.");
      if (!(await usernameAvailable(parentUsername))) throw new Error("Username orang tua sudah digunakan.");
    }

    const secondaryAuth = await provisioningAuth();
    let parentCredential = null;
    let studentCredential = null;
    try {
      if (createParent) {
        parentCredential = await secondaryAuth.createUserWithEmailAndPassword(usernameToEmail(parentUsername), parentPassword);
        await parentCredential.user.updateProfile({ displayName: parentName });
        parentUid = parentCredential.user.uid;
      }

      studentCredential = await secondaryAuth.createUserWithEmailAndPassword(usernameToEmail(studentUsername), studentPassword);
      const studentName = plain(studentSnap.data().nama, 120);
      await studentCredential.user.updateProfile({ displayName: studentName });

      const batch = db.batch();
      const parentRef = db.collection("users").doc(parentUid);
      if (createParent) {
        batch.set(parentRef, {
          nama: parentName,
          username: parentUsername,
          emailKontak: parentEmail,
          telepon: parentPhone,
          role: "orangtua",
          aktif: true,
          muridIds: [idMurid],
          createdAt: serverTime(),
          updatedAt: serverTime(),
        });
      } else {
        batch.update(parentRef, {
          muridIds: firebase.firestore.FieldValue.arrayUnion(idMurid),
          updatedAt: serverTime(),
        });
      }

      batch.set(db.collection("users").doc(studentCredential.user.uid), {
        nama: studentName,
        username: studentUsername,
        emailKontak: "",
        telepon: "",
        role: "murid",
        aktif: true,
        muridIds: [idMurid],
        createdAt: serverTime(),
        updatedAt: serverTime(),
      });
      batch.update(studentRef, {
        ortu: parentName,
        wa: parentPhone || studentSnap.data().wa || "",
        username: parentUsername,
        parentUsername,
        studentUsername,
        parentUid,
        studentUid: studentCredential.user.uid,
        authStatus: "aktif",
        status: "Aktif",
        sesiTerpakai: 0,
        updatedAt: serverTime(),
      });
      await batch.commit();

      return {
        idMurid,
        studentName,
        studentUsername,
        parentName,
        parentUsername,
        parentCreated: createParent,
      };
    } catch (error) {
      if (studentCredential) await removeProvisionedAccount(secondaryAuth, studentUsername, studentPassword);
      if (parentCredential) await removeProvisionedAccount(secondaryAuth, parentUsername, parentPassword);
      throw error;
    } finally {
      if (secondaryAuth.currentUser) await secondaryAuth.signOut();
    }
  }

  async function ownedStudentIds(profile) {
    if (profile.role === "admin") return null;
    return Array.isArray(profile.muridIds) ? profile.muridIds.map(String) : profile.muridId ? [String(profile.muridId)] : [];
  }

  async function rowsForStudents(collectionName, ids) {
    if (!ids.length) return [];
    const snapshots = await Promise.all(ids.map((id) => db.collection(collectionName).where("idMurid", "==", id).get()));
    return snapshots.flatMap((snap) => snap.docs.map((doc) => ({ _docId: doc.id, ...doc.data() })));
  }

  async function jadwalForStudent(muridId) {
    const rows = (await rowsForStudents("jadwal", [muridId])).filter((row) => row.status !== "Dihapus");
    return rows.map((row) => `${row.hari}, ${row.jamMulai} - ${row.jamSelesai}`).join(" | ");
  }

  async function getMurid() {
    const profile = await requireProfile(["admin", "orangtua", "murid"]);
    const allowed = await ownedStudentIds(profile);
    const linkedAccounts = new Map();
    if (profile.role === "admin") {
      (await allDocs("users")).forEach((account) => {
        if (!["orangtua", "murid"].includes(account.role)) return;
        const ids = Array.isArray(account.muridIds) ? account.muridIds : account.muridId ? [account.muridId] : [];
        ids.forEach((studentId) => {
          const current = linkedAccounts.get(String(studentId)) || {};
          current[account.role] = { uid: account._docId, username: account.username || "" };
          linkedAccounts.set(String(studentId), current);
        });
      });
    }
    let rows;
    if (allowed === null) rows = await allDocs("murid");
    else {
      rows = (
        await Promise.all(
          allowed.map(async (id) => {
            const snap = await db.collection("murid").doc(id).get();
            return snap.exists ? { _docId: snap.id, ...snap.data() } : null;
          }),
        )
      ).filter(Boolean);
    }
    return Promise.all(
      rows
        .filter((row) => row.status !== "Dihapus")
        .map(async (row) => {
          const id = row.id || row._docId;
          const accounts = linkedAccounts.get(String(id)) || {};
          return {
            id,
            nama: row.nama || "",
            ortu: row.ortu || "",
            wa: row.wa || "",
            username: row.username || "",
            parentUsername: row.parentUsername || accounts.orangtua?.username || row.username || "",
            studentUsername: row.studentUsername || accounts.murid?.username || "",
            jenjang: row.jenjang || "",
            kelas: row.kelas || "",
            paket: row.paket || "",
            jadwal: await jadwalForStudent(row.id || row._docId),
            status: row.status || "Aktif",
            bukti: "",
            tanggalDaftar: row.tanggalDaftar || "-",
            sesiTerpakai: Number(row.sesiTerpakai) || 0,
            tanggalFreeze: row.tanggalFreeze || "-",
            foto: row.fotoUrl || "",
            durasi: String(row.durasi || "60"),
            authStatus: row.authStatus || "belum_dibuat",
          };
        }),
    );
  }

  async function scopedRows(collectionName, roleAccess) {
    const profile = await requireProfile(roleAccess);
    const ids = await ownedStudentIds(profile);
    return ids === null ? allDocs(collectionName) : rowsForStudents(collectionName, ids);
  }

  async function getAbsensi() {
    const rows = await scopedRows("absensi", ["admin", "orangtua", "murid"]);
    const students = new Map((await getMurid()).map((m) => [m.id, m]));
    return rows
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
      .map((row) => ({
        idMurid: row.idMurid,
        tanggal: row.tanggal || "-",
        nama: students.get(row.idMurid)?.nama || row.nama || row.idMurid,
        kelas: students.get(row.idMurid)?.kelas || row.kelas || "-",
        status: row.status || "-",
        materi: row.materi || "",
        catatan: row.catatan || "",
      }));
  }

  async function getKeuangan() {
    const profile = await requireProfile(["admin", "orangtua"]);
    const ids = await ownedStudentIds(profile);
    const visible = ids === null ? await allDocs("keuangan") : await rowsForStudents("keuangan", ids);
    const students = new Map((await getMurid()).map((m) => [m.id, m]));
    return visible
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
      .map((row) => ({
        idMurid: row.idMurid,
        tanggal: row.tanggal || "-",
        nama: students.get(row.idMurid)?.nama || row.idMurid,
        kelas: students.get(row.idMurid)?.kelas || "-",
        nominal: Number(row.nominal) || 0,
        keterangan: row.keterangan || "",
      }));
  }

  async function getBuktiPembayaran() {
    const profile = await requireProfile(["admin", "orangtua"]);
    let rows;
    if (profile.role === "admin") {
      rows = await allDocs("buktiPembayaran");
    } else {
      const ids = await ownedStudentIds(profile);
      const snapshots = await Promise.all(ids.map((idMurid) => db.collection("buktiPembayaran").where("idMurid", "==", idMurid).get()));
      rows = snapshots.flatMap((snap) => snap.docs.map((doc) => ({ _docId: doc.id, ...doc.data() })));
    }
    const students = new Map((await getMurid()).map((student) => [student.id, student]));
    return rows
      .sort((a, b) => String(b.createdAt?.toDate?.() || b.tanggalUpload || "").localeCompare(String(a.createdAt?.toDate?.() || a.tanggalUpload || "")))
      .map((row) => ({
        id: row._docId,
        idMurid: row.idMurid,
        nama: students.get(row.idMurid)?.nama || row.idMurid,
        kelas: students.get(row.idMurid)?.kelas || "-",
        tanggalUpload: row.tanggalUpload || "-",
        nominal: Number(row.nominal) || 0,
        keterangan: row.keterangan || "",
        status: row.status || "Menunggu konfirmasi",
        alasanPenolakan: row.alasanPenolakan || "",
        fileUrl: profile.role === "admin" && row.fileId ? `https://drive.google.com/file/d/${encodeURIComponent(row.fileId)}/view` : "",
      }));
  }

  async function getPublicSchedule() {
    const rows = await allDocs("jadwalPublik");
    return rows
      .filter((row) => row.status !== "Dihapus")
      .map((row) => ({
        id: row.id || row._docId,
        hari: row.hari,
        jamMulai: row.jamMulai,
        jamSelesai: row.jamSelesai,
        terisi: Boolean(row.terisi),
        kelas: row.terisi ? row.kelas || "belum diatur" : "",
      }));
  }

  async function getPengajuan() {
    await requireProfile(["admin"]);
    const rows = await allDocs("pengajuanJadwal");
    const students = new Map((await getMurid()).map((m) => [m.id, m]));
    return rows
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
      .map((row) => {
        const murid = students.get(row.idMurid);
        return {
          idPengajuan: row.idPengajuan || row._docId,
          idMurid: row.idMurid,
          namaTampilan: murid ? `${murid.nama} (${murid.kelas} ${murid.jenjang})` : row.idMurid,
          jadwalTampilan: row.jadwalTampilan || `${row.hari}, ${row.jamMulai} - ${row.jamSelesai}`,
          tanggal: row.tanggal || "-",
          status: row.status || "Pending",
        };
      });
  }

  function endTime(start, duration) {
    const [hours, minutes] = timeValue(start).split(":").map(Number);
    const total = hours * 60 + minutes + Number(duration);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  async function getSlots(params) {
    await requireProfile(["orangtua"]);
    const hari = plain(params.get("hari"), 10);
    const duration = Number(params.get("durasi"));
    if (!["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].includes(hari) || ![60, 90].includes(duration)) throw new Error("Pilihan jadwal tidak valid.");
    const base = hari === "Sabtu" ? 9 * 60 : 13 * 60;
    const busy = (await allDocs("jadwalPublik")).filter((row) => row.hari === hari && row.terisi && row.status !== "Dihapus");
    const result = [];
    for (let minute = base; minute + duration <= 17 * 60 + 30; minute += 30) {
      const start = `${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(minute % 60).padStart(2, "0")}`;
      const finish = endTime(start, duration);
      if (!busy.some((row) => start < row.jamSelesai && finish > row.jamMulai)) {
        result.push({ jamMulai: start, jamSelesai: finish, teks: `${start} - ${finish} (${duration} menit)` });
      }
    }
    return result;
  }

  async function getMateri(all) {
    const profile = await requireProfile(["admin", "orangtua", "murid"]);
    const ids = await ownedStudentIds(profile);
    let rows = profile.role === "admin" ? await allDocs("materi") : await rowsForStudents("materi", ids);
    const students = profile.role === "admin" ? new Map((await getMurid()).map((m) => [m.id, m.nama])) : new Map();
    return rows
      .sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))
      .map((row) => ({
        idSesi: row.idSesi || row._docId,
        idMurid: row.idMurid,
        namaMurid: students.get(row.idMurid) || row.idMurid,
        tanggal: row.tanggal || "-",
        judul: row.judul || "",
        deskripsi: row.deskripsi || "",
        linkVideo: row.linkVideo || "",
        linkQuizizz: row.linkQuizizz || "",
      }));
  }

  async function notifications() {
    const profile = await requireProfile(["admin", "orangtua", "murid"]);
    const list = [];
    if (profile.role === "admin") {
      const requests = await allDocs("pengajuanJadwal");
      const pending = requests.filter((row) => row.status === "Pending").length;
      const students = await allDocs("murid");
      const pendingStudents = students.filter((row) => row.status === "Pending").length;
      const paymentProofs = await allDocs("buktiPembayaran");
      const pendingProofs = paymentProofs.filter((row) => row.status === "Menunggu konfirmasi").length;
      if (pending) list.push({ icon: "clock-rotate-left", text: `${pending} pengajuan jadwal baru`, tab: "pengajuan" });
      if (pendingStudents) list.push({ icon: "user-plus", text: `${pendingStudents} pendaftaran baru menunggu`, tab: "manajemen" });
      if (pendingProofs) list.push({ icon: "file-shield", text: `${pendingProofs} bukti pembayaran menunggu konfirmasi`, tab: "keuangan" });
    } else {
      const ids = await ownedStudentIds(profile);
      const lessons = await rowsForStudents("materi", ids);
      if (lessons.length) {
        lessons.sort((a, b) => String(a.tanggal).localeCompare(String(b.tanggal)));
        list.push({ icon: "book", text: `Materi terbaru: ${lessons.at(-1).judul}`, tab: "ruang-belajar" });
      }
      if (profile.role === "orangtua") {
        const requests = await rowsForStudents("pengajuanJadwal", ids);
        const decided = requests.filter((row) => ["Disetujui", "Ditolak"].includes(row.status)).at(-1);
        if (decided) list.push({ icon: decided.status === "Disetujui" ? "check-circle" : "times-circle", text: `Pengajuan jadwal ${decided.status.toLowerCase()}`, tab: "" });
        const proofSnaps = await Promise.all(ids.map((idMurid) => db.collection("buktiPembayaran").where("idMurid", "==", idMurid).get()));
        const decidedProof = proofSnaps
          .flatMap((snap) => snap.docs.map((doc) => doc.data()))
          .filter((row) => ["Diterima", "Ditolak"].includes(row.status))
          .sort((a, b) => String(a.tanggalUpload || "").localeCompare(String(b.tanggalUpload || "")))
          .at(-1);
        if (decidedProof) list.push({ icon: decidedProof.status === "Diterima" ? "circle-check" : "circle-xmark", text: `Bukti pembayaran ${decidedProof.status.toLowerCase()}`, tab: "" });
      }
    }
    return list;
  }

  async function postAction(payload) {
    const action = payload.action;
    if (action === "addAbsensi") {
      await requireProfile(["admin"]);
      const idMurid = idValue(payload.idMurid);
      const status = plain(payload.status, 10);
      if (!["Hadir", "Izin", "Sakit"].includes(status)) throw new Error("Status kehadiran tidak valid.");
      const ref = db.collection("absensi").doc();
      await db.runTransaction(async (tx) => {
        const muridRef = db.collection("murid").doc(idMurid);
        const muridSnap = await tx.get(muridRef);
        if (!muridSnap.exists) throw new Error("Data murid tidak ditemukan.");
        tx.set(ref, {
          idMurid,
          tanggal: dateValue(payload.tanggal),
          status,
          materi: plain(payload.materi, 300),
          catatan: plain(payload.catatan, 1000),
          createdAt: serverTime(),
        });
        if (status === "Hadir") tx.update(muridRef, { sesiTerpakai: firebase.firestore.FieldValue.increment(1), updatedAt: serverTime() });
      });
      return OK(undefined, "Absensi berhasil disimpan.");
    }
    if (action === "addKeuangan") {
      await requireProfile(["admin"]);
      const nominal = Number(payload.nominal);
      if (!Number.isFinite(nominal) || nominal <= 0 || nominal > 100000000) throw new Error("Nominal tidak valid.");
      await db.collection("keuangan").add({
        idMurid: idValue(payload.idMurid),
        tanggal: dateValue(payload.tanggal),
        nominal,
        keterangan: plain(payload.keterangan, 500),
        createdAt: serverTime(),
      });
      return OK(undefined, "Keuangan berhasil disimpan.");
    }
    if (action === "konfirmasiBuktiPembayaran") {
      const profile = await requireProfile(["admin"]);
      const buktiId = idValue(payload.buktiId);
      const keputusan = plain(payload.keputusan, 20);
      const alasan = plain(payload.alasan, 300);
      if (!["Diterima", "Ditolak"].includes(keputusan)) throw new Error("Keputusan tidak valid.");
      if (keputusan === "Ditolak" && !alasan) throw new Error("Alasan penolakan wajib diisi.");

      const buktiRef = db.collection("buktiPembayaran").doc(buktiId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(buktiRef);
        if (!snap.exists) throw new Error("Bukti pembayaran tidak ditemukan.");
        const bukti = snap.data();
        if (bukti.status !== "Menunggu konfirmasi") throw new Error("Bukti ini sudah diproses.");

        const update = {
          status: keputusan,
          alasanPenolakan: keputusan === "Ditolak" ? alasan : "",
          diperiksaOleh: profile.uid,
          diperiksaPada: serverTime(),
        };
        if (keputusan === "Diterima") {
          const transaksiRef = db.collection("keuangan").doc();
          tx.set(transaksiRef, {
            idMurid: bukti.idMurid,
            tanggal: bukti.tanggalUpload || today(),
            nominal: Number(bukti.nominal) || 0,
            keterangan: bukti.keterangan || "Pembayaran terkonfirmasi",
            sourceBuktiId: buktiId,
            createdAt: serverTime(),
          });
          update.transaksiId = transaksiRef.id;
        }
        tx.update(buktiRef, update);
      });
      return OK(undefined, keputusan === "Diterima" ? "Bukti diterima dan transaksi berhasil dicatat." : "Bukti pembayaran ditolak.");
    }
    if (action === "registerMurid") {
      await requireProfile(["admin"]);
      const nama = plain(payload.nama, 120);
      const ortu = plain(payload.ortu, 120);
      const wa = String(payload.wa || "")
        .replace(/\D/g, "")
        .slice(0, 18);
      const jenjang = plain(payload.jenjang, 5);
      const kelas = plain(payload.kelas, 4);
      const paket = plain(payload.paket, 50);
      if (!nama || !ortu || wa.length < 9) throw new Error("Nama murid, nama orang tua, dan nomor WhatsApp wajib valid.");
      if (!["SD", "SMP", "SMA"].includes(jenjang)) throw new Error("Jenjang tidak valid.");
      if (!["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].includes(kelas)) throw new Error("Kelas tidak valid.");
      if (!["reguler_1_pertemuan", "reguler_2_pertemuan", "reguler_4_pertemuan", "reguler_8_pertemuan", "reguler_12_pertemuan"].includes(paket)) {
        throw new Error("Paket tidak valid.");
      }
      const counterRef = db.collection("system").doc("counters");
      let idMurid;
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(counterRef);
        const next = Number(snap.data()?.murid || 0) + 1;
        idMurid = `M${String(next).padStart(3, "0")}`;
        tx.set(counterRef, { murid: next }, { merge: true });
        tx.set(db.collection("murid").doc(idMurid), {
          id: idMurid,
          nama,
          ortu,
          wa,
          username: "",
          jenjang,
          kelas,
          paket,
          durasi: ["60", "90"].includes(String(payload.durasi)) ? String(payload.durasi) : "60",
          status: "Pending",
          sesiTerpakai: 0,
          tanggalDaftar: today(),
          authStatus: "belum_dibuat",
          createdAt: serverTime(),
        });
      });
      return OK({ id: idMurid }, "Data murid dibuat. Lanjutkan aktivasi melalui Manajemen Murid & Akun.");
    }
    if (action === "aktivasiMurid") {
      await requireProfile(["admin"]);
      await db.collection("murid").doc(idValue(payload.idMurid)).update({ status: "Aktif", sesiTerpakai: 0, updatedAt: serverTime() });
      return OK(undefined, "Akun murid diaktifkan dan sesi direset.");
    }
    if (action === "hapusMurid") {
      await requireProfile(["admin"]);
      await db.collection("murid").doc(idValue(payload.idMurid)).update({ status: "Dihapus", deletedAt: serverTime() });
      return OK(undefined, "Data murid dinonaktifkan secara aman. Akun Authentication dapat dihapus melalui Firebase Console.");
    }
    if (action === "editMurid") {
      const profile = await requireProfile(["admin"]);
      const idMurid = idValue(payload.idMurid);
      const update = {
        nama: plain(payload.nama, 120),
        ortu: plain(payload.ortu, 120),
        wa: String(payload.wa || "")
          .replace(/\D/g, "")
          .slice(0, 18),
        updatedAt: serverTime(),
      };
      if (payload.paket) update.paket = plain(payload.paket, 50);
      if (["60", "90"].includes(String(payload.durasi))) update.durasi = String(payload.durasi);
      await db.collection("murid").doc(idMurid).update(update);
      return OK(undefined, "Data murid berhasil diperbarui.");
    }
    if (action === "addMateri") {
      await requireProfile(["admin"]);
      await db.collection("materi").add({
        idMurid: idValue(payload.idMurid),
        tanggal: dateValue(payload.tanggal),
        judul: plain(payload.judul, 200),
        deskripsi: plain(payload.deskripsi, 1500),
        linkVideo: safeMultiUrl(payload.linkVideo, ["youtube.com", "youtu.be"]),
        linkQuizizz: safeMultiUrl(payload.linkQuizizz, ["quizizz.com", "wayground.com"]),
        createdAt: serverTime(),
      });
      return OK(undefined, "Materi berhasil diterbitkan.");
    }
    if (action === "ajukanJadwalFleksibel") return ERR("Gunakan permintaan aman.");
    if (action === "konfirmasiJadwal") {
      await requireProfile(["admin"]);
      const status = plain(payload.status, 15);
      if (!["Disetujui", "Ditolak"].includes(status)) throw new Error("Status tidak valid.");
      const ref = db.collection("pengajuanJadwal").doc(idValue(payload.idPengajuan));
      const snap = await ref.get();
      if (!snap.exists) throw new Error("Pengajuan tidak ditemukan.");
      const row = snap.data();
      const batch = db.batch();
      batch.update(ref, { status, updatedAt: serverTime() });
      if (status === "Disetujui") {
        const scheduleRef = db.collection("jadwal").doc();
        const publicRef = db.collection("jadwalPublik").doc(scheduleRef.id);
        const schedule = {
          id: scheduleRef.id,
          hari: row.hari,
          jamMulai: row.jamMulai,
          jamSelesai: row.jamSelesai,
          idMurid: row.idMurid,
          status: "Aktif",
          createdAt: serverTime(),
        };
        const student = await db.collection("murid").doc(row.idMurid).get();
        batch.set(scheduleRef, schedule);
        batch.set(publicRef, {
          id: scheduleRef.id,
          hari: row.hari,
          jamMulai: row.jamMulai,
          jamSelesai: row.jamSelesai,
          terisi: true,
          kelas: `${student.data()?.kelas || ""} ${student.data()?.jenjang || ""}`.trim(),
          status: "Aktif",
        });
      }
      await batch.commit();
      return OK(undefined, `Pengajuan jadwal ${status.toLowerCase()}.`);
    }
    if (action === "hapusSemuaPengajuan") {
      await requireProfile(["admin"]);
      const rows = await db.collection("pengajuanJadwal").get();
      for (let i = 0; i < rows.docs.length; i += 450) {
        const batch = db.batch();
        rows.docs.slice(i, i + 450).forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      return OK(undefined, "Semua pengajuan berhasil dibersihkan.");
    }
    if (action === "resetSemuaJadwal") {
      await requireProfile(["admin"]);
      const [requests, schedules, publicSchedules] = await Promise.all([db.collection("pengajuanJadwal").get(), db.collection("jadwal").get(), db.collection("jadwalPublik").get()]);
      const refs = [...requests.docs, ...schedules.docs, ...publicSchedules.docs];
      for (let i = 0; i < refs.length; i += 450) {
        const batch = db.batch();
        refs.slice(i, i + 450).forEach((doc) => batch.delete(doc.ref));
        await batch.commit();
      }
      return OK(undefined, "Semua pengajuan dan jadwal berhasil direset. Data murid tetap aman.");
    }
    if (["uploadBukti", "uploadFotoProfil"].includes(action)) {
      return ERR("Upload file dinonaktifkan karena Firebase Storage belum tersedia. Kirim bukti pembayaran melalui WhatsApp.");
    }
    if (action === "resetPin") return ERR("Password Firebase tidak disimpan di database. Reset password dilakukan melalui Firebase Authentication.");
    throw new Error("Aksi tidak dikenali.");
  }

  async function getAction(action, params) {
    if (action === "getJadwalPublik") return OK(await getPublicSchedule());
    if (action === "getMurid") return OK(await getMurid());
    if (action === "getAbsensi") return OK(await getAbsensi());
    if (action === "getKeuangan") return OK(await getKeuangan());
    if (action === "getBuktiPembayaran") return OK(await getBuktiPembayaran());
    if (action === "getPengajuanJadwal") return OK(await getPengajuan());
    if (action === "getAllMateri") return OK(await getMateri(true));
    if (action === "getRuangBelajar") return OK(await getMateri(false));
    if (action === "getNotifications") return OK(await notifications());
    if (action === "getSlotTersedia") return OK(await getSlots(params));
    if (action === "serveFotoProfil") return ERR("Foto profil menggunakan avatar bawaan.");
    if (action === "ajukanJadwalFleksibel") {
      const profile = await requireProfile(["orangtua"]);
      const allowed = await ownedStudentIds(profile);
      const idMurid = idValue(params.get("idMurid"));
      if (!allowed.includes(idMurid)) throw new Error("Tidak berhak mengajukan jadwal untuk murid ini.");
      const hari = plain(params.get("hari"), 10);
      const jamMulai = timeValue(params.get("jamMulai"));
      const durasi = Number(params.get("durasi"));
      if (!["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"].includes(hari) || ![60, 90].includes(durasi)) throw new Error("Jadwal tidak valid.");
      const jamSelesai = endTime(jamMulai, durasi);
      const occupied = (await allDocs("jadwalPublik")).some((row) => row.hari === hari && row.terisi && row.status !== "Dihapus" && jamMulai < row.jamSelesai && jamSelesai > row.jamMulai);
      if (occupied) throw new Error(`Slot ${jamMulai} - ${jamSelesai} sudah terisi.`);
      const ref = db.collection("pengajuanJadwal").doc();
      await ref.set({
        idPengajuan: ref.id,
        idMurid,
        hari,
        jamMulai,
        jamSelesai,
        durasi,
        jadwalTampilan: `${hari}, ${jamMulai} - ${jamSelesai} (${durasi} menit)`,
        tanggal: today(),
        status: "Pending",
        createdBy: profile.uid,
        createdAt: serverTime(),
      });
      return OK(undefined, "Pengajuan jadwal berhasil dikirim.");
    }
    throw new Error("Aksi tidak dikenali.");
  }

  class ApiResponse {
    constructor(data) {
      this.data = data;
      this.ok = data.status === "success";
      this.status = this.ok ? 200 : 400;
    }
    async json() {
      return this.data;
    }
    async text() {
      return JSON.stringify(this.data);
    }
  }

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async function secureFetch(input, initOptions) {
    const url = typeof input === "string" ? input : input.url;
    if (!url.startsWith(API_URL)) return nativeFetch(input, initOptions);
    try {
      init();
      if ((initOptions?.method || "GET").toUpperCase() === "POST") {
        const payload = JSON.parse(initOptions?.body || "{}");
        return new ApiResponse(await postAction(payload));
      }
      const parsed = new URL(url.replace(API_URL, "https://firebase.local"));
      return new ApiResponse(await getAction(parsed.searchParams.get("action"), parsed.searchParams));
    } catch (error) {
      console.error("Firebase API:", error);
      return new ApiResponse(ERR(error.message || "Permintaan gagal."));
    }
  };

  async function currentStudent() {
    const list = await getMurid();
    return list[0] || null;
  }

  window.firebasePortal = {
    login,
    logout,
    guard,
    currentProfile,
    getCurrentMurid: currentStudent,
    getCurrentStudents: getMurid,
    getParentAccounts,
    provisionStudentAccounts,
    updateAccountProfile,
    changePassword,
    uploadPaymentProof,
    usernameToEmail,
    isConfigured: () => !notConfigured,
  };
})();
