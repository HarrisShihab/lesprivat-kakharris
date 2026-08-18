(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = root.KakHarrisMathLab.questionSystem || {};
  root.KakHarrisMathLab.questionSystem.questionFactory = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const questionContract = typeof require === "function" ? require("../contracts/question.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts ? root.KakHarrisMathLab.contracts.question : null);
  const fingerprint = typeof require === "function" ? require("./fingerprint.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.fingerprint : null);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function create(input, evaluationSpec) {
    const question = questionContract.create(clone(input));
    question.fingerprint = fingerprint.createFingerprint(question);
    return {
      question,
      evaluation: evaluationSpec ? clone(evaluationSpec) : null,
    };
  }

  function publicQuestion(question) {
    const value = clone(question);
    if (!value) return value;
    delete value.fingerprint;
    return value;
  }

  return Object.freeze({ create, publicQuestion });
});
