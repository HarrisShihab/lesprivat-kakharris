"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "murid-dashboard.html"), "utf8");
const portal = fs.readFileSync(path.join(root, "portal-dashboard.js"), "utf8");
const css = fs.readFileSync(path.join(root, "math-lab/ui/math-lab.css"), "utf8");
const ui = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");

const requiredIds = [
  "view-math-lab", "math-lab-setup", "math-lab-level", "math-lab-grade",
  "math-lab-topic", "math-lab-subtopic", "math-lab-start", "math-lab-practice",
  "math-lab-prompt", "math-lab-math", "math-lab-answer", "math-lab-submit",
  "math-lab-prev", "math-lab-next", "math-lab-finish", "math-lab-result",
  "math-lab-history-list", "math-lab-refresh-history",
];

for (const id of requiredIds) assert.ok(html.includes(`id="${id}"`), `Missing UI id: ${id}`);
assert.ok(html.includes('data-view-target="math-lab"'), "Math Lab dashboard entry missing");
assert.ok(html.includes('href="math-lab/ui/math-lab.css"'), "Math Lab CSS not integrated");
assert.ok(html.includes('src="math-lab/ui/student-math-lab.js"'), "Math Lab UI module not loaded");
assert.ok(portal.includes('"math-lab": "Math Lab"'), "Portal page title integration missing");
assert.ok(portal.includes('studentUI?.init'), "Portal-to-Math-Lab initialization integration missing");
assert.ok(!html.includes("XP"), "Gamification text must not be introduced into student UI");
assert.ok(!html.includes("Leaderboard"), "Leaderboard must not be introduced into student UI");
assert.ok(css.length > 1000, "Math Lab responsive CSS appears incomplete");
assert.ok(ui.includes("client-untrusted"), "Client-untrusted result status must remain visible");
assert.ok(ui.includes("MathRenderer"), "MathRenderer integration missing");
assert.ok(ui.includes("saveSession") && ui.includes("saveResult"), "Firestore persistence integration missing");

console.log(`PASS student-ui-static (${requiredIds.length} required IDs)`);
