"use strict";

const content = require("../../math-lab/content/pilot/algebra-curated.js");
const evaluator = require("../../math-lab/core/answer-evaluator.js");
const diagnosticProvider = require("../../math-lab/core/diagnostic-provider.js");

const RECORDS = Object.freeze(content.records.slice(0, 12));
const RECORD_BY_ID = new Map(RECORDS.map((record) => [record.question.questionId, record]));

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

function evaluateAnswer(questionId, answer) {
  const record = RECORD_BY_ID.get(String(questionId || ""));
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

function analyze(sessionId, rawResponses) {
  if (!Array.isArray(rawResponses) || rawResponses.length !== RECORDS.length) {
    const error = new Error(`Diagnostic requires exactly ${RECORDS.length} responses.`);
    error.statusCode = 400;
    throw error;
  }

  const seen = new Set();
  const responses = rawResponses.map((item) => {
    const questionId = String(item?.questionId || "").trim();
    if (seen.has(questionId)) {
      const error = new Error(`Duplicate diagnostic response for questionId: ${questionId}.`);
      error.statusCode = 400;
      throw error;
    }
    seen.add(questionId);
    const evaluated = evaluateAnswer(questionId, item?.answer);
    if (!evaluated) {
      const error = new Error(`Unknown diagnostic questionId: ${questionId}.`);
      error.statusCode = 400;
      throw error;
    }
    return evaluated;
  });

  const expectedIds = new Set(RECORDS.map((record) => record.question.questionId));
  if (seen.size !== expectedIds.size || [...expectedIds].some((id) => !seen.has(id))) {
    const error = new Error("Diagnostic responses do not match the trusted pilot question set.");
    error.statusCode = 400;
    throw error;
  }

  const result = diagnosticProvider.createProvider().analyze({
    sessionId: String(sessionId || ""),
    questions: RECORDS,
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
