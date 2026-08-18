(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.indicatorEvidence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONTRACT_VERSION = "1.0";
  const EVIDENCE_TYPES = Object.freeze(["correct", "incorrect", "unanswered"]);
  const schema = Object.freeze({
    contractVersion: "string",
    questionId: "string",
    indicatorId: "string",
    evidenceType: "correct|incorrect|unanswered",
    evaluationCode: "string|null",
    misconceptionCode: "string|null",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      questionId: value.questionId || null,
      indicatorId: value.indicatorId || null,
      evidenceType: value.evidenceType || "unanswered",
      evaluationCode: value.evaluationCode ?? null,
      misconceptionCode: value.misconceptionCode ?? null,
    };
  }

  return Object.freeze({ CONTRACT_VERSION, EVIDENCE_TYPES, schema, create });
});
