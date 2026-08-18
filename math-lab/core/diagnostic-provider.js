(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnostic = root.KakHarrisMathLab.diagnostic || {};
  root.KakHarrisMathLab.diagnostic.provider = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const diagnosticContract = typeof require === "function"
    ? require("./contracts/diagnostic.js")
    : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts && root.KakHarrisMathLab.contracts.diagnostic);

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function assertQuestionBundle(bundle, index) {
    if (!bundle || typeof bundle !== "object") {
      throw new TypeError(`Question bundle at index ${index} must be an object.`);
    }
    if (!bundle.question || typeof bundle.question !== "object") {
      throw new TypeError(`Question bundle at index ${index} must contain question.`);
    }
    if (!bundle.evaluation || typeof bundle.evaluation !== "object") {
      throw new TypeError(`Question bundle at index ${index} must contain evaluation.`);
    }
    if (typeof bundle.question.questionId !== "string" || !bundle.question.questionId) {
      throw new TypeError(`Question bundle at index ${index} must contain question.questionId.`);
    }
  }

  function assertResponse(response, index) {
    if (!response || typeof response !== "object") {
      throw new TypeError(`Diagnostic response at index ${index} must be an object.`);
    }
    if (typeof response.questionId !== "string" || !response.questionId) {
      throw new TypeError(`Diagnostic response at index ${index} must contain questionId.`);
    }
    if (typeof response.isCorrect !== "boolean") {
      throw new TypeError(`Diagnostic response at index ${index} must contain boolean isCorrect.`);
    }
  }

  function validateInput(input) {
    const value = input || {};
    const questions = Array.isArray(value.questions) ? value.questions : [];
    const responses = Array.isArray(value.responses) ? value.responses : [];

    questions.forEach(assertQuestionBundle);
    responses.forEach(assertResponse);

    const questionIds = new Set(questions.map((bundle) => bundle.question.questionId));
    const responseIds = new Set();

    responses.forEach((response, index) => {
      if (!questionIds.has(response.questionId)) {
        throw new Error(`Diagnostic response at index ${index} references unknown questionId: ${response.questionId}.`);
      }
      if (responseIds.has(response.questionId)) {
        throw new Error(`Duplicate diagnostic response for questionId: ${response.questionId}.`);
      }
      responseIds.add(response.questionId);
    });

    return {
      contractVersion: diagnosticContract.CONTRACT_VERSION,
      sessionType: diagnosticContract.SESSION_TYPE,
      sessionId: value.sessionId ?? null,
      questions: clone(questions),
      responses: clone(responses),
    };
  }

  function createProvider(options) {
    const value = options || {};
    const evidenceBuilder = typeof value.buildEvidence === "function" ? value.buildEvidence : null;

    function createInput(input) {
      return validateInput(diagnosticContract.create(input));
    }

    function analyze(input) {
      const normalized = createInput(input);
      if (!evidenceBuilder) {
        return Object.freeze({
          input: normalized,
          indicatorEvidence: [],
          errorMappings: [],
          mastery: [],
          recommendations: [],
        });
      }

      const evidence = evidenceBuilder(normalized);
      if (!Array.isArray(evidence)) {
        throw new TypeError("Diagnostic evidence builder must return an array.");
      }

      return Object.freeze({
        input: normalized,
        indicatorEvidence: clone(evidence),
        errorMappings: [],
        mastery: [],
        recommendations: [],
      });
    }

    return Object.freeze({ createInput, analyze });
  }

  return Object.freeze({ createProvider, validateInput });
});
