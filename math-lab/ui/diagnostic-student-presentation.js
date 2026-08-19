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

  function firebaseContext() {
    const fb = root.firebase;
    const user = fb?.auth?.().currentUser;
    const db = fb?.firestore?.();
    if (!fb || !user?.uid || !db) throw new Error("Sesi login atau Firestore belum siap.");
    return { user, db };
  }

  function renderHistoryItem(item, type) {
    const topic = item.topicId === "aljabar" ? "Aljabar" : String(item.topicId || "Materi").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const label = type === "diagnostic" ? "Diagnostic" : "Practice";
    return `<article class="math-lab-history-item"><div><strong>${escapeHtml(topic)}</strong><div class="math-lab-muted">${escapeHtml(formatDate(item.createdAt))} · ${escapeHtml(item.totalQuestions || 0)} soal · ${label}</div></div><div><div class="math-lab-score">${escapeHtml(item.score ?? 0)}/100</div></div></article>`;
  }

  async function loadDiagnosticHistory(target) {
    const container = target || document.getElementById("math-lab-diagnostic-history-list");
    if (!container) return;
    container.innerHTML = '<div class="math-lab-status">Memuat riwayat diagnostic...</div>';
    try {
      const { user, db } = firebaseContext();
      const snap = await db.collection("mathDiagnosticResults").where("ownerUid", "==", user.uid).orderBy("createdAt", "desc").limit(5).get();
      if (!snap.docs.length) {
        container.innerHTML = '<div class="math-lab-status empty">Belum ada riwayat diagnostic.</div>';
        return;
      }
      container.innerHTML = snap.docs.map((doc) => renderHistoryItem({ id: doc.id, ...doc.data() }, "diagnostic")).join("");
    } catch (error) {
      const message = String(error?.message || error || "Gagal memuat riwayat diagnostic.");
      if (/requires an index|FAILED_PRECONDITION|create_composite/i.test(message)) {
        container.innerHTML = '<div class="math-lab-status info">Riwayat diagnostic sedang menyiapkan index Firestore. Coba muat ulang setelah index selesai dibuat.</div>';
      } else if (/permission|insufficient/i.test(message)) {
        container.innerHTML = '<div class="math-lab-status error">Riwayat diagnostic belum dapat dimuat karena izin akses.</div>';
      } else {
        container.innerHTML = `<div class="math-lab-status error">Riwayat diagnostic belum dapat dimuat. ${escapeHtml(message)}</div>`;
      }
    }
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
    diagnosticSection.innerHTML = '<div class="section-title"><div><h3>Riwayat Diagnostic</h3><p>5 hasil Diagnostic terbaru milik akun ini.</p></div><button id="math-lab-refresh-diagnostic-history" class="small-action bg-slate-100 text-slate-700" type="button"><i class="fa-solid fa-rotate"></i> Muat ulang</button></div><div id="math-lab-diagnostic-history-list" class="math-lab-history mt-4"><div class="math-lab-status">Memuat riwayat diagnostic...</div></div>';
    practiceSection.parentElement?.insertBefore(diagnosticSection, practiceSection.nextSibling);
    document.getElementById("math-lab-refresh-diagnostic-history")?.addEventListener("click", () => loadDiagnosticHistory());
    loadDiagnosticHistory();
  }

  function refresh() {
    ensureHistorySections();
    presentDiagnosticResult();
    hideTrustMetadataFromUi();
  }

  const observer = new MutationObserver(refresh);
  observer.observe(document.body, { childList: true, subtree: true });
  refresh();

  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnosticStudentPresentation = Object.freeze({
    indicatorLabel,
    levelLabel,
    recommendationText,
    loadDiagnosticHistory,
    refresh,
    INDICATOR_LABELS,
    LEVEL_LABELS,
    ACTION_LABELS,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
