"use strict";

const assert = require("assert");
const mapper = require("../core/diagnostic-error-mapper.js");

const base = {
  questionId: "q-1",
  indicatorId: "procedure",
};

assert.deepStrictEqual(mapper.mapEvidence({
  ...base,
  evidenceType: "correct",
  evaluationCode: "CORRECT",
}), []);

assert.deepStrictEqual(mapper.mapEvidence({
  ...base,
  evidenceType: "unanswered",
  evaluationCode: null,
}), []);

assert.deepStrictEqual(mapper.mapEvidence({
  ...base,
  evidenceType: "incorrect",
  evaluationCode: "WRONG_EXPRESSION",
  misconceptionCode: "ALG_SIGN_OPERATION_ERROR",
}), [{
  contractVersion: "1.0",
  questionId: "q-1",
  indicatorId: "procedure",
  errorCode: "ALG_SIGN_OPERATION_ERROR",
  source: "evaluation",
}]);

assert.deepStrictEqual(mapper.mapEvidence({
  ...base,
  evidenceType: "incorrect",
  evaluationCode: "WRONG_NUMERIC",
  misconceptionCode: null,
}), [{
  contractVersion: "1.0",
  questionId: "q-1",
  indicatorId: "procedure",
  errorCode: "WRONG_NUMERIC",
  source: "evaluation",
}]);

assert.throws(() => mapper.mapAll(null), /must be an array/);

console.log("diagnostic-error-mapper: PASS");
