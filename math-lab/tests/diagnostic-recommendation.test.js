"use strict";

const assert = require("assert");
const recommendation = require("../core/diagnostic-recommendation.js");

const result = recommendation.generate([
  { indicatorId: "concept", level: "insufficient" },
  { indicatorId: "procedure", level: "developing" },
  { indicatorId: "communication", level: "mastered" },
]);

assert.deepStrictEqual(result, [
  {
    contractVersion: "1.0",
    recommendationId: "REC_INSUFFICIENT",
    indicatorId: "concept",
    priority: "high",
    action: "review_indicator",
    reason: "Evidence indicates the indicator needs review before further progression.",
  },
  {
    contractVersion: "1.0",
    recommendationId: "REC_DEVELOPING",
    indicatorId: "procedure",
    priority: "medium",
    action: "practice_indicator",
    reason: "Evidence indicates partial mastery and a need for additional practice.",
  },
  {
    contractVersion: "1.0",
    recommendationId: "REC_MASTERED",
    indicatorId: "communication",
    priority: "low",
    action: "maintain_indicator",
    reason: "Evidence indicates the indicator is currently mastered; maintain it through continued use.",
  },
]);

assert.deepStrictEqual(recommendation.generate([{ indicatorId: "x", level: "unknown" }]), []);
assert.throws(() => recommendation.generate(null), /must be an array/);

console.log("diagnostic-recommendation: PASS");
