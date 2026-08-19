"use strict";

const assert = require("assert");
const test = require("node:test");
const pilot = require("../math-lab-pilot.js");

test("trusted pilot returns presentation-safe questions", () => {
  const practice = pilot.createPractice();
  assert.strictEqual(practice.length, 10);
  for (const entry of practice) {
    assert.ok(entry.question.questionId);
    assert.ok(Array.isArray(entry.question.content.options));
    assert.ok(!Object.prototype.hasOwnProperty.call(entry.question, "evaluationRef") || entry.question.evaluationRef == null);
    assert.ok(!Object.prototype.hasOwnProperty.call(entry.question, "correctOptionId"));
    assert.ok(!Object.prototype.hasOwnProperty.call(entry.question, "evaluation"));
  }
});

test("trusted pilot evaluates known question server-side", () => {
  const result = pilot.evaluate("alg-cur-001", "opt-2");
  assert.strictEqual(result.isCorrect, true);
  assert.strictEqual(result.evaluationCode, "CORRECT");
});

test("trusted pilot rejects unknown question ids", () => {
  assert.strictEqual(pilot.evaluate("not-a-real-question", "opt-1"), null);
});
