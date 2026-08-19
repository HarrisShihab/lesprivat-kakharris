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

  function refresh() {
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
    refresh,
    INDICATOR_LABELS,
    LEVEL_LABELS,
    ACTION_LABELS,
  });
})(typeof globalThis !== "undefined" ? globalThis : this);
