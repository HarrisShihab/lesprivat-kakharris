"use strict";

const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");
const diagnostic = require(path.join(root, "core/contracts/diagnostic.js"));
const evidence = require(path.join(root, "core/contracts/indicator-evidence.js"));
const errorMapping = require(path.join(root, "core/contracts/error-mapping.js"));
const mastery = require(path.join(root, "core/contracts/mastery.js"));
const recommendation = require(path.join(root, "core/contracts/recommendation.js"));
const diagnosticResult = require(path.join(root, "core/contracts/diagnostic-result.js"));

function testDiagnosticContract() {
  const value = diagnostic.create({
    sessionId: "diag-001",
    questions: [{ questionId: "q-001" }],
    responses: [{ questionId: "q-001", isCorrect: false }],
  });
  assert.strictEqual(value.contractVersion, "1.0");
  assert.strictEqual(value.sessionType, "diagnostic");
  assert.deepStrictEqual(value.questions, [{ questionId: "q-001" }]);
  assert.deepStrictEqual(value.responses, [{ questionId: "q-001", isCorrect: false }]);
  assert.ok(Object.isFrozen(diagnostic));
}

function testEvidenceContract() {
  const value = evidence.create({
    questionId: "q-001",
    indicatorId: "procedure",
    evidenceType: "incorrect",
    evaluationCode: "WRONG_OPTION",
    misconceptionCode: "ALG_LIKE_TERM_CONFUSION",
  });
  assert.strictEqual(value.evidenceType, "incorrect");
  assert.strictEqual(value.indicatorId, "procedure");
  assert.ok(evidence.EVIDENCE_TYPES.includes("unanswered"));
}

function testErrorMappingContract() {
  const value = errorMapping.create({
    questionId: "q-001",
    indicatorId: "procedure",
    errorCode: "ALG_LIKE_TERM_CONFUSION",
    source: "question",
  });
  assert.strictEqual(value.errorCode, "ALG_LIKE_TERM_CONFUSION");
  assert.strictEqual(value.source, "question");
  assert.ok(errorMapping.SOURCES.includes("evaluation"));
}

function testMasteryContract() {
  const value = mastery.create({
    indicatorId: "concept",
    score: 0.75,
    level: "developing",
    evidenceCount: 4,
  });
  assert.strictEqual(value.score, 0.75);
  assert.strictEqual(value.level, "developing");
  assert.ok(mastery.LEVELS.includes("mastered"));
}

function testRecommendationContract() {
  const value = recommendation.create({
    recommendationId: "rec-001",
    indicatorId: "concept",
    priority: "high",
    action: "Perkuat konsep dasar.",
    reason: "Evidence menunjukkan penguasaan belum memadai.",
  });
  assert.strictEqual(value.priority, "high");
  assert.strictEqual(value.indicatorId, "concept");
  assert.ok(recommendation.PRIORITIES.includes("low"));
}

function testDiagnosticResultContract() {
  const value = diagnosticResult.create({
    resultId: "result-001",
    sessionId: "diag-001",
    diagnosticSummary: { totalQuestions: 10 },
    indicatorEvidence: [{ indicatorId: "concept" }],
    errorMappings: [{ errorCode: "ALG_VARIABLE_CONFUSION" }],
    mastery: [{ indicatorId: "concept", score: 0.8 }],
    recommendations: [{ recommendationId: "rec-001" }],
  });
  assert.strictEqual(value.sessionType, "diagnostic");
  assert.strictEqual(value.trustStatus, "client-untrusted");
  assert.strictEqual(value.indicatorEvidence.length, 1);
  assert.strictEqual(value.errorMappings.length, 1);
  assert.strictEqual(value.mastery.length, 1);
  assert.strictEqual(value.recommendations.length, 1);
}

const tests = [
  ["diagnostic-contract", testDiagnosticContract],
  ["indicator-evidence-contract", testEvidenceContract],
  ["error-mapping-contract", testErrorMappingContract],
  ["mastery-contract", testMasteryContract],
  ["recommendation-contract", testRecommendationContract],
  ["diagnostic-result-contract", testDiagnosticResultContract],
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

console.log(`${passed}/${tests.length} diagnostic contract tests passed`);
if (passed !== tests.length) process.exitCode = 1;
