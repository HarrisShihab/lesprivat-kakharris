(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.result = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SESSION_TYPES = Object.freeze(["practice", "diagnostic"]);
  const CONTRACT_VERSION = "1.0";

  const schema = Object.freeze({
    contractVersion: "string",
    resultId: "string",
    sessionId: "string",
    ownerUid: "string|null",
    sessionType: "practice|diagnostic",
    educationLevel: "string",
    grade: "string|number",
    phase: "string",
    subject: "string",
    topicId: "string",
    score: "number",
    accuracy: "number",
    correctCount: "number",
    wrongCount: "number",
    totalQuestions: "number",
    duration: "number|null",
    questionVersions: "object",
    responses: "Array<object>",
    diagnosticSummary: "object|null",
    mastery: "object|null",
    recommendations: "Array<object>",
    createdAt: "timestamp|null",
    trustStatus: "client-untrusted|trusted|pending-trust",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      resultId: value.resultId || null,
      sessionId: value.sessionId || null,
      ownerUid: value.ownerUid ?? null,
      sessionType: value.sessionType || null,
      educationLevel: value.educationLevel || null,
      grade: value.grade ?? null,
      phase: value.phase || null,
      subject: value.subject || "matematika",
      topicId: value.topicId || null,
      score: Number(value.score ?? 0),
      accuracy: Number(value.accuracy ?? 0),
      correctCount: Number(value.correctCount ?? 0),
      wrongCount: Number(value.wrongCount ?? 0),
      totalQuestions: Number(value.totalQuestions ?? 0),
      duration: value.duration == null ? null : Number(value.duration),
      questionVersions: value.questionVersions && typeof value.questionVersions === "object"
        ? { ...value.questionVersions }
        : {},
      responses: Array.isArray(value.responses) ? value.responses.slice() : [],
      diagnosticSummary: value.diagnosticSummary ?? null,
      mastery: value.mastery ?? null,
      recommendations: Array.isArray(value.recommendations) ? value.recommendations.slice() : [],
      createdAt: value.createdAt ?? null,
      trustStatus: value.trustStatus || "client-untrusted",
    };
  }

  return Object.freeze({ CONTRACT_VERSION, SESSION_TYPES, schema, create });
});
