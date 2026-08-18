"use strict";

const assert = require("assert");
const path = require("path");

const root = path.resolve(__dirname, "..");
const providerModule = require(path.join(root, "core/diagnostic-provider.js"));

function bundle(questionId, indicatorIds) {
  return {
    question: {
      questionId,
      indicatorIds,
      misconceptionCodes: [],
      contentVersion: "1.0",
    },
    evaluation: {
      evaluationRef: `eval-${questionId}`,
      questionId,
      contentVersion: "1.0",
    },
  };
}

function testCreateInputNormalizesDiagnosticBoundary() {
  const provider = providerModule.createProvider();
  const input = provider.createInput({
    sessionId: "diag-001",
    questions: [bundle("q-001", ["concept"])],
    responses: [{
      questionId: "q-001",
      isCorrect: false,
      evaluationCode: "WRONG_OPTION",
      misconceptionCode: null,
    }],
  });

  assert.strictEqual(input.sessionType, "diagnostic");
  assert.strictEqual(input.sessionId, "diag-001");
  assert.strictEqual(input.questions.length, 1);
  assert.strictEqual(input.responses.length, 1);
  assert.notStrictEqual(input.questions[0], undefined);
}

function testRejectsResponseForUnknownQuestion() {
  const provider = providerModule.createProvider();
  assert.throws(() => provider.createInput({
    questions: [bundle("q-001", ["concept"])],
    responses: [{ questionId: "q-999", isCorrect: true }],
  }), /unknown questionId/);
}

function testRejectsDuplicateResponse() {
  const provider = providerModule.createProvider();
  assert.throws(() => provider.createInput({
    questions: [bundle("q-001", ["concept"])],
    responses: [
      { questionId: "q-001", isCorrect: true },
      { questionId: "q-001", isCorrect: false },
    ],
  }), /Duplicate diagnostic response/);
}

function testAnalyzeExposesExplicitExtensionSlots() {
  const provider = providerModule.createProvider();
  const result = provider.analyze({
    questions: [bundle("q-001", ["concept"])],
    responses: [{ questionId: "q-001", isCorrect: true }],
  });

  assert.strictEqual(result.input.sessionType, "diagnostic");
  assert.deepStrictEqual(result.indicatorEvidence, []);
  assert.deepStrictEqual(result.errorMappings, []);
  assert.deepStrictEqual(result.mastery, []);
  assert.deepStrictEqual(result.recommendations, []);
  assert.ok(Object.isFrozen(result));
}

function testEvidenceBuilderIsInjectedWithoutCouplingToPracticeEngine() {
  let received = null;
  const provider = providerModule.createProvider({
    buildEvidence(input) {
      received = input;
      return [{ questionId: "q-001", indicatorId: "concept", evidenceType: "correct" }];
    },
  });

  const result = provider.analyze({
    questions: [bundle("q-001", ["concept"])],
    responses: [{ questionId: "q-001", isCorrect: true }],
  });

  assert.strictEqual(received.sessionType, "diagnostic");
  assert.strictEqual(result.indicatorEvidence.length, 1);
  assert.strictEqual(result.indicatorEvidence[0].indicatorId, "concept");
}

const tests = [
  ["diagnostic-provider-normalization", testCreateInputNormalizesDiagnosticBoundary],
  ["diagnostic-provider-unknown-question", testRejectsResponseForUnknownQuestion],
  ["diagnostic-provider-duplicate-response", testRejectsDuplicateResponse],
  ["diagnostic-provider-extension-slots", testAnalyzeExposesExplicitExtensionSlots],
  ["diagnostic-provider-evidence-extension", testEvidenceBuilderIsInjectedWithoutCouplingToPracticeEngine],
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

console.log(`${passed}/${tests.length} diagnostic provider tests passed`);
if (passed !== tests.length) process.exitCode = 1;
