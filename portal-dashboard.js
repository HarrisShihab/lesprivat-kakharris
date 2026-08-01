/* global firebasePortal */
(function () {
  "use strict";

  const role = document.body.dataset.portalRole;
  const API_URL = window.FIREBASE_API_URL;
  const state = {
    profile: null,
    student: null,
    students: [],
    attendance: [],
    finance: [],
    allAttendance: [],
    allFinance: [],
    paymentProofs: [],
    allPaymentProofs: [],
    materials: [],
  };

  const $ = (id) => document.getElementById(id);
  const text = (id, value, fallback = "-") => {
    const element = $(id);
    if (element) element.textContent = value || fallback;
  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function formatMoney(value) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(Number(value) || 0);
  }

  function packageName(value) {
    if (!value) return "-";
    return String(value)
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function totalSessions(student) {
    const match = String(student?.paket || "").match(/\d+/);
    return match ? Number(match[0]) : null;
  }

  function sessionSummary(student) {
    const used = Number(student?.sesiTerpakai) || 0;
    const total = totalSessions(student);
    return total ? `${Math.max(total - used, 0)} dari ${total}` : `${used} terpakai`;
  }

  async function apiGet(action, params = {}) {
    const query = new URLSearchParams({ action, ...params });
    const response = await fetch(`${API_URL}?${query.toString()}`);
    const result = await response.json();
    if (result.status !== "success") throw new Error(result.message || "Data gagal dimuat.");
    return result.data;
  }

  function feedback(id, message = "", status = "") {
    const element = $(id);
    if (!element) return;
    element.textContent = message;
    element.className = `form-feedback ${status}`.trim();
  }

  function setButtonBusy(button, busy, label) {
    if (!button) return;
    if (busy) {
      button.dataset.original = button.innerHTML;
      button.disabled = true;
      button.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> ${label}`;
    } else {
      button.disabled = false;
      button.innerHTML = button.dataset.original || button.innerHTML;
    }
  }

  function openSidebar() {
    $("sidebar")?.classList.add("open");
    $("sidebar-overlay")?.classList.add("open");
  }

  function closeSidebar() {
    $("sidebar")?.classList.remove("open");
    $("sidebar-overlay")?.classList.remove("open");
  }

  function switchView(target) {
    document.querySelectorAll(".portal-view").forEach((view) => view.classList.add("hidden"));
    document.querySelectorAll("[data-view-target]").forEach((item) => item.classList.toggle("active", item.dataset.viewTarget === target));
    $(`view-${target}`)?.classList.remove("hidden");
    const titles = {
      beranda: role === "orangtua" ? "Beranda Administrasi" : "Beranda Belajar",
      profil: "Profil Saya",
      "ruang-belajar": "Ruang Belajar",
      pengaturan: "Pengaturan Akun",
    };
    text("page-title", titles[target]);
    closeSidebar();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function fillAccountIdentity() {
    const accountName = state.profile.nama || (role === "orangtua" ? state.student.ortu : state.student.nama) || "Pengguna";
    text("header-name", accountName);
    text("welcome-name", role === "orangtua" ? accountName : `${state.student.nama || accountName}! 👋`);
    text("account-initial", accountName.charAt(0).toUpperCase());
    if ($("setting-name")) $("setting-name").value = accountName;
    if ($("setting-username")) $("setting-username").value = state.profile.username || "";
    if ($("setting-email")) $("setting-email").value = state.profile.emailKontak || "";
    if ($("setting-phone")) $("setting-phone").value = state.profile.telepon || (role === "orangtua" ? state.student.wa || "" : "");
  }

  function fillParentDashboard() {
    const student = state.student;
    text("summary-student", student.nama);
    text("summary-status", student.status);
    text("summary-sessions", sessionSummary(student));
    text("summary-schedule", student.jadwal);
    text("schedule-duration", `${student.durasi || 60} menit`);
    text("payment-student-name", student.nama);

    text("profile-parent-name", state.profile.nama || student.ortu);
    text("profile-username", state.profile.username);
    text("profile-email", state.profile.emailKontak);
    text("profile-phone", state.profile.telepon || student.wa);

    const multiPanel = $("multi-child-panel");
    const picker = $("child-picker");
    const summaryList = $("children-summary-list");
    const hasMultipleChildren = state.students.length > 1;
    multiPanel?.classList.toggle("hidden", !hasMultipleChildren);
    if (picker && hasMultipleChildren) {
      picker.innerHTML = state.students
        .map((child) => `<option value="${escapeHtml(child.id)}"${child.id === student.id ? " selected" : ""}>${escapeHtml(child.nama)} (${escapeHtml(child.id)})</option>`)
        .join("");
    }
    if (summaryList && hasMultipleChildren) {
      summaryList.innerHTML = state.students
        .map(
          (child) => `<article class="child-summary-card${child.id === student.id ? " active" : ""}">
            <div>
              <small>${escapeHtml(child.id || "-")}</small>
              <h4>${escapeHtml(child.nama || "-")}</h4>
              <p>${escapeHtml(`${child.jenjang || ""} Kelas ${child.kelas || "-"}`.trim())}</p>
            </div>
            <div class="child-summary-meta">
              <span><i class="fa-solid fa-layer-group"></i> ${escapeHtml(sessionSummary(child))} sesi tersisa</span>
              <span><i class="fa-regular fa-clock"></i> ${escapeHtml(child.jadwal || "Jadwal belum ditentukan")}</span>
            </div>
            <button type="button" data-select-child="${escapeHtml(child.id)}">${child.id === student.id ? "Sedang dilihat" : "Lihat Detail"}</button>
          </article>`,
        )
        .join("");
      summaryList.querySelectorAll("[data-select-child]").forEach((button) => {
        button.addEventListener("click", () => selectParentStudent(button.dataset.selectChild, true));
      });
    }

    const list = $("profile-students-list");
    if (list) {
      list.innerHTML = state.students
        .map(
          (child) => `<article class="rounded-xl border border-slate-200 p-4">
            <div class="flex items-start justify-between gap-3 mb-4">
              <div><p class="font-bold text-slate-800 text-sm">${escapeHtml(child.nama || "-")}</p><p class="text-[10px] text-slate-400 mt-1">ID ${escapeHtml(child.id || "-")}</p></div>
              <span class="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold">${escapeHtml(child.status || "-")}</span>
            </div>
            <div class="profile-grid">
              <div class="profile-item"><small>Kelas</small><strong>${escapeHtml(`${child.jenjang || ""} Kelas ${child.kelas || "-"}`.trim())}</strong></div>
              <div class="profile-item"><small>Paket</small><strong>${escapeHtml(packageName(child.paket))}</strong></div>
              <div class="profile-item sm:col-span-2"><small>Jadwal Aktif</small><strong>${escapeHtml(child.jadwal || "-")}</strong></div>
            </div>
            ${state.students.length > 1 ? `<button type="button" class="small-action mt-4 bg-blue-50 text-blue-600" data-profile-child="${escapeHtml(child.id)}">Lihat administrasi anak ini</button>` : ""}
          </article>`,
        )
        .join("");
      list.querySelectorAll("[data-profile-child]").forEach((button) => {
        button.addEventListener("click", () => selectParentStudent(button.dataset.profileChild, true));
      });
    }
  }

  function selectParentStudent(studentId, openHome = false) {
    if (role !== "orangtua") return;
    const selected = state.students.find((child) => String(child.id) === String(studentId));
    if (!selected) return;
    state.student = selected;
    state.finance = state.allFinance.filter((row) => String(row.idMurid) === String(selected.id));
    state.attendance = state.allAttendance.filter((row) => String(row.idMurid) === String(selected.id));
    state.paymentProofs = state.allPaymentProofs.filter((row) => String(row.idMurid) === String(selected.id));
    localStorage.setItem("parentSelectedStudentId", selected.id);
    localStorage.setItem("dataMurid", JSON.stringify(selected));
    fillParentDashboard();
    renderFinance();
    renderAttendance();
    renderPaymentProofs();
    if ($("schedule-form")) {
      $("schedule-form").reset();
      text("schedule-duration", `${selected.durasi || 60} menit`);
      $("schedule-time").disabled = true;
      $("schedule-time").innerHTML = '<option value="">Pilih hari dahulu</option>';
      feedback("schedule-feedback");
    }
    if (openHome) switchView("beranda");
  }

  function fillStudentDashboard() {
    const student = state.student;
    text("summary-class", `${student.jenjang || ""} Kelas ${student.kelas || "-"}`.trim());
    const total = totalSessions(student);
    text("summary-used", total ? `${student.sesiTerpakai || 0} dari ${total}` : String(student.sesiTerpakai || 0));
    text("summary-schedule", student.jadwal);
    text("summary-materials", `${state.materials.length} materi`);
  }

  function renderFinance() {
    const body = $("finance-body");
    if (!body) return;
    if (!state.finance.length) {
      body.innerHTML = '<tr><td colspan="3" class="empty-cell">Belum ada riwayat pembayaran.</td></tr>';
      return;
    }
    body.innerHTML = state.finance
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.tanggal)}</td>
          <td class="font-semibold text-emerald-600">${formatMoney(row.nominal)}</td>
          <td>${escapeHtml(row.keterangan || "-")}</td>
        </tr>`,
      )
      .join("");
  }

  function statusBadge(status) {
    const color = status === "Hadir" ? "text-emerald-600 bg-emerald-50" : status === "Izin" ? "text-amber-600 bg-amber-50" : "text-slate-600 bg-slate-100";
    return `<span class="inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${color}">${escapeHtml(status)}</span>`;
  }

  function paymentStatusBadge(status) {
    const styles = {
      "Menunggu konfirmasi": "text-amber-700 bg-amber-50",
      Diterima: "text-emerald-700 bg-emerald-50",
      Ditolak: "text-red-700 bg-red-50",
    };
    return `<span class="inline-flex px-2 py-1 rounded-md text-[10px] font-bold ${styles[status] || "text-slate-600 bg-slate-100"}">${escapeHtml(status)}</span>`;
  }

  function renderPaymentProofs() {
    const body = $("payment-proof-body");
    if (!body) return;
    if (!state.paymentProofs.length) {
      body.innerHTML = '<tr><td colspan="4" class="empty-cell">Belum ada bukti yang dikirim.</td></tr>';
      return;
    }
    body.innerHTML = state.paymentProofs
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.tanggalUpload)}</td>
          <td class="font-semibold text-slate-700">${formatMoney(row.nominal)}</td>
          <td>${paymentStatusBadge(row.status)}${row.alasanPenolakan ? `<p class="text-[10px] text-red-600 mt-1">${escapeHtml(row.alasanPenolakan)}</p>` : ""}</td>
          <td>${escapeHtml(row.keterangan || "-")}</td>
        </tr>`,
      )
      .join("");
  }

  function renderAttendance() {
    const body = $("attendance-body");
    if (!body) return;
    if (!state.attendance.length) {
      body.innerHTML = '<tr><td colspan="4" class="empty-cell">Belum ada catatan belajar.</td></tr>';
      return;
    }
    body.innerHTML = state.attendance
      .map(
        (row) => `<tr>
          <td>${escapeHtml(row.tanggal)}</td>
          <td>${statusBadge(row.status)}</td>
          <td class="font-semibold text-slate-700">${escapeHtml(row.materi || "-")}</td>
          <td>${escapeHtml(row.catatan || "-")}</td>
        </tr>`,
      )
      .join("");
  }

  function youtubeId(url) {
    try {
      const parsed = new URL(url);
      if (parsed.hostname === "youtu.be") return parsed.pathname.slice(1).split("/")[0];
      if (parsed.pathname.startsWith("/shorts/") || parsed.pathname.startsWith("/embed/")) return parsed.pathname.split("/")[2];
      return parsed.searchParams.get("v");
    } catch {
      return null;
    }
  }

  function materialLinks(raw) {
    return String(raw || "")
      .split("|")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  function showMaterial(index) {
    const material = state.materials[index];
    if (!material) return;
    $("material-list-card")?.classList.add("hidden");
    $("material-detail")?.classList.remove("hidden");
    text("detail-date", material.tanggal);
    text("detail-title", material.judul);
    text("detail-description", material.deskripsi, "Tidak ada rincian pembahasan.");

    const videoList = $("video-list");
    const videos = materialLinks(material.linkVideo)
      .map(youtubeId)
      .filter((id) => /^[A-Za-z0-9_-]{11}$/.test(id || ""));
    videoList.innerHTML = videos
      .map(
        (id, number) => `<div class="video-card">
          <div class="video-frame"><iframe src="https://www.youtube.com/embed/${encodeURIComponent(id)}" title="Video pembelajaran ${number + 1}" loading="lazy" frameborder="0" allowfullscreen></iframe></div>
        </div>`,
      )
      .join("");
    $("video-section")?.classList.toggle("hidden", !videos.length);

    const quizzes = materialLinks(material.linkQuizizz).filter((url) => {
      try {
        const parsed = new URL(url);
        return parsed.protocol === "https:" && ["quizizz.com", "wayground.com"].some((host) => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
      } catch {
        return false;
      }
    });
    $("quiz-list").innerHTML = quizzes
      .map((url, number) => `<a class="quiz-link" href="${escapeHtml(url)}" target="_blank" rel="noopener"><i class="fa-solid fa-gamepad"></i> Latihan ${number + 1}</a>`)
      .join("");
    $("quiz-section")?.classList.toggle("hidden", !quizzes.length);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function renderMaterials() {
    const list = $("material-list");
    if (list) {
      if (!state.materials.length) {
        list.innerHTML = '<div class="empty-panel md:col-span-2">Belum ada materi belajar.</div>';
      } else {
        list.innerHTML = state.materials
          .map(
            (item, index) => `<button class="material-card text-left" type="button" data-material-index="${index}">
              <time>${escapeHtml(item.tanggal)}</time>
              <h4>${escapeHtml(item.judul || "Materi Belajar")}</h4>
              <p>${escapeHtml(item.deskripsi || "Buka untuk melihat materi.")}</p>
            </button>`,
          )
          .join("");
        list.querySelectorAll("[data-material-index]").forEach((button) => button.addEventListener("click", () => showMaterial(Number(button.dataset.materialIndex))));
      }
    }

    const latest = $("latest-material");
    if (latest) {
      const item = state.materials[0];
      latest.innerHTML = item
        ? `<button type="button" class="material-card w-full text-left" data-latest-material>
            <time>${escapeHtml(item.tanggal)}</time><h4>${escapeHtml(item.judul || "Materi Belajar")}</h4><p>${escapeHtml(item.deskripsi || "Buka untuk melihat materi.")}</p>
          </button>`
        : "Belum ada materi belajar.";
      latest.querySelector("[data-latest-material]")?.addEventListener("click", () => {
        switchView("ruang-belajar");
        showMaterial(0);
      });
    }
  }

  async function loadParentData() {
    [state.allFinance, state.allAttendance, state.allPaymentProofs] = await Promise.all([
      apiGet("getKeuangan"),
      apiGet("getAbsensi"),
      apiGet("getBuktiPembayaran"),
    ]);
    selectParentStudent(state.student.id);
  }

  async function submitPaymentProof(event) {
    event.preventDefault();
    const button = $("payment-submit");
    feedback("payment-feedback");
    setButtonBusy(button, true, "Mengunggah...");
    try {
      const file = $("payment-file").files[0];
      await firebasePortal.uploadPaymentProof({
        idMurid: state.student.id,
        nominal: Number($("payment-amount").value),
        keterangan: $("payment-description").value,
        file,
      });
      event.target.reset();
      feedback("payment-feedback", "Bukti berhasil dikirim dan sedang menunggu konfirmasi admin.", "success");
      state.allPaymentProofs = await apiGet("getBuktiPembayaran");
      state.paymentProofs = state.allPaymentProofs.filter((row) => String(row.idMurid) === String(state.student.id));
      renderPaymentProofs();
    } catch (error) {
      feedback("payment-feedback", error.message || "Bukti gagal diunggah.", "error");
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function loadStudentData() {
    [state.attendance, state.materials] = await Promise.all([apiGet("getAbsensi"), apiGet("getRuangBelajar")]);
    fillStudentDashboard();
    renderAttendance();
    renderMaterials();
  }

  async function loadScheduleSlots() {
    const day = $("schedule-day").value;
    const select = $("schedule-time");
    const duration = Number(state.student.durasi) || 60;
    select.disabled = true;
    select.innerHTML = '<option value="">Memuat slot...</option>';
    feedback("schedule-feedback");
    if (!day) {
      select.innerHTML = '<option value="">Pilih hari dahulu</option>';
      return;
    }
    try {
      const slots = await apiGet("getSlotTersedia", { hari: day, durasi: duration });
      select.innerHTML = slots.length
        ? `<option value="">Pilih jam</option>${slots.map((slot) => `<option value="${escapeHtml(slot.jamMulai)}">${escapeHtml(slot.teks)}</option>`).join("")}`
        : '<option value="">Tidak ada slot tersedia</option>';
      select.disabled = !slots.length;
    } catch (error) {
      select.innerHTML = '<option value="">Gagal memuat slot</option>';
      feedback("schedule-feedback", error.message, "error");
    }
  }

  async function submitSchedule(event) {
    event.preventDefault();
    const button = $("schedule-submit");
    feedback("schedule-feedback");
    setButtonBusy(button, true, "Mengirim...");
    try {
      await apiGet("ajukanJadwalFleksibel", {
        idMurid: state.student.id,
        hari: $("schedule-day").value,
        jamMulai: $("schedule-time").value,
        durasi: Number(state.student.durasi) || 60,
      });
      feedback("schedule-feedback", "Pengajuan jadwal berhasil dikirim.", "success");
      event.target.reset();
      $("schedule-duration").value = `${state.student.durasi || 60} menit`;
      $("schedule-time").disabled = true;
      $("schedule-time").innerHTML = '<option value="">Pilih hari dahulu</option>';
    } catch (error) {
      feedback("schedule-feedback", error.message, "error");
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function submitAccount(event) {
    event.preventDefault();
    const button = event.submitter;
    feedback("account-feedback");
    setButtonBusy(button, true, "Menyimpan...");
    try {
      state.profile = await firebasePortal.updateAccountProfile({
        nama: $("setting-name").value,
        emailKontak: $("setting-email").value,
        telepon: $("setting-phone").value,
      });
      fillAccountIdentity();
      if (role === "orangtua") fillParentDashboard();
      feedback("account-feedback", "Informasi akun berhasil diperbarui.", "success");
    } catch (error) {
      feedback("account-feedback", error.message, "error");
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function submitPassword(event) {
    event.preventDefault();
    const button = event.submitter;
    const current = $("current-password").value;
    const next = $("new-password").value;
    const confirmation = $("confirm-password").value;
    feedback("password-feedback");
    if (next !== confirmation) {
      feedback("password-feedback", "Konfirmasi password baru tidak sama.", "error");
      return;
    }
    setButtonBusy(button, true, "Memperbarui...");
    try {
      await firebasePortal.changePassword(current, next);
      event.target.reset();
      feedback("password-feedback", "Password berhasil diubah. Gunakan password baru saat login berikutnya.", "success");
    } catch (error) {
      const message = /wrong-password|invalid-credential/i.test(error.code || error.message) ? "Password saat ini salah." : error.message;
      feedback("password-feedback", message, "error");
    } finally {
      setButtonBusy(button, false);
    }
  }

  async function logout() {
    await firebasePortal.logout();
    location.replace("login.html");
  }

  function bindEvents() {
    document.querySelectorAll("[data-view-target]").forEach((button) => button.addEventListener("click", () => switchView(button.dataset.viewTarget)));
    document.querySelectorAll("[data-sidebar-open]").forEach((button) => button.addEventListener("click", openSidebar));
    document.querySelectorAll("[data-sidebar-close]").forEach((button) => button.addEventListener("click", closeSidebar));
    document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", logout));
    $("account-form")?.addEventListener("submit", submitAccount);
    $("password-form")?.addEventListener("submit", submitPassword);
    $("schedule-day")?.addEventListener("change", loadScheduleSlots);
    $("schedule-form")?.addEventListener("submit", submitSchedule);
    $("payment-proof-form")?.addEventListener("submit", submitPaymentProof);
    $("child-picker")?.addEventListener("change", (event) => selectParentStudent(event.target.value));
    $("material-back")?.addEventListener("click", () => {
      $("material-detail")?.classList.add("hidden");
      $("material-list-card")?.classList.remove("hidden");
    });
  }

  async function init() {
    bindEvents();
    try {
      state.profile = await firebasePortal.guard([role]);
      state.students = await firebasePortal.getCurrentStudents();
      const storedStudentId = role === "orangtua" ? localStorage.getItem("parentSelectedStudentId") : "";
      state.student = state.students.find((student) => student.id === storedStudentId) || state.students[0] || null;
      if (!state.student) throw new Error("Akun belum terhubung ke data murid.");
      localStorage.setItem("role", role);
      localStorage.setItem("dataMurid", JSON.stringify(state.student));
      fillAccountIdentity();
      if (role === "orangtua") await loadParentData();
      else await loadStudentData();
      $("page-loader")?.classList.add("hidden");
      $("portal-app")?.classList.remove("hidden");
    } catch (error) {
      console.error("Portal:", error);
      if ($("page-loader")) {
        $("page-loader").innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i><span>${escapeHtml(error.message || "Portal gagal dimuat.")}</span>`;
      }
    }
  }

  init();
})();
