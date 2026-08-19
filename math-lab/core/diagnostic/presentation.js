(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnosticPresentation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  const LABELS = Object.freeze({ concept: "Konsep", problem_solving: "Pemecahan masalah", procedure: "Prosedur", representation: "Representasi" });
  const ACTIONS = Object.freeze({ maintain_indicator: "Pertahankan kemampuan", practice_indicator: "Perlu latihan tambahan", review_indicator: "Perlu mengulang materi" });
  function recommendation(item) {
    const value = item || {};
    return { indicator: LABELS[value.indicator] || String(value.indicator || "Indikator"), text: ACTIONS[value.action] || "Lanjutkan latihan", priority: String(value.priority || "low") };
  }
  function sanitizeResult(result) {
    const value = result || {};
    return { score: Number(value.score || 0), correctCount: Number(value.correctCount || 0), totalQuestions: Number(value.totalQuestions || 0), mastery: Array.isArray(value.mastery) ? value.mastery.map((item) => ({ indicator: LABELS[item.indicator] || String(item.indicator || "Indikator"), percentage: Number(item.percentage || 0), status: String(item.status || "") })) : [], recommendations: Array.isArray(value.recommendations) ? value.recommendations.map(recommendation) : [] };
  }
  return Object.freeze({ recommendation, sanitizeResult });
});
