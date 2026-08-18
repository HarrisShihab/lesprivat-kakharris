(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = root.KakHarrisMathLab.questionSystem || {};
  root.KakHarrisMathLab.questionSystem.validator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const questionContract = typeof require === "function"
    ? require("../contracts/question.js")
    : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts ? root.KakHarrisMathLab.contracts.question : null);
  const fingerprint = typeof require === "function"
    ? require("./fingerprint.js")
    : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.fingerprint : null);
  const versioning = typeof require === "function"
    ? require("./versioning.js")
    : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.versioning : null);

  const DIFFICULTIES = new Set(["easy", "medium", "hard"]);
  const INDICATORS = new Set(["concept", "procedure", "representation", "problem_solving", "communication"]);
  const QUESTION_TYPES = new Set(["single_choice", "numeric_input", "expression_choice"]);
  const CONTENT_KINDS = new Set(["curated", "generated", "story-template"]);
  const STATUS = new Set(["draft", "published", "archived"]);
  const EVALUATION_TYPES = new Set(["single_choice", "numeric_input", "expression_choice"]);

  function issue(path, message) { return { path, message }; }

  function validateQuestion(question, options) {
    const value = question || {};
    const opts = options || {};
    const issues = [];

    if (!value.schemaVersion || !versioning.isValidVersion(value.schemaVersion)) issues.push(issue("schemaVersion", "Must use MAJOR.MINOR version."));
    if (!value.questionId || typeof value.questionId !== "string") issues.push(issue("questionId", "Question ID is required."));
    if (!CONTENT_KINDS.has(value.contentKind)) issues.push(issue("contentKind", "Unsupported content kind."));
    if (!QUESTION_TYPES.has(value.questionType)) issues.push(issue("questionType", "Unsupported question type."));
    if (!STATUS.has(value.status)) issues.push(issue("status", "Unsupported status."));
    for (const field of ["educationLevel", "phase", "subject", "topicId"]) {
      if (!value[field] || typeof value[field] !== "string") issues.push(issue(field, "Required string field."));
    }
    if (value.grade === null || value.grade === undefined || (typeof value.grade !== "string" && typeof value.grade !== "number")) issues.push(issue("grade", "Grade is required."));
    if (value.subtopicId !== null && typeof value.subtopicId !== "string") issues.push(issue("subtopicId", "Must be string or null."));
    if (!DIFFICULTIES.has(value.difficulty)) issues.push(issue("difficulty", "Unsupported difficulty."));

    if (!Array.isArray(value.indicatorIds) || value.indicatorIds.some((id) => !INDICATORS.has(id))) issues.push(issue("indicatorIds", "Contains unsupported indicator."));
    if (!Array.isArray(value.misconceptionCodes) || value.misconceptionCodes.some((id) => typeof id !== "string" || !id)) issues.push(issue("misconceptionCodes", "Must be non-empty strings."));

    const content = value.content || {};
    if (typeof content.prompt !== "string" || !content.prompt.trim()) issues.push(issue("content.prompt", "Prompt is required."));
    if (content.options !== null && (!Array.isArray(content.options) || content.options.some((option) => !option || typeof option.id !== "string" || typeof option.label !== "string"))) {
      issues.push(issue("content.options", "Options must be an array of {id,label}."));
    }
    if (!Array.isArray(content.mathExpressions) || content.mathExpressions.some((expr) => !expr || typeof expr.source !== "string" || !expr.source.trim())) {
      issues.push(issue("content.mathExpressions", "Math expressions must contain source strings."));
    }
    if (!Array.isArray(content.media)) issues.push(issue("content.media", "Media must be an array."));

    if (value.questionType === "single_choice" || value.questionType === "expression_choice") {
      if (!Array.isArray(content.options) || content.options.length < 2) issues.push(issue("content.options", "Choice questions require at least two options."));
      const ids = new Set((content.options || []).map((option) => option.id));
      if (ids.size !== (content.options || []).length) issues.push(issue("content.options", "Option IDs must be unique."));
    }

    if (value.questionType === "numeric_input" && Array.isArray(content.options) && content.options.length) {
      issues.push(issue("content.options", "Numeric input questions must not use options."));
    }

    const generation = value.generation || {};
    if (value.contentKind === "generated" && (!generation.generatorId || !generation.generatorVersion)) {
      issues.push(issue("generation", "Generated questions require generator ID and version."));
    }
    if (value.contentKind === "story-template" && (!generation.templateId || !generation.templateVersion)) {
      issues.push(issue("generation", "Story-template questions require template ID and version."));
    }
    if (generation.generatorVersion && !versioning.isValidVersion(generation.generatorVersion)) issues.push(issue("generation.generatorVersion", "Invalid generator version."));
    if (generation.templateVersion && !versioning.isValidVersion(generation.templateVersion)) issues.push(issue("generation.templateVersion", "Invalid template version."));

    if (!value.version || !versioning.isValidVersion(value.version.contentVersion)) issues.push(issue("version.contentVersion", "Invalid content version."));
    if (value.evaluationRef !== null && typeof value.evaluationRef !== "string") issues.push(issue("evaluationRef", "Must be string or null."));

    if (opts.evaluationSpec) {
      const evaluation = opts.evaluationSpec;
      if (!EVALUATION_TYPES.has(evaluation.questionType)) issues.push(issue("evaluation.questionType", "Unsupported evaluation type."));
      if (evaluation.questionType !== value.questionType) issues.push(issue("evaluation.questionType", "Does not match question type."));
      if (!evaluation.evaluationId || typeof evaluation.evaluationId !== "string") issues.push(issue("evaluation.evaluationId", "Evaluation ID is required."));
      if (!evaluation.questionId || evaluation.questionId !== value.questionId) issues.push(issue("evaluation.questionId", "Must match question ID."));
      if (!evaluation.questionVersion || evaluation.questionVersion !== value.version.contentVersion) issues.push(issue("evaluation.questionVersion", "Must match content version."));
      if (!evaluation.specification || typeof evaluation.specification !== "object") issues.push(issue("evaluation.specification", "Specification is required."));
    }

    const computedFingerprint = fingerprint.createFingerprint(value);
    if (value.fingerprint && value.fingerprint !== computedFingerprint) issues.push(issue("fingerprint", "Fingerprint does not match content."));

    return { valid: issues.length === 0, issues, fingerprint: computedFingerprint };
  }

  return Object.freeze({ validateQuestion });
});
