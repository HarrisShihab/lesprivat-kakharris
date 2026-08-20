"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "math-lab-my-learning.html"), "utf8");
const adminEntry = fs.readFileSync(path.join(root, "math-lab/admin-entry.js"), "utf8");
const adminAdapter = fs.readFileSync(path.join(root, "math-lab/admin-math-lab.js"), "utf8");
const css = fs.readFileSync(path.join(root, "math-lab/ui/math-lab.css"), "utf8");

const requiredIds = [
  "math-lab-app",
  "math-lab-setup",
  "math-lab-level",
  "math-lab-grade",
  "math-lab-topic",
  "math-lab-subtopic",
  "math-lab-start",
  "math-lab-practice",
  "math-lab-question-number",
  "math-lab-progress-text",
  "math-lab-progress-bar",
  "math-lab-prompt",
  "math-lab-math",
  "math-lab-answer",
  "math-lab-feedback",
  "math-lab-prev",
  "math-lab-submit",
  "math-lab-next",
  "math-lab-finish",
  "math-lab-result",
  "math-lab-result-score",
  "math-lab-result-summary",
  "math-lab-new",
  "learning-history",
  "math-lab-refresh-history",
  "math-lab-history-list",
];

for (const id of requiredIds) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `Missing UI contract: ${id}`);
}

assert.doesNotMatch(html, /client-untrusted/i, "Admin UI must not expose architecture-only trust labels");
assert.doesNotMatch(html, /math-lab-result-trust/, "Admin UI must not require the internal trust badge");
assert.match(html, /math-lab\/ui\/student-math-lab\.js/);
assert.match(html, /math-lab\/admin-math-lab\.js/);
assert.match(html, /firebasePortal\.guard\(\["admin"\]\)/);
assert.match(html, /viewport.*width=device-width/);
assert.match(html, /math-lab-setup[\s\S]*math-lab-start/);
assert.match(html, /math-lab-practice[\s\S]*math-lab-finish/);
assert.match(html, /math-lab-result[\s\S]*math-lab-new/);
assert.match(html, /learning-history[\s\S]*math-lab-history-list/);

assert.match(adminEntry, /dashboard-admin/);
assert.match(adminEntry, /btn-math-lab/);
assert.match(adminEntry, /math-lab-my-learning\.html/);
assert.doesNotMatch(adminEntry, /mathEvaluations|correctAnswer|answerEvaluator/);

assert.match(adminAdapter, /studentUI\.init/);
assert.match(adminAdapter, /profile\.role !== "admin"/);
assert.doesNotMatch(adminAdapter, /correctAnswer|evaluationRef|mathEvaluations/);

assert.doesNotMatch(css, /TEMPORARY FIRESTORE DEBUG|math-lab-debug/);
assert.match(css, /@media\(max-width:640px\)/);

console.log(`Admin UI audit contract: ${requiredIds.length} required IDs + responsive/security checks PASS`);
