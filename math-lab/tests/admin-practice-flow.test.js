"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const ui = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");
const backend = fs.readFileSync(path.join(root, "functions/index.js"), "utf8");

assert.match(ui, /callTrusted\("startMathLabPractice"/);
assert.match(ui, /callTrusted\("evaluateMathLabAnswer"/);
assert.match(ui, /saveSession/);
assert.match(ui, /saveResult/);
assert.match(backend, /exports\.startMathLabPractice/);
assert.match(backend, /exports\.evaluateMathLabAnswer/);

console.log("Admin/Practice shared flow contract: trusted evaluation boundary PASS");
