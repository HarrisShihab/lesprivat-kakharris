"use strict";

const assert = require("assert");
const provider = require("../core/diagnostic-provider.js");

const diagnostic = provider.createProvider();

const questions = [
  { question: { questionId: "q-1", indicatorIds: ["concept", "procedure"] }, evaluation: {} },
  { question: { questionId: "q-2", indicatorIds: ["concept"] }, evaluation: {} },
];

const result = diagnostic.analyze({
  sessionId: "diag-001",
  questions,
  responses: [
    { questionId: "q-1", isCorrect: true, evaluationCode: "CORRECT", misconceptionCode: null },
    { questionId: "q-2", isCorrect: false, evaluationCode: "WRONG_OPTION", misconceptionCode: "ALG_VARIABLE_CONFUSION" },
  ],
});

assert.strictEqual(result.indicatorEvidence.length, 3);
assert.deepStrictEqual(result.indicatorEvidence.map((x) => [x.questionId, x.indicatorId, x.evidenceType]), [
  ["q-1", "concept", "correct"],
  ["q-1", "procedure", "correct"],
  ["q-2", "concept", "incorrect"],
]);
assert.strictEqual(result.indicatorEvidence[2].evaluationCode, "WRONG_OPTION");
assert.strictEqual(result.indicatorEvidence[2].misconceptionCode, "ALG_VARIABLE_CONFUSION");

const unanswered = diagnostic.analyze({ questions, responses: [] });
assert.strictEqual(unanswered.indicatorEvidence.length, 3);
assert.ok(unanswered.indicatorEvidence.every((x) => x.evidenceType === "unanswered"));

assert.throws(() => diagnostic.analyze({
  questions,
  responses: [{ questionId: "unknown", isCorrect: true }],
}), /unknown questionId/);

console.log("PASS diagnostic indicator evidence");
