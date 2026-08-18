(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnostic = root.KakHarrisMathLab.diagnostic || {};
  root.KakHarrisMathLab.diagnostic.provider = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const diagnosticContract = typeof require === "function" ? require("./contracts/diagnostic.js") : root.KakHarrisMathLab.contracts.diagnostic;
  const evidenceContract = typeof require === "function" ? require("./contracts/indicator-evidence.js") : root.KakHarrisMathLab.contracts.indicatorEvidence;
  const errorMapper = typeof require === "function" ? require("./diagnostic-error-mapper.js") : root.KakHarrisMathLab.diagnostic.errorMapper;
  const masteryEngine = typeof require === "function" ? require("./diagnostic-mastery.js") : root.KakHarrisMathLab.diagnostic.mastery;
  const recommendationEngine = typeof require === "function" ? require("./diagnostic-recommendation.js") : root.KakHarrisMathLab.diagnostic.recommendation;
  const resultContract = typeof require === "function" ? require("./contracts/diagnostic-result.js") : root.KakHarrisMathLab.contracts.diagnosticResult;

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function assertQuestionBundle(bundle, index) {
    if (!bundle || typeof bundle !== "object") throw new TypeError(`Question bundle at index ${index} must be an object.`);
    if (!bundle.question || typeof bundle.question !== "object") throw new TypeError(`Question bundle at index ${index} must contain question.`);
    if (!bundle.evaluation || typeof bundle.evaluation !== "object") throw new TypeError(`Question bundle at index ${index} must contain evaluation.`);
    if (typeof bundle.question.questionId !== "string" || !bundle.question.questionId) throw new TypeError(`Question bundle at index ${index} must contain question.questionId.`);
    if (!Array.isArray(bundle.question.indicatorIds)) throw new TypeError(`Question bundle at index ${index} must contain indicatorIds array.`);
  }

  function assertResponse(response, index) {
    if (!response || typeof response !== "object") throw new TypeError(`Diagnostic response at index ${index} must be an object.`);
    if (typeof response.questionId !== "string" || !response.questionId) throw new TypeError(`Diagnostic response at index ${index} must contain questionId.`);
    if (typeof response.isCorrect !== "boolean") throw new TypeError(`Diagnostic response at index ${index} must contain boolean isCorrect.`);
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
      if (!questionIds.has(response.questionId)) throw new Error(`Diagnostic response at index ${index} references unknown questionId: ${response.questionId}.`);
      if (responseIds.has(response.questionId)) throw new Error(`Duplicate diagnostic response for questionId: ${response.questionId}.`);
      responseIds.add(response.questionId);
    });
    return { contractVersion: diagnosticContract.CONTRACT_VERSION, sessionType: diagnosticContract.SESSION_TYPE, sessionId: value.sessionId ?? null, questions: clone(questions), responses: clone(responses) };
  }

  function buildDefaultEvidence(input) {
    const responseByQuestionId = new Map(input.responses.map((response) => [response.questionId, response]));
    const evidence = [];
    input.questions.forEach((bundle) => {
      const question = bundle.question;
      const response = responseByQuestionId.get(question.questionId) || null;
      const evidenceType = !response ? "unanswered" : (response.isCorrect ? "correct" : "incorrect");
      question.indicatorIds.forEach((indicatorId) => evidence.push(evidenceContract.create({
        questionId: question.questionId,
        indicatorId,
        evidenceType,
        evaluationCode: response ? (response.evaluationCode ?? null) : null,
        misconceptionCode: response ? (response.misconceptionCode ?? null) : null,
      })));
    });
    return evidence;
  }

  function createProvider(options) {
    const value = options || {};
    const evidenceBuilder = typeof value.buildEvidence === "function" ? value.buildEvidence : buildDefaultEvidence;
    const errorMapperFn = typeof value.mapErrors === "function" ? value.mapErrors : errorMapper.mapAll;
    const masteryFn = typeof value.calculateMastery === "function" ? value.calculateMastery : masteryEngine.calculate;
    const recommendationFn = typeof value.generateRecommendations === "function" ? value.generateRecommendations : recommendationEngine.generate;

    function createInput(input) { return validateInput(diagnosticContract.create(input)); }
    function analyze(input) {
      const normalized = createInput(input);
      const indicatorEvidence = evidenceBuilder(normalized);
      if (!Array.isArray(indicatorEvidence)) throw new TypeError("Diagnostic evidence builder must return an array.");
      const errorMappings = errorMapperFn(indicatorEvidence);
      const mastery = masteryFn(indicatorEvidence);
      const recommendations = recommendationFn(mastery);
      const summary = {
        questionCount: normalized.questions.length,
        responseCount: normalized.responses.length,
        answeredCount: normalized.responses.length,
        correctCount: normalized.responses.filter((response) => response.isCorrect).length,
        indicatorCount: mastery.length,
      };
      return resultContract.create({
        resultId: `DIAG_${normalized.sessionId || "UNASSIGNED"}`,
        sessionId: normalized.sessionId,
        diagnosticSummary: summary,
        indicatorEvidence,
        errorMappings,
        mastery,
        recommendations,
      });
    }
    return Object.freeze({ createInput, analyze });
  }

  return Object.freeze({ createProvider, validateInput, buildDefaultEvidence });
});
