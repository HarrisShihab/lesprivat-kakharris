"use strict";

const assert = require("assert");
const path = require("path");
const root = path.resolve(__dirname, "..");
const evaluator = require(path.join(root, "core/answer-evaluator.js"));
const questionContract = require(path.join(root, "core/contracts/question.js"));
const questionSystem = require(path.join(root, "core/question-system/index.js"));

function choiceQuestion() {
  return questionContract.create({
    questionId: "eval-choice-001",
    contentKind: "curated",
    questionType: "single_choice",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    subtopicId: "suku-sejenis",
    difficulty: "easy",
    content: {
      prompt: "Sederhanakan 2x + 3x.",
      options: [
        { id: "a", label: "5x" },
        { id: "b", label: "6x" },
      ],
      mathExpressions: [{ source: "2x+3x" }],
    },
  });
}

function numericQuestion() {
  return questionContract.create({
    questionId: "eval-numeric-001",
    contentKind: "generated",
    questionType: "numeric_input",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    subtopicId: "plsv",
    difficulty: "easy",
    content: { prompt: "Tentukan x: x + 4 = 9.", options: null, mathExpressions: [{ source: "x+4=9" }] },
  });
}

function expressionQuestion() {
  return questionContract.create({
    questionId: "eval-expression-001",
    contentKind: "generated",
    questionType: "expression_choice",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    subtopicId: "operasi-bentuk-aljabar",
    difficulty: "medium",
    content: { prompt: "Sederhanakan bentuk aljabar.", options: null, mathExpressions: [{ source: "2x+3x" }] },
  });
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test("evaluates actual curated Question System bundle", () => {
  const entry = questionSystem.curated.records[6];
  const correctId = entry.evaluation.specification.correctOptionId;
  const wrongId = entry.question.content.options.find((option) => option.id !== correctId).id;
  assert.strictEqual(evaluator.evaluate(entry.question, entry.evaluation, correctId).isCorrect, true);
  assert.strictEqual(evaluator.evaluate(entry.question, entry.evaluation, wrongId).isCorrect, false);
});

test("single-choice correct and wrong", () => {
  const q = choiceQuestion();
  const spec = { evaluationId: "e1", questionId: q.questionId, questionVersion: "1.0", questionType: q.questionType, specification: { correctOptionId: "a" } };
  assert.strictEqual(evaluator.evaluate(q, spec, "a").isCorrect, true);
  assert.strictEqual(evaluator.evaluate(q, spec, "b").evaluationCode, "WRONG_OPTION");
});

test("single-choice invalid answer and invalid spec", () => {
  const q = choiceQuestion();
  assert.strictEqual(evaluator.evaluate(q, { specification: { correctOptionId: "a" } }, "z").evaluationCode, "INVALID_OPTION");
  assert.strictEqual(evaluator.evaluate(q, { specification: {} }, "a").evaluationCode, "INVALID_EVALUATION_SPEC");
});

test("numeric exact and equivalent", () => {
  const q = numericQuestion();
  const spec = { questionId: q.questionId, questionType: q.questionType, specification: { correctAnswer: 5 } };
  assert.strictEqual(evaluator.evaluate(q, spec, "5").isCorrect, true);
  assert.strictEqual(evaluator.evaluate(q, spec, "5.0000000001").isCorrect, true);
  assert.strictEqual(evaluator.evaluate(q, spec, "6").evaluationCode, "WRONG_NUMERIC");
});

test("numeric normalization and invalid formats", () => {
  assert.strictEqual(evaluator.parseNumeric(" 5 "), 5);
  assert.strictEqual(evaluator.parseNumeric("5,5"), 5.5);
  assert.strictEqual(evaluator.parseNumeric("5x"), null);
  assert.strictEqual(evaluator.parseNumeric(""), null);
  assert.strictEqual(evaluator.parseNumeric("1e309"), null);
});

test("numeric accepted answers", () => {
  const q = numericQuestion();
  const spec = { specification: { acceptedAnswers: [5, 5.5] } };
  assert.strictEqual(evaluator.evaluate(q, spec, "5.5").isCorrect, true);
  assert.strictEqual(evaluator.evaluate(q, spec, "7").isCorrect, false);
});

test("expression equivalence for algebra", () => {
  const q = expressionQuestion();
  const spec = { specification: { correctAnswer: "5x" } };
  assert.strictEqual(evaluator.evaluate(q, spec, "2x + 3x").isCorrect, true);
  assert.strictEqual(evaluator.evaluate(q, spec, "3x+2x").isCorrect, true);
  assert.strictEqual(evaluator.evaluate(q, spec, "x*5").isCorrect, true);
  assert.strictEqual(evaluator.evaluate(q, spec, "5x+1").evaluationCode, "WRONG_EXPRESSION");
});

test("expression constants, fractions and powers", () => {
  assert.strictEqual(evaluator.polynomialEquivalent("2(x+3)", "2x+6"), true);
  assert.strictEqual(evaluator.polynomialEquivalent("x^2+2x+1", "(x+1)^2"), true);
  assert.strictEqual(evaluator.polynomialEquivalent("3/4", "0.75"), true);
  assert.strictEqual(evaluator.polynomialEquivalent("x^2", "x"), false);
});

test("expression relation equivalence", () => {
  assert.strictEqual(evaluator.polynomialEquivalent("x+4=9", "x+4=9"), true);
  assert.strictEqual(evaluator.polynomialEquivalent("2x+2=10", "x+1=5"), false);
  assert.strictEqual(evaluator.polynomialEquivalent("x+4<=9", "x+4<=9"), true);
  assert.strictEqual(evaluator.polynomialEquivalent("x+4<=9", "x+4>=9"), false);
});

test("expression security rejects unsupported input", () => {
  assert.strictEqual(evaluator.validateExpressionSource("alert(1)").valid, false);
  assert.strictEqual(evaluator.validateExpressionSource("x;window").valid, false);
  assert.strictEqual(evaluator.validateExpressionSource("sin(x)").valid, false);
  assert.strictEqual(evaluator.validateExpressionSource("x+2").valid, true);
});

test("expression invalid answers never throw through public evaluator", () => {
  const q = expressionQuestion();
  const spec = { specification: { correctAnswer: "5x" } };
  const cases = ["", "abc", "x/0", "x^7", "x+", "<script>"];
  for (const answer of cases) {
    const outcome = evaluator.evaluate(q, spec, answer);
    assert.strictEqual(outcome.isCorrect, false);
    assert.ok(typeof outcome.evaluationCode === "string");
  }
});

test("public result does not expose evaluation specification", () => {
  const q = choiceQuestion();
  const spec = { specification: { correctOptionId: "a", secret: "answer-key" } };
  const outcome = evaluator.evaluate(q, spec, "a");
  const safe = evaluator.publicResult(outcome);
  assert.deepStrictEqual(Object.keys(safe).sort(), ["evaluationCode", "isCorrect", "misconceptionCode", "outcome"]);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(safe, "correctOptionId"), false);
});

test("unsupported question type", () => {
  const q = { questionType: "essay", content: {} };
  assert.strictEqual(evaluator.evaluate(q, { specification: {} }, "answer").evaluationCode, "UNSUPPORTED_QUESTION_TYPE");
});

let passed = 0;
for (const [name, fn] of tests) {
  try {
    fn();
    console.log(`PASS ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}
console.log(`${passed}/${tests.length} Answer Evaluator tests passed`);
if (passed !== tests.length) process.exitCode = 1;
