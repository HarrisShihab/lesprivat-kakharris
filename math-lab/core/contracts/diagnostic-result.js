(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.diagnosticResult = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONTRACT_VERSION = "1.0";
  const TRUST_STATUS = "client-untrusted";
  const schema = Object.freeze({
    contractVersion: "string",
    resultId: "string",
    sessionId: "string",
    sessionType: "diagnostic",
    diagnosticSummary: "object",
    indicatorEvidence: "Array<object>",
    errorMappings: "Array<object>",
    mastery: "Array<object>",
    recommendations: "Array<object>",
    trustStatus: "client-untrusted",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      resultId: value.resultId || null,
      sessionId: value.sessionId || null,
      sessionType: "diagnostic",
      diagnosticSummary: value.diagnosticSummary && typeof value.diagnosticSummary === "object"
        ? { ...value.diagnosticSummary }
        : {},
      indicatorEvidence: Array.isArray(value.indicatorEvidence) ? value.indicatorEvidence.slice() : [],
      errorMappings: Array.isArray(value.errorMappings) ? value.errorMappings.slice() : [],
      mastery: Array.isArray(value.mastery) ? value.mastery.slice() : [],
      recommendations: Array.isArray(value.recommendations) ? value.recommendations.slice() : [],
      trustStatus: TRUST_STATUS,
    };
  }

  return Object.freeze({ CONTRACT_VERSION, TRUST_STATUS, schema, create });
});
