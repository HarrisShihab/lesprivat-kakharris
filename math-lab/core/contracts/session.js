(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.session = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SESSION_TYPES = Object.freeze(["practice", "diagnostic"]);
  const STATUSES = Object.freeze(["created", "active", "completed", "abandoned"]);
  const CONTRACT_VERSION = "1.0";

  const schema = Object.freeze({
    contractVersion: "string",
    sessionId: "string",
    ownerUid: "string|null",
    sessionType: "practice|diagnostic",
    educationLevel: "string",
    grade: "string|number",
    phase: "string",
    subject: "string",
    topicId: "string",
    subtopicId: "string|null",
    questionRefs: "string[]",
    questionVersions: "object",
    currentIndex: "number",
    status: "created|active|completed|abandoned",
    startedAt: "timestamp|null",
    finishedAt: "timestamp|null",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      sessionId: value.sessionId || null,
      ownerUid: value.ownerUid ?? null,
      sessionType: value.sessionType || null,
      educationLevel: value.educationLevel || null,
      grade: value.grade ?? null,
      phase: value.phase || null,
      subject: value.subject || "matematika",
      topicId: value.topicId || null,
      subtopicId: value.subtopicId ?? null,
      questionRefs: Array.isArray(value.questionRefs) ? value.questionRefs.slice() : [],
      questionVersions: value.questionVersions && typeof value.questionVersions === "object"
        ? { ...value.questionVersions }
        : {},
      currentIndex: Number.isInteger(value.currentIndex) ? value.currentIndex : 0,
      status: value.status || "created",
      startedAt: value.startedAt ?? null,
      finishedAt: value.finishedAt ?? null,
    };
  }

  return Object.freeze({ CONTRACT_VERSION, SESSION_TYPES, STATUSES, schema, create });
});
