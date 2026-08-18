(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnostic = root.KakHarrisMathLab.diagnostic || {};
  root.KakHarrisMathLab.diagnostic.errorMapper = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const contract = typeof require === "function"
    ? require("./contracts/error-mapping.js")
    : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts && root.KakHarrisMathLab.contracts.errorMapping);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function mapEvidence(evidence) {
    if (!evidence || typeof evidence !== "object") return [];
    if (evidence.evidenceType !== "incorrect") return [];

    const mappings = [];
    if (typeof evidence.misconceptionCode === "string" && evidence.misconceptionCode) {
      mappings.push(contract.create({
        questionId: evidence.questionId,
        indicatorId: evidence.indicatorId,
        errorCode: evidence.misconceptionCode,
        source: "evaluation",
      }));
      return mappings;
    }

    if (typeof evidence.evaluationCode === "string" && evidence.evaluationCode) {
      mappings.push(contract.create({
        questionId: evidence.questionId,
        indicatorId: evidence.indicatorId,
        errorCode: evidence.evaluationCode,
        source: "evaluation",
      }));
    }

    return mappings;
  }

  function mapAll(evidenceList) {
    if (!Array.isArray(evidenceList)) throw new TypeError("Diagnostic evidence must be an array.");
    return clone(evidenceList.flatMap(mapEvidence));
  }

  return Object.freeze({ mapEvidence, mapAll });
});
