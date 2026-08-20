"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const pilot = require("../math-lab-pilot.js");
const diagnosticPilot = require("../../netlify/functions/diagnostic-pilot.js");
const { evaluatePracticeResponses, normalizeDiagnosticResult } = require("../trusted-finalization.js");

test("trusted practice finalization ignores client isCorrect and re-evaluates answers", () => {
  const bundle = pilot.createPractice();
  const questions = bundle.map((entry) => entry.question);
  const session = {
    sessionId: "math-session-test",
    questionRefs: questions.map((question) => question.questionId),
    questionVersions: Object.fromEntries(questions.map((question) => [question.questionId, question.version.contentVersion])),
  };
  const responses = bundle.map((entry) => ({
    questionId: entry.question.questionId,
    answer: entry.correctOptionId,
    isCorrect: false,
    evaluationCode: "WRONG",
  }));
  const result = evaluatePracticeResponses({ pilot, session, responses });
  assert.equal(result.correctCount, questions.length);
  assert.equal(result.score, 100);
  assert.ok(result.responses.every((response) => response.isCorrect === true));
});

test("trusted practice finalization rejects duplicate or missing questions", () => {
  const bundle = pilot.createPractice();
  const session = {
    sessionId: "math-session-test",
    questionRefs: bundle.map((entry) => entry.question.questionId),
    questionVersions: Object.fromEntries(bundle.map((entry) => [entry.question.questionId, entry.question.version.contentVersion])),
  };
  const responses = bundle.slice(0, -1).map((entry) => ({ questionId: entry.question.questionId, answer: entry.correctOptionId }));
  assert.throws(() => evaluatePracticeResponses({ pilot, session, responses }), /exactly one response/);
});

test("trusted diagnostic finalization recomputes score and marks result trusted", () => {
  const responses = diagnosticPilot.RECORDS.map((record) => ({ questionId: record.question.questionId, answer: "invalid-option" }));
  const result = normalizeDiagnosticResult({ pilot: diagnosticPilot, sessionId: "math-diagnostic-test", ownerUid: "u1", responses });
  assert.equal(result.trustStatus, "trusted");
  assert.equal(result.totalQuestions, 12);
  assert.equal(result.correctCount, 0);
  assert.ok(Array.isArray(result.mastery));
  assert.ok(Array.isArray(result.recommendations));
});

console.log("Trusted finalization tests: PASS");
