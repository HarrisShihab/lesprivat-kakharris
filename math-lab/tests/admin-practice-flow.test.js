const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "math-lab-my-learning.html"), "utf8");
const ui = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");
const engine = fs.readFileSync(path.join(root, "math-lab/core/practice-session.js"), "utf8");

// Admin must expose the complete shared Practice interaction surface.
for (const id of [
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
  "math-lab-history-list",
]) {
  assert.match(html, new RegExp(`id=[\\\"]${id}[\\\"]`), `Missing admin Practice element: ${id}`);
}

// The learner UI is the single implementation of the Practice flow.
assert.match(ui, /questionCount: 10/);
assert.match(ui, /state\.manager\.createSession\(\{[\\s\\S]*ownerUid:/);
assert.match(ui, /state\.manager\.submitAnswer\(state\.sessionId, answer\)/);
assert.match(ui, /state\.manager\.next\(state\.sessionId\)/);
assert.match(ui, /state\.manager\.previous\(state\.sessionId\)/);
assert.match(ui, /state\.manager\.finalize\(state\.sessionId\)/);
assert.match(ui, /await state\.persistence\.saveResult\(result\)/);
assert.match(ui, /await loadHistory\(\)/);

// Navigation is intentionally gated until the current question is answered.
assert.match(ui, /direction === "next" && !item\.answered/);
assert.match(ui, /\$\("math-lab-next"\)\.disabled = item\.index >= item\.total - 1 \|\| !item\.answered/);

// Answer controls are locked after submission.
assert.match(ui, /input\.disabled = item\.answered/);
assert.match(ui, /\$\("math-lab-submit"\)\.disabled = item\.answered/);

// The engine itself must provide the generic lifecycle used by the shared UI.
assert.match(engine, /createSession/);
assert.match(engine, /submitAnswer/);
assert.match(engine, /next/);
assert.match(engine, /previous/);
assert.match(engine, /finalize/);

console.log("Admin shared Practice flow contract: PASS");
