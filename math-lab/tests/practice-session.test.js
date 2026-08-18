"use strict";

const assert = require("assert");
const path = require("path");
const root = path.resolve(__dirname, "..");

const questionSystem = require(path.join(root, "core/question-system/index.js"));
const algebraPractice = require(path.join(root, "content/pilot/algebra-practice.js"));
const evaluator = require(path.join(root, "core/answer-evaluator.js"));
const MathRenderer = require(path.join(root, "core/math-renderer/math-renderer.js"));
const practice = require(path.join(root, "core/practice-session.js"));

const pilot = questionSystem.createPilotProvider();
const renderer = MathRenderer.createRenderer({
  katex: {
    renderToString(source, options) {
      return `<span data-math="${options.displayMode ? "block" : "inline"}">${source}</span>`;
    },
  },
});

function createManager(overrides) {
  return practice.createManager({
    provider: pilot.provider,
    evaluations: pilot.evaluations,
    evaluator,
    renderer,
    questionPolicy: algebraPractice,
    ...(overrides || {}),
  });
}

function createSession(manager, overrides) {
  return manager.createSession({
    ownerUid: "uid-test",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    questionCount: 10,
    mix: { generated: 5, curated: 3, storyTemplate: 2 },
    random: () => 0.37,
    ...(overrides || {}),
  });
}

const tests = [];
function test(name, fn) { tests.push([name, fn]); }

test("creates a generic practice session with the pilot mix", () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  assert.strictEqual(snapshot.session.sessionType, "practice");
  assert.strictEqual(snapshot.session.status, "active");
  assert.strictEqual(snapshot.progress.totalQuestions, 10);
  assert.strictEqual(snapshot.progress.answeredCount, 0);
  assert.ok(snapshot.currentQuestion.question.questionId);
  const kinds = snapshot.session.questionRefs.map((questionId) => {
    const item = manager.getQuestion(snapshot.session.sessionId, snapshot.session.questionRefs.indexOf(questionId));
    return item.question.contentKind;
  });
  assert.deepStrictEqual(kinds.sort(), ["curated", "curated", "curated", "generated", "generated", "generated", "generated", "generated", "story-template", "story-template"].sort());
});

test("question presentation does not expose evaluation reference or fingerprint", () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  const question = snapshot.currentQuestion.question;
  assert.strictEqual(Object.prototype.hasOwnProperty.call(question, "evaluationRef"), false);
  assert.strictEqual(Object.prototype.hasOwnProperty.call(question, "fingerprint"), false);
});

test("navigation changes current question without changing answered state", () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  const sessionId = snapshot.session.sessionId;
  const first = manager.currentQuestion(sessionId);
  const second = manager.next(sessionId);
  assert.strictEqual(second.index, 1);
  assert.notStrictEqual(second.question.questionId, first.question.questionId);
  const back = manager.previous(sessionId);
  assert.strictEqual(back.index, 0);
  assert.strictEqual(back.answered, false);
});

test("valid answer is accepted and wrong answer is stored", () => {
  const manager = createManager();
  const snapshot = createSession(manager, {
    questionCount: 1,
    mix: { generated: 1, curated: 0, storyTemplate: 0 },
    generatorRequests: [{ generatorId: "algebra.like-terms", params: { a: 2, b: 5 } }],
  });
  const sessionId = snapshot.session.sessionId;
  const correct = manager.currentQuestion(sessionId).question.content.options[0].id;
  const submission = manager.submitAnswer(sessionId, correct);
  assert.strictEqual(submission.accepted, true);
  assert.strictEqual(submission.response.isCorrect, true);
  assert.strictEqual(manager.currentQuestion(sessionId).answered, true);
});

test("invalid answer does not consume the question", () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  const sessionId = snapshot.session.sessionId;
  const submission = manager.submitAnswer(sessionId, "not-an-option");
  assert.strictEqual(submission.accepted, false);
  assert.strictEqual(submission.reason, "INVALID_OPTION");
  assert.strictEqual(manager.currentQuestion(sessionId).answered, false);
});

test("duplicate submission is rejected after a valid answer", () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  const sessionId = snapshot.session.sessionId;
  const q = manager.currentQuestion(sessionId).question;
  const pilotQuestion = pilot.provider.findById(q.questionId);
  const evaluation = pilot.evaluations[pilotQuestion.evaluationRef];
  const correct = evaluation.specification.correctOptionId;
  assert.strictEqual(manager.submitAnswer(sessionId, correct).accepted, true);
  const duplicate = manager.submitAnswer(sessionId, correct);
  assert.strictEqual(duplicate.accepted, false);
  assert.strictEqual(duplicate.reason, "QUESTION_ALREADY_ANSWERED");
});

test("renderCurrent delegates math expressions to MathRenderer", async () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  const target = { innerHTML: "", textContent: "" };
  const rendered = await manager.renderCurrent(snapshot.session.sessionId, target);
  assert.ok(rendered.length >= 1);
  assert.ok(target.innerHTML.includes("data-math"));
});

