(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.question = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONTENT_KINDS = Object.freeze(["curated", "generated", "story-template"]);
  const QUESTION_TYPES = Object.freeze(["single_choice", "numeric_input", "expression_choice"]);
  const STATUSES = Object.freeze(["draft", "published", "archived"]);
  const SCHEMA_VERSION = "1.0";

  const schema = Object.freeze({
    schemaVersion: "string",
    questionId: "string",
    fingerprint: "string|null",
    contentKind: "curated|generated|story-template",
    questionType: "single_choice|numeric_input|expression_choice",
    status: "draft|published|archived",
    educationLevel: "string",
    grade: "string|number",
    phase: "string",
    subject: "string",
    topicId: "string",
    subtopicId: "string|null",
    difficulty: "easy|medium|hard",
    indicatorIds: "string[]",
    misconceptionCodes: "string[]",
    content: {
      prompt: "string",
      options: "Array<{id:string,label:string}>|null",
      mathExpressions: "Array<{source:string}>|[]",
      context: "object|null",
      media: "Array<object>|[]",
    },
    evaluationRef: "string|null",
    generation: {
      generatorId: "string|null",
      generatorVersion: "string|null",
      templateId: "string|null",
      templateVersion: "string|null",
    },
    version: {
      contentVersion: "string",
    },
  });

  function create(input) {
    const value = input || {};
    return {
      schemaVersion: value.schemaVersion || SCHEMA_VERSION,
      questionId: value.questionId || null,
      fingerprint: value.fingerprint ?? null,
      contentKind: value.contentKind || null,
      questionType: value.questionType || null,
      status: value.status || "draft",
      educationLevel: value.educationLevel || null,
      grade: value.grade ?? null,
      phase: value.phase || null,
      subject: value.subject || "matematika",
      topicId: value.topicId || null,
      subtopicId: value.subtopicId ?? null,
      difficulty: value.difficulty || null,
      indicatorIds: Array.isArray(value.indicatorIds) ? value.indicatorIds.slice() : [],
      misconceptionCodes: Array.isArray(value.misconceptionCodes) ? value.misconceptionCodes.slice() : [],
      content: {
        prompt: value.content?.prompt || "",
        options: Array.isArray(value.content?.options) ? value.content.options.slice() : null,
        mathExpressions: Array.isArray(value.content?.mathExpressions) ? value.content.mathExpressions.slice() : [],
        context: value.content?.context ?? null,
        media: Array.isArray(value.content?.media) ? value.content.media.slice() : [],
      },
      evaluationRef: value.evaluationRef ?? null,
      generation: {
        generatorId: value.generation?.generatorId ?? null,
        generatorVersion: value.generation?.generatorVersion ?? null,
        templateId: value.generation?.templateId ?? null,
        templateVersion: value.generation?.templateVersion ?? null,
      },
      version: {
        contentVersion: value.version?.contentVersion || "1.0",
      },
    };
  }

  return Object.freeze({
    SCHEMA_VERSION,
    CONTENT_KINDS,
    QUESTION_TYPES,
    STATUSES,
    schema,
    create,
  });
});
