"use strict";

const content = require("../../math-lab/content/pilot/algebra-curated.js");
const practicePilot = require("../../functions/math-lab-pilot.js");
const evaluator = require("../../math-lab/core/answer-evaluator.js");
const diagnosticProvider = require("../../math-lab/core/diagnostic-provider.js");

const CURATED_IDS = Object.freeze([
  "alg-cur-001",
  "alg-cur-002",
  "alg-cur-005",
  "alg-cur-011",
  "alg-cur-012",
  "alg-cur-015",
  "alg-cur-027",
  "alg-cur-029",
]);

const curatedById = new Map(content.records.map((record) => [record.question.questionId, record]));
const practiceBundles = practicePilot.createPractice().map((entry) => {
  if (entry.evaluation) return entry;
  const question = entry.question;
  return {
    question,
    evaluation: {
      evaluationId: `eval-${question.questionId}-${question.version?.contentVersion || "1.0"}`,
      questionId: question.questionId,
      questionVersion: question.version?.contentVersion || "1.0",
      questionType: question.questionType,
      specification: { correctOptionId: entry.correctOptionId || null },
    },
  };
});
const generated = practiceBundles.filter((entry) => entry.question.contentKind === "generated");
const stories = practiceBundles.filter((entry) => entry.question.contentKind === "story-template");

const RECORDS = Object.freeze([
  ...CURATED_IDS.map((id) => curatedById.get(id)),
  ...generated.slice(0, 2),
  ...stories.slice(0, 2),
].filter(Boolean));

if (RECORDS.length !== 12 || RECORDS.filter((record) => record.question.contentKind === "curated").length !== 8 || RECORDS.filter((record) => record.question.contentKind === "generated").length !== 2 || RECORDS.filter((record) => record.question.contentKind === "story-template").length !== 2) {
  throw new Error("Diagnostic pilot content distribution is invalid.");
}

// Keep evaluation server-side, but allow completion to resolve any question
// from the deterministic pilot pool. This prevents a valid question served by
// a different deploy slice from being rejected at completion time.
const PILOT_POOL = Object.freeze([
  ...CURATED_IDS.map((id) => curatedById.get(id)),
  ...generated,
  ...stories,
].filter(Boolean));
const PILOT_BY_ID = new Map(PILOT_POOL.map((record) => [record.question.questionId, record]));

function presentationQuestion(record) {
  const q = record.question;
  return {
    schemaVersion: q.schemaVersion,
    questionId: q.questionId,
    questionType: q.questionType,
    educationLevel: q.educationLevel,
    grade: q.grade,
    phase: q.phase,
    subject: q.subject,
    topicId: q.topicId,
    subtopicId: q.subtopicId,
    difficulty: q.difficulty,
    version: { contentVersion: q.version.contentVersion },
    content: q.content,
  };
}

function getQuestions() {
  return RECORDS.map(presentationQuestion);
}

function evaluateRecord(record, answer) {
  if (!record) return null;
  const evaluation = evaluator.evaluate(record.question, record.evaluation, answer);
  return {
    questionId: record.question.questionId,
    questionVersion: record.question.version.contentVersion,
    answer: String(answer ?? "").trim(),
    isCorrect: evaluation.isCorrect === true,
    evaluationCode: evaluation.evaluationCode,
    misconceptionCode: evaluation.isCorrect ? null : (record.question.misconceptionCodes?.[0] || null),
  };
}

function evaluateAnswer(questionId, answer) {
  return evaluateRecord(PILOT_BY_ID.get(String(questionId || "")), answer);
}

function analyze(sessionId, rawResponses) {
  if (!Array.isArray(rawResponses) || rawResponses.length !== 12) {
    const error = new Error("Diagnostic requires exactly 12 responses.");
    error.statusCode = 400;
    throw error;
  }

  const seen = new Set();
  const records = rawResponses.map((item) => {
    const questionId = String(item?.questionId || "").trim();
    if (seen.has(questionId)) {
      const error = new Error(`Duplicate diagnostic response for questionId: ${questionId}.`);
      error.statusCode = 400;
      throw error;
    }
    const record = PILOT_BY_ID.get(questionId);
    if (!record) {
      const error = new Error(`Unknown diagnostic questionId: ${questionId}.`);
      error.statusCode = 400;
      throw error;
    }
    seen.add(questionId);
    return record;
  });

  if (seen.size !== 12) {
    const error = new Error("Diagnostic responses must contain 12 unique trusted pilot questions.");
    error.statusCode = 400;
    throw error;
  }

  const responses = rawResponses.map((item, index) => evaluateRecord(records[index], item?.answer));
  const result = diagnosticProvider.createProvider().analyze({
    sessionId: String(sessionId || ""),
    questions: records,
    responses,
  });

  return { result, responses };
}

module.exports = Object.freeze({
  RECORDS,
  getQuestions,
  evaluateAnswer,
  analyze,
});
