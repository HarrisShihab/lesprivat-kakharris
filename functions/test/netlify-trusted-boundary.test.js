"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const root = path.resolve(__dirname, "../..");
const studentUi = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");
const startFunction = require(path.join(root, "netlify/functions/startMathLabPractice.js"));
const evaluateFunction = require(path.join(root, "netlify/functions/evaluateMathLabAnswer.js"));


test("authenticated Math Lab UI uses the Netlify trusted boundary", () => {
  assert.match(studentUi, /\/\.netlify\/functions\/\$\{name\}/);
  assert.doesNotMatch(studentUi, /us-central1-les-privat-kak-harris\.cloudfunctions\.net/);
});

test("Netlify trusted endpoints expose handlers", () => {
  assert.equal(typeof startFunction.handler, "function");
  assert.equal(typeof evaluateFunction.handler, "function");
});

test("trusted endpoint source does not expose answer keys in response construction", () => {
  const evaluateSource = fs.readFileSync(path.join(root, "netlify/functions/evaluateMathLabAnswer.js"), "utf8");
  assert.doesNotMatch(evaluateSource, /correctOptionId/);
  assert.match(evaluateSource, /pilot\.evaluate/);
});