test("renderCurrent supports multiple expression targets", async () => {
  const manager = createManager();
  const snapshot = createSession(manager, {
    questionCount: 1,
    mix: { generated: 1, curated: 0, storyTemplate: 0 },
    generatorRequests: [{ generatorId: "algebra.variable-value", params: { x: 7, add: 5 } }],
  });
  const targets = [
    { innerHTML: "", textContent: "" },
    { innerHTML: "", textContent: "" },
  ];
  const rendered = await manager.renderCurrent(snapshot.session.sessionId, targets);
  assert.strictEqual(rendered.length, 2);
  assert.ok(targets.every((target) => target.innerHTML.includes("data-math")));
});

test("session cannot finalize with unanswered questions", () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  assert.throws(() => manager.finalize(snapshot.session.sessionId), /unanswered/);
});

test("completion produces deterministic score and client-untrusted result", () => {
  const manager = createManager();
  const generatorRequests = [
    { generatorId: "algebra.variable-value", params: { x: 7, add: 5 } },
    { generatorId: "algebra.coefficient-identification", params: { coefficient: 6, constant: 4 } },
    { generatorId: "algebra.like-terms", params: { a: 2, b: 5 } },
    { generatorId: "algebra.linear-combination", params: { a: 3, b: 4, c: 2, d: 5 } },
    { generatorId: "algebra.plsv-addition", params: { x: 7, add: 5 } },
    { generatorId: "algebra.linear-subtraction", params: { a: 8, b: 3, c: 2 } },
    { generatorId: "algebra.distributive", params: { k: 3, a: 4, b: 2 } },
    { generatorId: "algebra.plsv-multiplication", params: { coefficient: 3, x: 6 } },
    { generatorId: "algebra.variable-difference", params: { x: 12, subtract: 5 } },
    { generatorId: "algebra.like-terms", params: { a: 3, b: 6 } },
  ];
  const snapshot = createSession(manager, {
    questionCount: 10,
    mix: { generated: 10, curated: 0, storyTemplate: 0 },
    generatorRequests,
  });
  const sessionId = snapshot.session.sessionId;
  const state = manager.getSession(sessionId);
  for (let index = 0; index < state.progress.totalQuestions; index += 1) {
    manager.goTo(sessionId, index);
    const q = manager.currentQuestion(sessionId).question;
    const answer = index < 8
      ? q.content.options[0].id
      : q.content.options[1].id;
    assert.strictEqual(manager.submitAnswer(sessionId, answer).accepted, true);
  }
  const result = manager.finalize(sessionId);
  assert.strictEqual(result.score, 80);
  assert.strictEqual(result.accuracy, 0.8);
  assert.strictEqual(result.correctCount, 8);
  assert.strictEqual(result.wrongCount, 2);
  assert.strictEqual(result.totalQuestions, 10);
  assert.strictEqual(result.trustStatus, "client-untrusted");
  assert.strictEqual(manager.getSession(sessionId).session.status, "completed");
});

test("finalize is idempotent", () => {
  const manager = createManager();
  const snapshot = createSession(manager, { questionCount: 1, mix: { generated: 1, curated: 0, storyTemplate: 0 }, generatorRequests: [{ generatorId: "algebra.like-terms", params: { a: 2, b: 5 } }] });
  const sessionId = snapshot.session.sessionId;
  const q = manager.currentQuestion(sessionId).question;
  assert.strictEqual(q.content.options[0].id, "opt-1");
  manager.submitAnswer(sessionId, q.content.options[0].id);
  const first = manager.finalize(sessionId);
  const second = manager.finalize(sessionId);
  assert.deepStrictEqual(second, first);
  assert.strictEqual(manager.getHistory("uid-test").length, 1);
});

test("abandonment prevents further navigation and answers", () => {
  const manager = createManager();
  const snapshot = createSession(manager);
  const sessionId = snapshot.session.sessionId;
  const abandoned = manager.abandon(sessionId);
  assert.strictEqual(abandoned.session.status, "abandoned");
  assert.throws(() => manager.next(sessionId), /abandoned|Completed session/);
  assert.throws(() => manager.submitAnswer(sessionId, "opt-1"), /Completed session/);
});

test("configuration rejects invalid mix and quantity", () => {
  assert.throws(() => createSession(createManager(), { questionCount: 3, mix: { generated: 2, curated: 2, storyTemplate: 0 } }), /mix total/);
  assert.throws(() => createSession(createManager(), { questionCount: 0, mix: { generated: 0, curated: 0, storyTemplate: 0 } }), /between 1 and 50/);
});

(async () => {
  let passed = 0;
  for (const [name, fn] of tests) {
    try {
      await fn();
      console.log(`PASS ${name}`);
      passed += 1;
    } catch (error) {
      console.error(`FAIL ${name}`);
      console.error(error.stack || error);
      process.exitCode = 1;
    }
  }
  console.log(`${passed}/${tests.length} Practice Session tests passed`);
  if (passed !== tests.length) process.exitCode = 1;
})();
