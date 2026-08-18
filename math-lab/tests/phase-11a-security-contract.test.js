"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "../..");
const mathLabRoot = path.join(repoRoot, "math-lab");

const rules = fs.readFileSync(path.join(repoRoot, "firestore.rules"), "utf8");
const publicHtml = fs.readFileSync(path.join(repoRoot, "math-lab-public.html"), "utf8");
const studentHtml = fs.readFileSync(path.join(repoRoot, "math-lab-my-learning.html"), "utf8");
const publicScript = fs.readFileSync(path.join(repoRoot, "math-lab-public.js"), "utf8");
const browserEntry = fs.readFileSync(path.join(mathLabRoot, "core/question-system/browser.js"), "utf8");
const curatedSource = fs.readFileSync(path.join(mathLabRoot, "content/pilot/algebra-curated.js"), "utf8");
const providerSource = fs.readFileSync(path.join(mathLabRoot, "core/question-system/provider.js"), "utf8");
const persistenceSource = fs.readFileSync(path.join(mathLabRoot, "core/firestore/practice-persistence.js"), "utf8");
const questionSystemSource = fs.readFileSync(path.join(mathLabRoot, "core/question-system/index.js"), "utf8");

function testFirestorePrivateCollectionsRemainClosed() {
  assert.match(rules, /match \/mathEvaluations\/\{docId\} \{\s*allow read, write: if false;/);
  assert.match(rules, /match \/mathMastery\/\{docId\} \{\s*allow read, write: if false;/);
  assert.match(rules, /match \/mathTaxonomy\/\{docId\} \{\s*allow read, write: if false;/);
}

function testPublicEntryHasNoPersistenceBoundary() {
  assert.doesNotMatch(publicHtml, /practice-persistence\.js/);
  assert.doesNotMatch(publicHtml, /firebase-config\.js/);
  assert.doesNotMatch(publicScript, /saveSession\(/);
  assert.doesNotMatch(publicScript, /saveResult\(/);
  assert.doesNotMatch(publicScript, /listHistory\(/);
}

function testPersistenceRequiresAuthenticatedOwner() {
  assert.match(persistenceSource, /function getCurrentUser\(/);
  assert.match(persistenceSource, /if \(!user \|\| !user\.uid\) throw new Error\("Sesi login tidak aktif\."\)/);
  assert.match(persistenceSource, /assertOwner\(payload, user\.uid\)/);
  assert.match(persistenceSource, /where\("ownerUid", "==", user\.uid\)/);
  assert.match(persistenceSource, /trustStatus: "client-untrusted"/);
}

function testClientMustNotReceiveEvaluationSpecification() {
  // Phase 11A contract: presentation code loaded by browser pages must not carry
  // answer keys/evaluation specifications. Current main is expected to fail this
  // baseline test until Phase 11B/11C moves the evaluation boundary.
  assert.doesNotMatch(browserEntry, /algebra-curated\.js/);
  assert.doesNotMatch(browserEntry, /generators\.js/);
  assert.doesNotMatch(browserEntry, /story-templates\.js/);

  assert.doesNotMatch(publicHtml, /core\/answer-evaluator\.js/);
  assert.doesNotMatch(studentHtml, /core\/answer-evaluator\.js/);

  assert.doesNotMatch(curatedSource, /correctOptionIndex|correctOptionId|evaluationId|evaluation\s*=|specification/);
  assert.doesNotMatch(providerSource, /const evaluations = value\.evaluations/);
  assert.doesNotMatch(questionSystemSource, /const evaluations = curated\.records\.reduce/);
}

function testPublicQuestionContractDoesNotExposeEvaluationRef() {
  assert.match(fs.readFileSync(path.join(mathLabRoot, "core/practice-session.js"), "utf8"), /delete copy\.evaluationRef/);
}

const tests = [
  ["firestore-private-collections-closed", testFirestorePrivateCollectionsRemainClosed],
  ["public-entry-no-persistence", testPublicEntryHasNoPersistenceBoundary],
  ["persistence-authenticated-owner-bound", testPersistenceRequiresAuthenticatedOwner],
  ["client-evaluation-specification-hidden", testClientMustNotReceiveEvaluationSpecification],
  ["public-question-hides-evaluation-ref", testPublicQuestionContractDoesNotExposeEvaluationRef],
];

let passed = 0;
for (const [name, test] of tests) {
  try {
    test();
    console.log(`PASS ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.message || error);
    process.exitCode = 1;
  }
}

console.log(`Phase 11A security contract: ${passed}/${tests.length} passed`);
if (passed !== tests.length) process.exitCode = 1;
