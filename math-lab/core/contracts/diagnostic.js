(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.diagnostic = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONTRACT_VERSION = "1.0";
  const SESSION_TYPE = "diagnostic";
  const schema = Object.freeze({
    contractVersion: "string",
    sessionType: "diagnostic",
    sessionId: "string|null",
    questions: "Array<object>",
    responses: "Array<object>",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      sessionType: SESSION_TYPE,
      sessionId: value.sessionId ?? null,
      questions: Array.isArray(value.questions) ? value.questions.slice() : [],
      responses: Array.isArray(value.responses) ? value.responses.slice() : [],
    };
  }

  return Object.freeze({ CONTRACT_VERSION, SESSION_TYPE, schema, create });
});
