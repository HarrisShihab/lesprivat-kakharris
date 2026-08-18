(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.taxonomy = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const INDICATORS = Object.freeze([
    "concept",
    "procedure",
    "representation",
    "problem_solving",
    "communication",
  ]);
  const SCHEMA_VERSION = "1.0";

  const schema = Object.freeze({
    schemaVersion: "string",
    educationLevel: "string",
    grade: "string|number",
    phase: "string",
    subject: "string",
    topicId: "string",
    subtopicId: "string",
    title: "string",
    prerequisiteIds: "string[]",
    indicatorIds: "string[]",
    status: "draft|published|archived",
  });

  function create(input) {
    const value = input || {};
    return {
      schemaVersion: value.schemaVersion || SCHEMA_VERSION,
      educationLevel: value.educationLevel || null,
      grade: value.grade ?? null,
      phase: value.phase || null,
      subject: value.subject || "matematika",
      topicId: value.topicId || null,
      subtopicId: value.subtopicId || null,
      title: value.title || "",
      prerequisiteIds: Array.isArray(value.prerequisiteIds) ? value.prerequisiteIds.slice() : [],
      indicatorIds: Array.isArray(value.indicatorIds) ? value.indicatorIds.slice() : [],
      status: value.status || "draft",
    };
  }

  return Object.freeze({ SCHEMA_VERSION, INDICATORS, schema, create });
});
