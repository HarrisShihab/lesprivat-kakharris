(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.errorMapping = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONTRACT_VERSION = "1.0";
  const SOURCES = Object.freeze(["question", "evaluation"]);
  const schema = Object.freeze({
    contractVersion: "string",
    questionId: "string",
    indicatorId: "string",
    errorCode: "string",
    source: "question|evaluation",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      questionId: value.questionId || null,
      indicatorId: value.indicatorId || null,
      errorCode: value.errorCode || null,
      source: value.source || null,
    };
  }

  return Object.freeze({ CONTRACT_VERSION, SOURCES, schema, create });
});
