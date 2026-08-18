"use strict";

const assert = require("assert");
const provider = require("../core/diagnostic-provider.js");

const diagnostic = provider.createProvider();
const result = diagnostic.analyze({
  sessionId: "S-001",
  questions: [
    {
      question: {
        questionId: "q-1",
        indicatorIds: ["concept"],
      },
      evaluation: {},
    },
    {
      question: {
        questionId: "q-2",
        indicatorIds: ["concept", "procedure"],
      },
      evaluation: {},
    },
    {
      question: {
        questionId: "q-3",
        indicatorIds: ["procedure"],
      },
      evaluation: {},
    },
  ],
  responses: [
    { questionId: "q-1", isCorrect: true, evaluationCode: "CORRECT", misconceptionCode: null },
    { questionId: "q-2", isCorrect: false, evaluationCode: "WRONG_EXPRESSION", misconceptionCode: null },
  ],
});

assert.strictEqual(result.sessionType, "diagnostic");
assert.strictEqual(result.trustStatus, "client-untrusted");
assert.strictEqual(result.sessionId, "S-001");
assert.strictEqual(result.diagnosticSummary.questionCount, 3);
assert.strictEqual(result.diagnosticSummary.responseCount, 2);
assert.strictEqual(result.diagnosticSummary.correctCount, 1);
assert.strictEqual(result.indicatorEvidence.length, 4);
assert.strictEqual(result.errorMappings.length, 2);
assert.strictEqual(result.mastery.length, 2);
assert.strictEqual(result.recommendations.length, 2);
assert.strictEqual(result.mastery[0].indicatorId, "concept");
assert.strictEqual(result.mastery[1].indicatorId, "procedure");

console.log("diagnostic-result: PASS");
