"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(repoRoot, "math-lab-public.html"), "utf8");
const script = fs.readFileSync(path.join(repoRoot, "math-lab-public.js"), "utf8");
const publicScript = fs.readFileSync(path.join(repoRoot, "public.js"), "utf8");

const questionSystem = require(path.join(repoRoot, "math-lab/core/question-system/index.js"));
const practiceSession = require(path.join(repoRoot, "math-lab/core/practice-session.js"));
const answerEvaluator = require(path.join(repoRoot, "math-lab/core/answer-evaluator.js"));
const MathRenderer = require(path.join(repoRoot, "math-lab/core/math-renderer/math-renderer.js"));
const contentPolicy = require(path.join(repoRoot, "math-lab/content/pilot/algebra-practice.js"));

function testPublicPageContract() {
  assert.match(html, /Coba 5 Soal Aljabar/);
  assert.match(html, /Tidak perlu login/);
  assert.match(html, /temporary|sementara/i);
  assert.match(html, /login[.]html[?]next=murid-dashboard[.]html/);
  assert.match(html, /math-lab-public[.]js/);
  assert.doesNotMatch(html, /practice-persistence[.]js/);
  assert.doesNotMatch(html, /firebase-config[.]js/);
}

function testPublicEntryPointContract() {
  assert.match(publicScript, /math-lab-public[.]html/);
  assert.match(publicScript, /Free Math Lab/);
  assert.match(publicScript, /Coba 5 Soal Gratis/);
  assert.match(publicScript, /public-nav/);
  assert.match(publicScript, /hero-actions/);
}

function testPublicScriptContract() {
  assert.match(script, /questionSystemReady/);
  assert.match(script, /ownerUid:\s*null/);
  assert.match(script, /questionCount:\s*5/);
  assert.match(script, /generated:\s*2,\s*curated:\s*2,\s*storyTemplate:\s*1/);
  assert.match(script, /Hasil ini hanya sementara dan tidak disimpan/);
  assert.doesNotMatch(script, /saveSession\(/);
  assert.doesNotMatch(script, /saveResult\(/);
  assert.doesNotMatch(script, /listHistory\(/);
}

function testAnonymousPracticeFlow() {
  const bundle = questionSystem.createPilotProvider();
  const renderer = MathRenderer.createRenderer({
    katex: {
      renderToString(source, options) {
        return `<span data-math="${options.displayMode ? "block" : "inline"}">${source}</span>`;
      },
    },
  });
  const manager = practiceSession.createManager({
    provider: bundle.provider,
    evaluations: bundle.evaluations,
    evaluator: answerEvaluator,
    renderer,
    questionPolicy: contentPolicy,
  });

  const snapshot = manager.createSession({
    ownerUid: null,
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    subtopicId: null,
    questionCount: 5,
    mix: { generated: 2, curated: 2, storyTemplate: 1 },
  });

  assert.strictEqual(snapshot.session.ownerUid, null);
  assert.strictEqual(snapshot.session.sessionType, "practice");
  assert.strictEqual(snapshot.session.questionRefs.length, 5);
  assert.strictEqual(snapshot.progress.totalQuestions, 5);

  for (let i = 0; i < 5; i += 1) {
    const item = manager.currentQuestion(snapshot.session.sessionId);
    assert.strictEqual(item.answered, false);
    const option = item.question.content?.options?.[0];
    const answer = option ? option.id : "0";
    const submission = manager.submitAnswer(snapshot.session.sessionId, answer);
    assert.strictEqual(submission.accepted, true);
    if (i < 4) manager.next(snapshot.session.sessionId);
  }

  const result = manager.finalize(snapshot.session.sessionId);
  assert.strictEqual(result.totalQuestions, 5);
  assert.strictEqual(typeof result.score, "number");
  assert.strictEqual(result.trustStatus, "client-untrusted");
}

const tests = [
  ["public-page-contract", testPublicPageContract],
  ["public-entry-point-contract", testPublicEntryPointContract],
  ["public-script-contract", testPublicScriptContract],
  ["anonymous-practice-flow", testAnonymousPracticeFlow],
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

console.log(`${passed}/${tests.length} public practice tests passed`);
if (passed !== tests.length) process.exitCode = 1;
