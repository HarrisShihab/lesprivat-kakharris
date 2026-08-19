"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const ui = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");

assert.match(ui, /client-untrusted/);
assert.match(ui, /saveResult/);
assert.match(ui, /listHistory/);
assert.doesNotMatch(ui, /correctOptionId|evaluation\.specification/);

console.log("Admin result/history contract: client-untrusted persistence PASS");
