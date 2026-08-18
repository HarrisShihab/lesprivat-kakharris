"use strict";

const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");

const question = require(path.join(root, "core/contracts/question.js"));
const taxonomy = require(path.join(root, "core/contracts/taxonomy.js"));
const renderer = require(path.join(root, "core/contracts/math-renderer.js"));
const evaluation = require(path.join(root, "core/contracts/evaluation.js"));
const session = require(path.join(root, "core/contracts/session.js"));
const result = require(path.join(root, "core/contracts/result.js"));

function testQuestionContract() {
  const q = question.create({
    questionId: "q-001",
    contentKind: "curated",
    questionType: "single_choice",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    topicId: "aljabar",
    subtopicId: "suku-sejenis",
    difficulty: "easy",
    content: { prompt: "2x + 3x = ?", options: [{ id: "a", label: "5x" }] },
  });
  assert.strictEqual(q.schemaVersion, "1.0");
  assert.strictEqual(q.questionId, "q-001");
  assert.deepStrictEqual(q.indicatorIds, []);
  assert.strictEqual(q.content.prompt, "2x + 3x = ?");
  assert.ok(question.CONTENT_KINDS.includes("story-template"));
  assert.ok(question.QUESTION_TYPES.includes("expression_choice"));
}

function testTaxonomyContract() {
  const t = taxonomy.create({
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    topicId: "aljabar",
    subtopicId: "plsv",
    prerequisiteIds: ["suku-sejenis"],
    indicatorIds: ["concept", "procedure"],
  });
  assert.strictEqual(t.subject, "matematika");
  assert.deepStrictEqual(t.prerequisiteIds, ["suku-sejenis"]);
  assert.ok(taxonomy.INDICATORS.includes("representation"));
}

function testRendererContract() {
  const request = renderer.createRequest("\\frac{3}{4}", { displayMode: true });
  assert.strictEqual(request.sourceFormat, "latex");
  assert.strictEqual(request.source, "\\frac{3}{4}");
  assert.strictEqual(request.displayMode, true);
  assert.ok(renderer.SUPPORTED.includes("inequalities"));
}

function testEvaluationContract() {
  const spec = evaluation.create({
    evaluationId: "eval-001",
    questionId: "q-001",
    questionVersion: "1.0",
    questionType: "single_choice",
    specification: { correctOptionId: "a" },
  });
  const correct = evaluation.createResult({ isCorrect: true });
  const wrong = evaluation.createResult({
    isCorrect: false,
    evaluationCode: "WRONG_OPTION",
    misconceptionCode: "ALG_LIKE_TERM_CONFUSION",
  });
  assert.strictEqual(spec.specification.correctOptionId, "a");
  assert.deepStrictEqual(correct, {
    isCorrect: true,
    outcome: "correct",
    evaluationCode: "CORRECT",
    misconceptionCode: null,
  });
  assert.strictEqual(wrong.outcome, "incorrect");
  assert.strictEqual(wrong.misconceptionCode, "ALG_LIKE_TERM_CONFUSION");
}

function testSessionContract() {
  const s = session.create({
    sessionId: "session-001",
    ownerUid: "uid-001",
    sessionType: "practice",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    topicId: "aljabar",
    questionRefs: ["q-001", "q-002"],
  });
  assert.strictEqual(s.status, "created");
  assert.strictEqual(s.currentIndex, 0);
  assert.deepStrictEqual(s.questionRefs, ["q-001", "q-002"]);
  assert.ok(session.SESSION_TYPES.includes("diagnostic"));
}

function testResultContract() {
  const r = result.create({
    resultId: "result-001",
    sessionId: "session-001",
    ownerUid: "uid-001",
    sessionType: "practice",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    topicId: "aljabar",
    score: 80,
    accuracy: 0.8,
    correctCount: 8,
    wrongCount: 2,
    totalQuestions: 10,
  });
  assert.strictEqual(r.score, 80);
  assert.strictEqual(r.accuracy, 0.8);
  assert.strictEqual(r.totalQuestions, 10);
  assert.strictEqual(r.trustStatus, "client-untrusted");
  assert.deepStrictEqual(r.recommendations, []);
  assert.strictEqual(r.mastery, null);
}

const tests = [
  ["question-contract", testQuestionContract],
  ["taxonomy-contract", testTaxonomyContract],
  ["math-renderer-contract", testRendererContract],
  ["evaluation-contract", testEvaluationContract],
  ["session-contract", testSessionContract],
  ["result-contract", testResultContract],
];

let passed = 0;
for (const [name, test] of tests) {
  try {
    test();
    console.log(`PASS ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

console.log(`${passed}/${tests.length} contract tests passed`);
if (passed !== tests.length) process.exitCode = 1;
