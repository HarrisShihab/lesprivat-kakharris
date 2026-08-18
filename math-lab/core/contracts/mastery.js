(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts.mastery = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONTRACT_VERSION = "1.0";
  const LEVELS = Object.freeze(["insufficient", "developing", "mastered"]);
  const schema = Object.freeze({
    contractVersion: "string",
    indicatorId: "string",
    score: "number",
    level: "insufficient|developing|mastered",
    evidenceCount: "number",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      indicatorId: value.indicatorId || null,
      score: Number(value.score ?? 0),
      level: value.level || "insufficient",
      evidenceCount: Number(value.evidenceCount ?? 0),
    };
  }

  return Object.freeze({ CONTRACT_VERSION, LEVELS, schema, create });
});
