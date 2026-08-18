(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnostic = root.KakHarrisMathLab.diagnostic || {};
  root.KakHarrisMathLab.diagnostic.mastery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const contract = typeof require === "function"
    ? require("./contracts/mastery.js")
    : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts && root.KakHarrisMathLab.contracts.mastery);

  function clamp(value) {
    return Math.max(0, Math.min(1, value));
  }

  function levelFor(score, evidenceCount) {
    if (evidenceCount <= 0) return "insufficient";
    if (score >= 0.8) return "mastered";
    if (score >= 0.5) return "developing";
    return "insufficient";
  }

  function calculate(evidenceList) {
    if (!Array.isArray(evidenceList)) throw new TypeError("Diagnostic evidence must be an array.");

    const byIndicator = new Map();
    evidenceList.forEach((evidence) => {
      if (!evidence || typeof evidence.indicatorId !== "string") return;
      if (!byIndicator.has(evidence.indicatorId)) byIndicator.set(evidence.indicatorId, []);
      byIndicator.get(evidence.indicatorId).push(evidence);
    });

    return Array.from(byIndicator.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([indicatorId, items]) => {
      const scored = items.filter((item) => item.evidenceType === "correct" || item.evidenceType === "incorrect");
      const correct = scored.filter((item) => item.evidenceType === "correct").length;
      const score = scored.length ? clamp(correct / scored.length) : 0;
      return contract.create({
        indicatorId,
        score,
        level: levelFor(score, scored.length),
        evidenceCount: scored.length,
      });
    });
  }

  return Object.freeze({ calculate, levelFor });
});
