"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const rules = fs.readFileSync(path.join(root, "firestore.rules"), "utf8");
const publicEntry = fs.readFileSync(path.join(root, "math-lab-public.js"), "utf8");
const browserEntry = fs.readFileSync(path.join(root, "math-lab/core/question-system/browser.js"), "utf8");
const studentUi = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");
const trustedBackend = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");
const trustedPilot = fs.readFileSync(path.join(root, "functions/math-lab-pilot.js"), "utf8");

function pass(name) { console.log(`PASS ${name}`); }

assert.match(rules, /mathEvaluations/);
assert.match(rules, /mathMastery/);
assert.match(rules, /mathTaxonomy/);
assert.ok((rules.match(/allow read, write: if false;/g) || []).length >= 3);
pass("firestore-private-evaluation-collections-closed");

assert.match(publicEntry, /ownerUid:\s*null/);
assert.doesNotMatch(publicEntry, /saveSession|saveResult|listHistory/);
pass("public-entry-no-persistence");

assert.match(rules, /ownerUid\s*==\s*request\.auth\.uid/);
pass("persistence-authenticated-owner-bound");

assert.doesNotMatch(browserEntry, /algebra-curated\.js|generators\.js|story-templates\.js/);
assert.match(studentUi, /callTrusted\("startMathLabPractice"/);
assert.match(studentUi, /callTrusted\("evaluateMathLabAnswer"/);
pass("authenticated-client-excludes-evaluation-bearing-question-system");

assert.doesNotMatch(trustedBackend, /return[^;]*(correctOptionId|specification)/s);
assert.match(trustedBackend, /session\.ownerUid\s*!==\s*uid/);
assert.match(trustedPilot, /correctOptionId/);
pass("trusted-boundary-keeps-evaluation-server-side");

console.log("Phase 11A security contract: 5/5 passed");
