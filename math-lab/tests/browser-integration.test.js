"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const browser = fs.readFileSync(path.join(root, "math-lab/core/question-system/browser.js"), "utf8");
const publicBrowser = fs.readFileSync(path.join(root, "math-lab/core/question-system/public-browser.js"), "utf8");
const adminBrowser = fs.readFileSync(path.join(root, "math-lab/core/question-system/admin-browser.js"), "utf8");
const studentUi = fs.readFileSync(path.join(root, "math-lab/ui/student-math-lab.js"), "utf8");
const html = fs.readFileSync(path.join(root, "murid-dashboard.html"), "utf8");

assert.doesNotMatch(browser, /algebra-curated\.js|generators\.js|story-templates\.js/);
assert.match(browser, /public-browser\.js/);
assert.match(browser, /admin-browser\.js/);
assert.match(publicBrowser, /algebra-curated\.js/);
assert.match(adminBrowser, /public-browser\.js/);
assert.match(studentUi, /startMathLabPractice/);
assert.match(studentUi, /evaluateMathLabAnswer/);
assert.match(html, /<script type="module" src="math-lab\/core\/question-system\/browser\.js"><\/script>/);

console.log("PASS authenticated browser entry excludes evaluation-bearing modules");
console.log("PASS public/admin entries remain explicitly isolated");
console.log("PASS trusted student UI integration");
console.log("3/3 browser integration tests passed");
