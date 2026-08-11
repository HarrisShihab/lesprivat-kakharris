(function () {
  "use strict";

  // Preserve the audited implementation and load it synchronously so existing
  // pages keep the same initialization order.
  document.write('<script src="firebase-api-legacy.js"><\/script>');

  const nativeFetch = window.fetch.bind(window);
  const API_URL = "firebase://secure-api";
  const PENDING_HOLD_MS = 24 * 60 * 60 * 1000;
  const SCHEDULE_DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const SLOT_INTERVAL_MINUTES = 15;
  const SCHEDULE_GAP_MINUTES = 15;
  const SCHEDULE_CLOSE_MINUTES = 17 * 60 + 30;

  const ok = (data, message) => ({ status: "success", ...(message ? { message } : {}), ...(data === undefined ? {} : { data }) });
  const response = (data) => ({
    ok: data.status === "success",
    status: data.status === "success" ? 200 : 400,
    async json() { return data; },
    async text() { return JSON.stringify(data); },
  });

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

  function localToday() {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Jakarta",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const get = (type) => parts.find((part) => part.type === type)?.value || "";
    return `${get("year")}-${get("month")}-${get("day")}`;
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

  function timeToMinutes(value) {
    const [hours, minutes] = timeValue(value).split(":").map(Number);
    return hours * 60 + minutes;
  }

  function endTime(start, duration) {
    const total = timeToMinutes(start) + Number(duration);
    return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
  }

  function scheduleTokenMinutes(start, finish) {
    const tokens = [];
    for (let minute = start; minute < finish + SCHEDULE_GAP_MINUTES; minute += SLOT_INTERVAL_MINUTES) tokens.push(minute);
    return tokens;
  }

  function scheduleTokenId(hari, minute) {
    return `${hari.toLowerCase()}_${String(Math.floor(minute / 60)).padStart(2, "0")}${String(minute % 60).padStart(2, "0")}`;
  }

  function pendingIsActive(row, now = Date.now()) {
    if (row?.status !== "Pending") return false;
    const expiresAt = row.expiresAt?.toMillis?.() ?? row.expiresAt?.toDate?.()?.getTime?.() ?? Date.parse(row.expiresAt || "");
    if (Number.isFinite(expiresAt) && expiresAt) return expiresAt > now;
    const createdAt = row.createdAt?.toMillis?.() ?? row.createdAt?.toDate?.()?.getTime?.() ?? Date.parse(row.createdAt || "");
    if (Number.isFinite(createdAt) && createdAt) return createdAt + PENDING_HOLD_MS > now;
    return row.tanggal === localToday();
  }

  function conflicts(start, finish, row) {
    const otherStart = timeToMinutes(row.jamMulai);
    const otherFinish = timeToMinutes(row.jamSelesai);
    return start < otherFinish + SCHEDULE_GAP_MINUTES && finish + SCHEDULE_GAP_MINUTES > otherStart;
  }

  function validateSelection(hari, jamMulai, duration) {
    if (!SCHEDULE_DAYS.includes(hari) || ![60, 90].includes(duration)) throw new Error("Jadwal tidak valid.");
    const start = timeToMinutes(jamMulai);
    const opening = hari === "Sabtu" ? 9 * 60 : 13 * 60;
    if (start % SLOT_INTERVAL_MINUTES !== 0) throw new Error("Jam mulai harus dalam kelipatan 15 menit.");
    if (start < opening || start + duration > SCHEDULE_CLOSE_MINUTES) {
      throw new Error(`Jadwal ${hari} harus berada di antara ${hari === "Sabtu" ? "09.00" : "13.00"} dan 17.30.`);
    }
    return { start, finish: start + duration };
  }

  function scheduleQuotaForPackage(packageValue) {
    const sessions = Number(String(packageValue || "").match(/(?:^|_)(\d+)(?:_|$)/)?.[1] || 0);
    if (sessions >= 12) return 3;
    if (sessions >= 8) return 2;
    return 1;
  }

  async function requireAdmin() {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("Sesi tidak aktif.");
    const snap = await firebase.firestore().collection("users").doc(user.uid).get();
    const profile = snap.exists ? snap.data() : null;
    if (!profile || profile.aktif === false || profile.role !== "admin") throw new Error("Anda tidak memiliki izin untuk aksi ini.");
    return { user, profile };
  }

  async function requireParent(idMurid) {
    const user = firebase.auth().currentUser;
    if (!user) throw new Error("Sesi tidak aktif.");
    const snap = await firebase.firestore().collection("users").doc(user.uid).get();
    const profile = snap.exists ? snap.data() : null;
    if (!profile || profile.aktif === false || profile.role !== "orangtua") throw new Error("Anda tidak memiliki izin untuk aksi ini.");
    const ids = Array.isArray(profile.muridIds) ? profile.muridIds.map(String) : [];
    if (!ids.includes(String(idMurid))) throw new Error("Tidak berhak mengakses murid ini.");
    return { user, profile };
  }

  async function addAbsensiAtomic(payload) {
    const { user } = await requireAdmin();
    const idMurid = idValue(payload.idMurid);
    const tanggal = dateValue(payload.tanggal);
    const status = plain(payload.status, 10);
    if (!["Hadir", "Izin", "Sakit"].includes(status)) throw new Error("Status kehadiran tidak valid.");
    const db = firebase.firestore();
    const studentRef = db.collection("murid").doc(idMurid);
    const attendanceRef = db.collection("absensi").doc(`abs_${idMurid}_${tanggal}`);
    const existing = await db.collection("absensi").where("idMurid", "==", idMurid).where("tanggal", "==", tanggal).limit(1).get();
    if (!existing.empty || (await attendanceRef.get()).exists) {
      throw new Error("Absensi untuk murid dan tanggal tersebut sudah tercatat. Tidak ada sesi yang ditambahkan lagi.");
    }
    await db.runTransaction(async (tx) => {
      const studentSnap = await tx.get(studentRef);
      const attendanceSnap = await tx.get(attendanceRef);
      if (!studentSnap.exists) throw new Error("Data murid tidak ditemukan.");
      if (attendanceSnap.exists) throw new Error("Absensi untuk murid dan tanggal tersebut sudah tercatat.");
      tx.set(attendanceRef, {
        idMurid,
        tanggal,
        status,
        materi: plain(payload.materi, 300),
        catatan: plain(payload.catatan, 1000),
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: user.uid,
      });
      if (status === "Hadir") {
        tx.update(studentRef, {
          sesiTerpakai: firebase.firestore.FieldValue.increment(1),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }
    });
    return response(ok(undefined, "Absensi berhasil disimpan."));
  }

  async function registerMuridAtomic(payload) {
    await requireAdmin();
    const nama = plain(payload.nama, 120);
    const ortu = plain(payload.ortu, 120);
    const wa = String(payload.wa || "").replace(/\D/g, "").slice(0, 18);
    const jenjang = plain(payload.jenjang, 5);
    const kelas = plain(payload.kelas, 4);
    const paket = plain(payload.paket, 50);
    if (!nama || !ortu || wa.length < 9) throw new Error("Nama murid, nama orang tua, dan nomor WhatsApp wajib valid.");
    if (!["SD", "SMP", "SMA"].includes(jenjang)) throw new Error("Jenjang tidak valid.");
    if (!["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"].includes(kelas)) throw new Error("Kelas tidak valid.");
    if (!["reguler_1_pertemuan", "reguler_2_pertemuan", "reguler_4_pertemuan", "reguler_8_pertemuan", "reguler_12_pertemuan"].includes(paket)) throw new Error("Paket tidak valid.");
    const db = firebase.firestore();
    const counterRef = db.collection("system").doc("counters");
    let idMurid = "";
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
        tanggalDaftar: localToday(),
        authStatus: "belum_dibuat",
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });
    return response(ok({ id: idMurid }, "Data murid dibuat. Lanjutkan aktivasi melalui Manajemen Murid & Akun."));
  }

  async function submitSchedulesAtomic(params) {
    const idMurid = idValue(params.get("idMurid"));
    const { user } = await requireParent(idMurid);
    const durasi = Number(params.get("durasi"));
    if (![60, 90].includes(durasi)) throw new Error("Durasi jadwal tidak valid.");
    let submittedSchedules;
    try { submittedSchedules = JSON.parse(params.get("jadwal") || "[]"); }
    catch { throw new Error("Daftar jadwal tidak valid."); }
    if (!Array.isArray(submittedSchedules) || !submittedSchedules.length || submittedSchedules.length > 3) throw new Error("Pengajuan harus berisi 1 sampai 3 jadwal.");

    const selections = submittedSchedules.map((row) => {
      const hari = plain(row?.hari, 10);
      const jamMulai = timeValue(row?.jamMulai);
      const { start, finish } = validateSelection(hari, jamMulai, durasi);
      return { hari, jamMulai, jamSelesai: endTime(jamMulai, durasi), start, finish };
    });
    if (new Set(selections.map((row) => row.hari)).size !== selections.length) throw new Error("Setiap jadwal dalam satu pengiriman harus berada pada hari yang berbeda.");

    const db = firebase.firestore();
    const [studentSnap, publicSnap, requestSnap, scheduleSnap] = await Promise.all([
      db.collection("murid").doc(idMurid).get(),
      db.collection("jadwalPublik").get(),
      db.collection("pengajuanJadwal").where("idMurid", "==", idMurid).get(),
      db.collection("jadwal").where("idMurid", "==", idMurid).get(),
    ]);
    if (!studentSnap.exists || ["Dihapus", "Nonaktif"].includes(studentSnap.data()?.status)) throw new Error("Murid tidak ditemukan atau sedang nonaktif.");
    const student = studentSnap.data();
    if (String(student.durasi || "60") !== String(durasi)) throw new Error("Durasi harus mengikuti paket aktif murid.");

    const activeSchedules = scheduleSnap.docs.map((d) => d.data()).filter((row) => row.status !== "Dihapus");
    const pendingRequests = requestSnap.docs.map((d) => d.data()).filter((row) => pendingIsActive(row));
    const maximumSchedules = scheduleQuotaForPackage(student.paket);
    const usedSchedules = activeSchedules.length + pendingRequests.length;
    if (usedSchedules + selections.length > maximumSchedules) throw new Error(`Sisa kuota hanya ${Math.max(maximumSchedules - usedSchedules, 0)} jadwal.`);
    const usedDays = new Set([...activeSchedules, ...pendingRequests].map((row) => row.hari));
    if (selections.some((row) => usedDays.has(row.hari))) throw new Error("Jadwal tambahan harus berada pada hari yang berbeda.");

    const publicRows = publicSnap.docs.map((d) => d.data());
    const publicConflict = selections.find((selection) => publicRows.some((row) => row.hari === selection.hari && row.terisi && row.status !== "Dihapus" && conflicts(selection.start, selection.finish, row)));
    if (publicConflict) throw new Error(`Slot ${publicConflict.hari}, ${publicConflict.jamMulai} - ${publicConflict.jamSelesai} sudah terisi atau terkena jeda 15 menit.`);

    const occupiedQuotaSlots = new Set([...activeSchedules, ...pendingRequests].map((row) => Number(row.quotaSlot)).filter((slot) => Number.isInteger(slot) && slot >= 1 && slot <= maximumSchedules));
    const rowsWithoutSlot = usedSchedules - occupiedQuotaSlots.size;
    for (let i = 0; i < rowsWithoutSlot; i += 1) {
      const reserved = Array.from({ length: maximumSchedules }, (_, index) => index + 1).find((slot) => !occupiedQuotaSlots.has(slot));
      if (reserved) occupiedQuotaSlots.add(reserved);
    }

    const expiresAt = firebase.firestore.Timestamp.fromMillis(Date.now() + PENDING_HOLD_MS);
    const entries = selections.map((selection) => {
      const quotaSlot = Array.from({ length: maximumSchedules }, (_, index) => index + 1).find((slot) => !occupiedQuotaSlots.has(slot));
      if (!quotaSlot) throw new Error("Kuota jadwal sedang digunakan. Muat ulang halaman lalu coba lagi.");
      occupiedQuotaSlots.add(quotaSlot);
      const requestRef = db.collection("pengajuanJadwal").doc();
      const quotaRef = db.collection("kuotaJadwal").doc(`${user.uid}_${idMurid}_${quotaSlot}`);
      const tokenRefs = scheduleTokenMinutes(selection.start, selection.finish).map((minute) => ({ minute, ref: db.collection("slotJadwal").doc(scheduleTokenId(selection.hari, minute)) }));
      return { ...selection, requestRef, quotaRef, quotaSlot, tokenRefs };
    });

    await db.runTransaction(async (tx) => {
      const reads = [];
      for (const entry of entries) {
        reads.push(tx.get(entry.quotaRef));
        for (const token of entry.tokenRefs) reads.push(tx.get(token.ref));
      }
      const snapshots = await Promise.all(reads);
      let cursor = 0;
      for (const entry of entries) {
        const quotaSnap = snapshots[cursor++];
        if (quotaSnap.exists && (quotaSnap.data().status === "Aktif" || pendingIsActive(quotaSnap.data()))) throw new Error("Kuota jadwal baru saja dipakai pengajuan lain. Muat ulang halaman.");
        for (const token of entry.tokenRefs) {
          const tokenSnap = snapshots[cursor++];
          if (tokenSnap.exists && (tokenSnap.data().status === "Aktif" || pendingIsActive(tokenSnap.data()))) throw new Error("Salah satu slot baru saja diajukan orang tua lain. Tidak ada jadwal yang disimpan. Silakan pilih jam lain.");
        }
      }

      for (const entry of entries) {
        const { requestRef, quotaRef, quotaSlot, tokenRefs, hari, jamMulai, jamSelesai } = entry;
        tx.set(requestRef, {
          idPengajuan: requestRef.id,
          idMurid,
          hari,
          jamMulai,
          jamSelesai,
          durasi,
          jadwalTampilan: `${hari}, ${jamMulai} - ${jamSelesai} (${durasi} menit)`,
          tanggal: localToday(),
          status: "Pending",
          createdBy: user.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          expiresAt,
          quotaSlot,
          quotaSlotKey: String(quotaSlot),
          quotaId: quotaRef.id,
        });
        tx.set(quotaRef, { idMurid, slot: quotaSlot, slotKey: String(quotaSlot), requestId: requestRef.id, status: "Pending", expiresAt, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        tokenRefs.forEach(({ minute, ref }) => {
          tx.set(ref, { hari, menit: minute, requestId: requestRef.id, status: "Pending", expiresAt, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
        });
      }
    });

    return response(ok(undefined, `${entries.length} pengajuan jadwal berhasil dikirim dan slot ditahan selama 24 jam.`));
  }

  window.fetch = async function auditedFetch(input, initOptions) {
    const url = typeof input === "string" ? input : input?.url;
    if (!url?.startsWith(API_URL)) return nativeFetch(input, initOptions);
    const method = (initOptions?.method || "GET").toUpperCase();
    let payload = null;
    let query = null;
    if (method === "POST") {
      try { payload = JSON.parse(initOptions?.body || "{}"); }
      catch { return nativeFetch(input, initOptions); }
    } else {
      query = new URL(url.replace(API_URL, "https://firebase.local"));
      if (query.searchParams.get("action") !== "ajukanJadwalFleksibel") return nativeFetch(input, initOptions);
    }
    try {
      if (method === "POST" && payload.action === "addAbsensi") return addAbsensiAtomic(payload);
      if (method === "POST" && payload.action === "registerMurid") return registerMuridAtomic(payload);
      if (query?.searchParams.get("action") === "ajukanJadwalFleksibel") return submitSchedulesAtomic(query.searchParams);
      return nativeFetch(input, initOptions);
    } catch (error) {
      return response({ status: "error", message: error.message || "Permintaan gagal." });
    }
  };
})();
