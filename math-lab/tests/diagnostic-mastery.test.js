"use strict";

const assert = require("assert");
const mastery = require("../core/diagnostic-mastery.js");

assert.strictEqual(mastery.levelFor(0.9, 3), "mastered");
assert.strictEqual(mastery.levelFor(0.6, 3), "developing");
assert.strictEqual(mastery.levelFor(0.2, 3), "insufficient");
assert.strictEqual(mastery.levelFor(1, 0), "insufficient");

const result = mastery.calculate([
  { indicatorId: "concept", evidenceType: "correct" },
  { indicatorId: "concept", evidenceType: "correct" },
  { indicatorId: "concept", evidenceType: "incorrect" },
  { indicatorId: "procedure", evidenceType: "unanswered" },
]);

assert.deepStrictEqual(result, [
  {
    contractVersion: "1.0",
    indicatorId: "concept",
    score: 2 / 3,
    level: "developing",
    evidenceCount: 3,
  },
  {
    contractVersion: "1.0",
    indicatorId: "procedure",
    score: 0,
    level: "insufficient",
    evidenceCount: 0,
  },
]);

assert.throws(() => mastery.calculate(null), /must be an array/);

console.log("diagnostic-mastery: PASS");
