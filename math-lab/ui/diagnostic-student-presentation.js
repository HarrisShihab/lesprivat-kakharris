(function (root) {
  "use strict";

  if (typeof document === "undefined" || document.body?.dataset?.portalRole !== "murid") return;

  const INDICATOR_LABELS = Object.freeze({
    concept: "Konsep",
    problem_solving: "Pemecahan masalah",
    procedure: "Prosedur",
    representation: "Representasi",
    communication: "Komunikasi matematis",
  });

  const LEVEL_LABELS = Object.freeze({
    insufficient: "Perlu penguatan",
    developing: "Sedang berkembang",
    mastered: "Sudah dikuasai",
  });

  const ACTION_LABELS = Object.freeze({
    review_indicator: "Perlu mengulang dan memperkuat indikator ini sebelum lanjut.",
    practice_indicator: "Perbanyak latihan pada indikator ini agar pemahaman semakin kuat.",
    maintain_indicator: "Pertahankan kemampuan ini dengan latihan berkala.",
  });

  const REASON_LABELS = Object.freeze({
    insufficient: "Hasil menunjukkan indikator ini masih perlu diperkuat.",
    developing: "Hasil menunjukkan pemahaman mulai terbentuk dan masih membutuhkan latihan tambahan.",
    mastered: "Hasil menunjukkan indikator ini sudah dikuasai dan perlu dipertahankan.",
  });

  let historyLoadPromise = null;

  function indicatorLabel(id) {
    return INDICATOR_LABELS[id] || String(id || "Indikator").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function levelLabel(level) {
    return LEVEL_LABELS[String(level || "").toLowerCase()] || String(level || "");
  }

  function recommendationText(recommendation) {
    if (!recommendation) return "";
    const action = ACTION_LABELS[recommendation.action];
    if (action) return action;
    const reason = REASON_LABELS[recommendation.level];
    return reason || recommendation.reason || "Lanjutkan latihan pada indikator ini.";
  }

  function hideTrustMetadataFromUi() {
    document.querySelectorAll(".math-lab-trust").forEach((element) => {
      if (/client-untrusted/i.test(element.textContent || "")) element.remove();
    });

    document.querySelectorAll("body *").forEach((element) => {
      if (element.children.length === 0 && /client-untrusted/i.test(element.textContent || "")) element.remove();
    });
  }

  function presentDiagnosticResult() {
    const result = document.getElementById("math-lab-diagnostic-result");
    if (!result || result.classList.contains("math-lab-hidden")) return;

    result.querySelectorAll("p, li, strong, div").forEach((element) => {
      const raw = (element.textContent || "").trim();
      if (!raw) return;
      if (INDICATOR_LABELS[raw]) element.textContent = indicatorLabel(raw);
      else if (LEVEL_LABELS[raw.toLowerCase()]) element.textContent = levelLabel(raw);
    });

    result.querySelectorAll("li").forEach((item) => {
      const raw = item.textContent || "";
      const actionMatch = raw.match(/\b(review_indicator|practice_indicator|maintain_indicator)\b/);
      if (!actionMatch) return;
      const indicatorMatch = raw.match(/^(.*?)\s+—\s+/);
      const indicator = indicatorMatch ? indicatorMatch[1].trim() : "Indikator";
      const recommendation = {
        indicatorId: Object.prototype.hasOwnProperty.call(INDICATOR_LABELS, indicator) ? indicator : indicator.toLowerCase().replace(/\s+/g, "_"),
        action: actionMatch[1],
      };
      item.textContent = `${indicatorLabel(recommendation.indicatorId)} — ${recommendationText(recommendation)}`;
    });

    hideTrustMetadataFromUi();
  }

  function escapeHtml(value) {
    return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
  }

  function formatDate(value) {
    if (!value) return "-";
    let date;
    if (typeof value.toDate === "function") date = value.toDate();
    else if (typeof value.toMillis === "function") date = new Date(value.toMillis());
    else date = new Date(value);
    return Number.isNaN(date.getTime()) ? "-" : new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function ensureFirebaseApp() {
    const fb = root.firebase;
    if (!fb || typeof fb.auth !== "function" || typeof fb.firestore !== "function") {
      throw new Error("Firebase SDK belum tersedia.");
    }

    if (Array.isArray(fb.apps) && fb.apps.length === 0) {
      const config = root.FIREBASE_CONFIG;
      if (!config || !config.apiKey || !config.appId || !config.projectId) {
        throw new Error("Firebase belum dikonfigurasi.");
      }
      fb.initializeApp(config);
    }

    return fb;
  }

  function waitForAuth(timeoutMs = 10000) {
    const fb = ensureFirebaseApp();
    const auth = fb.auth();
    if (auth.currentUser?.uid) return Promise.resolve(auth.currentUser);

    return new Promise((resolve, reject) => {
      let settled = false;
      let timer = null;
      let unsubscribe = null;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        if (timer) clearTimeout(timer);
        try { unsubscribe?.(); } catch {}
        callback(value);
      };
      unsubscribe = auth.onAuthStateChanged((user) => {
        if (user?.uid) finish(resolve, user);
      });
      timer = setTimeout(() => finish(reject, new Error("Sesi login belum siap.")), timeoutMs);
    });
  }

  async function firebaseContext() {
    const fb = ensureFirebaseApp();
    const user = await waitForAuth();
    return { user, db: fb.firestore() };
  }

  function renderHistoryItem(item) {
    const topic = item.topicId === "aljabar" ? "Aljabar" : String(item.topicId || "Materi").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const score = item.score ?? item.diagnosticSummary?.score ?? 0;
    return `<article class="math-lab-history-item"><div><strong>${escapeHtml(topic)}</strong><div class="math-lab-muted">${escapeHtml(formatDate(item.createdAt))} · ${escapeHtml(item.totalQuestions || 0)} soal · Diagnostic</div></div><div><div class="math-lab-score">${escapeHtml(score)}/100</div></div></article>`;
  }

  async function loadDiagnosticHistory(target) {
    const container = target || document.getElementById("math-lab-diagnostic-history-list");
    if (!container) return;
    if (historyLoadPromise) return historyLoadPromise;

    historyLoadPromise = (async () => {
      container.innerHTML = '<div class="math-lab-status">Memuat riwayat diagnostic...</div>';
      try {
        const { user, db } = await firebaseContext();
        const snap = await db.collection("mathDiagnosticResults").where("ownerUid", "==", user.uid).limit(5).get();
        const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        const toMillis = (value) => {
          const millis = value?.toMillis?.() ?? value?.toDate?.()?.getTime?.();
          if (Number.isFinite(millis)) return millis;
          const parsed = Date.parse(value || "");
          return Number.isFinite(parsed) ? parsed : 0;
        };
        rows.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));

        if (!rows.length) {
          container.innerHTML = '<div class="math-lab-status empty">Belum ada riwayat diagnostic.</div>';
          return;
        }
        container.innerHTML = rows.map(renderHistoryItem).join("");
      } catch (error) {
        const message = String(error?.message || error || "Gagal memuat riwayat diagnostic.");
        if (/permission|insufficient/i.test(message)) {
          container.innerHTML = '<div class="math-lab-status error">Riwayat diagnostic belum dapat dimuat karena izin akses.</div>';
        } else if (/login belum siap|SDK belum tersedia|Firebase belum/i.test(message)) {
          container.innerHTML = '<div class="math-lab-status info">Menunggu sesi login dan Firestore siap. Tekan Muat ulang setelah portal selesai dimuat.</div>';
        } else {
          container.innerHTML = `<div class="math-lab-status error">Riwayat diagnostic belum dapat dimuat. ${escapeHtml(message)}</div>`;
        }
      } finally {
        historyLoadPromise = null;
      }
    })();

    return historyLoadPromise;
  }

  function ensureHistorySections() {
    const practiceList = document.getElementById("math-lab-history-list");
    if (!practiceList) return;
    const practiceSection = practiceList.closest("section");
    if (!practiceSection || document.getElementById("math-lab-diagnostic-history")) return;

    const heading = practiceSection.querySelector("h3");
    const description = practiceSection.querySelector("p");
    if (heading) heading.textContent = "Riwayat Practice";
    if (description) description.textContent = "5 hasil Practice terbaru milik akun ini.";

    const diagnosticSection = document.createElement("section");
    diagnosticSection.id = "math-lab-diagnostic-history";
    diagnosticSection.className = "math-lab-card";
    diagnosticSection.innerHTML = '<div class="section-title"><div><h3>Riwayat Diagnostic</h3><p>5 hasil Diagnostic terbaru milik akun ini.</p></div><button id="math-lab-refresh-diagnostic-history" class="small-action bg-slate-100 text-slate-700" type="button"><i class="fa-solid fa-rotate"></i> Muat ulang</button></div><div id="math-lab-diagnostic-history-list" class="math-lab-history mt-4"><div class="math-lab-status">Menunggu sesi login...</div></div>';
    practiceSection.parentElement?.insertBefore(diagnosticSection, practiceSection.nextSibling);
    document.getElementById("math-lab-refresh-diagnostic-history")?.addEventListener("click", () => loadDiagnosticHistory());
  }

  async function refreshHistoryWhenReady() {
    ensureHistorySections();
    try {
      await waitForAuth();
      await loadDiagnosticHistory();
    } catch {
      const container = document.getElementById("math-lab-diagnostic-history-list");
      if (container) container.innerHTML = '<div class="math-lab-status info">Sesi login belum siap. Muat ulang setelah portal selesai dimuat.</div>';
    }
  }

  function refreshPresentation() {
    ensureHistorySections();
    presentDiagnosticResult();
    hideTrustMetadataFromUi();
  }

  refreshPresentation();
  void refreshHistoryWhenReady();

  const observer = new MutationObserver(() => {
    refreshPresentation();
  });
  observer.observe(document.body, { childList: true, subtree: true });

  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnosticStudentPresentation = Object.freeze({
    indicatorLabel,
    levelLabel,
    recommendationText,
    loadDiagnosticHistory,
    refresh: refreshPresentation,
    INDICATOR_LABELS,
    LEVEL_LABELS,
    ACTION_LABELS,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
