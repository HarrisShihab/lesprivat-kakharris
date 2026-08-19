"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");
const pilot = require(path.join(root, "netlify/functions/diagnostic-pilot.js"));
const startFunction = require(path.join(root, "netlify/functions/startMathLabDiagnostic.js"));
const completeFunction = require(path.join(root, "netlify/functions/completeMathLabDiagnostic.js"));
const studentUi = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");


test("diagnostic pilot has the required 8/2/2 distribution", () => {
  assert.equal(pilot.RECORDS.length, 12);
  assert.equal(pilot.RECORDS.filter((x) => x.question.contentKind === "curated").length, 8);
  assert.equal(pilot.RECORDS.filter((x) => x.question.contentKind === "generated").length, 2);
  assert.equal(pilot.RECORDS.filter((x) => x.question.contentKind === "story-template").length, 2);
});

test("diagnostic presentation does not expose evaluation specifications", () => {
  const questions = pilot.getQuestions();
  assert.equal(questions.length, 12);
  for (const question of questions) {
    assert.equal(Object.hasOwn(question, "evaluation"), false);
    assert.equal(Object.hasOwn(question, "evaluationRef"), false);
    assert.equal(Object.hasOwn(question, "misconceptionCodes"), false);
    assert.equal(Object.hasOwn(question, "fingerprint"), false);
    for (const option of question.content.options || []) {
      assert.equal(Object.hasOwn(option, "correctOptionId"), false);
    }
  }
});

test("diagnostic evaluation is server-side and deterministic", () => {
  const first = pilot.RECORDS[0];
  const correctId = first.question.content.options[0].id === first.evaluation.specification.correctOptionId
    ? first.question.content.options[0].id
    : first.question.content.options.find((option) => option.id === first.evaluation.specification.correctOptionId).id;
  const correct = pilot.evaluateAnswer(first.question.questionId, correctId);
  const wrong = pilot.evaluateAnswer(first.question.questionId, "invalid-option");
  assert.equal(correct.isCorrect, true);
  assert.equal(correct.evaluationCode, "CORRECT");
  assert.equal(wrong.isCorrect, false);
  assert.equal(wrong.evaluationCode, "INVALID_OPTION");
});

test("diagnostic completion produces result, mastery, and recommendations", () => {
  const responses = pilot.RECORDS.map((record) => ({
    questionId: record.question.questionId,
    answer: "invalid-option",
  }));
  const analyzed = pilot.analyze("math-diagnostic-test", responses);
  assert.equal(analyzed.result.sessionType, "diagnostic");
  assert.equal(analyzed.result.trustStatus, "client-untrusted");
  assert.equal(analyzed.result.diagnosticSummary.questionCount, 12);
  assert.equal(analyzed.result.diagnosticSummary.responseCount, 12);
  assert.ok(Array.isArray(analyzed.result.indicatorEvidence));
  assert.ok(analyzed.result.indicatorEvidence.length > 0);
  assert.ok(Array.isArray(analyzed.result.mastery));
  assert.ok(analyzed.result.mastery.length > 0);
  assert.ok(Array.isArray(analyzed.result.recommendations));
  assert.ok(analyzed.result.recommendations.length > 0);
});

test("trusted diagnostic endpoints expose handlers", () => {
  assert.equal(typeof startFunction.handler, "function");
  assert.equal(typeof completeFunction.handler, "function");
});

test("student diagnostic UI contains no evaluation specification", () => {
  assert.doesNotMatch(studentUi, /correctOptionId/);
  assert.doesNotMatch(studentUi, /evaluationRef/);
  assert.match(studentUi, /startMathLabDiagnostic/);
  assert.match(studentUi, /completeMathLabDiagnostic/);
});

console.log("Diagnostic trusted-boundary tests: loaded");
