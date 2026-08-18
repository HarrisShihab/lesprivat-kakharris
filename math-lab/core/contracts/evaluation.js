(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.evaluation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const QUESTION_TYPES = Object.freeze(["single_choice", "numeric_input", "expression_choice"]);
  const OUTCOMES = Object.freeze(["correct", "incorrect"]);
  const CONTRACT_VERSION = "1.0";

  const schema = Object.freeze({
    contractVersion: "string",
    evaluationId: "string",
    questionId: "string",
    questionVersion: "string",
    questionType: "single_choice|numeric_input|expression_choice",
    specification: "object",
  });

  const resultSchema = Object.freeze({
    isCorrect: "boolean",
    outcome: "correct|incorrect",
    evaluationCode: "string",
    misconceptionCode: "string|null",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      evaluationId: value.evaluationId || null,
      questionId: value.questionId || null,
      questionVersion: value.questionVersion || null,
      questionType: value.questionType || null,
      specification: value.specification && typeof value.specification === "object"
        ? { ...value.specification }
        : {},
    };
  }

  function createResult(input) {
    const value = input || {};
    const isCorrect = value.isCorrect === true;
    return {
      isCorrect,
      outcome: isCorrect ? "correct" : "incorrect",
      evaluationCode: value.evaluationCode || (isCorrect ? "CORRECT" : "INCORRECT"),
      misconceptionCode: value.misconceptionCode ?? null,
    };
  }

  return Object.freeze({
    CONTRACT_VERSION,
    QUESTION_TYPES,
    OUTCOMES,
    schema,
    resultSchema,
    create,
    createResult,
  });
});
