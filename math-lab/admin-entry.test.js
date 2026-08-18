const fs = require("fs");
const path = require("path");
const assert = require("assert");

const entry = fs.readFileSync(path.join(__dirname, "admin-entry.js"), "utf8");
const learningPage = fs.readFileSync(path.join(__dirname, "..", "math-lab-my-learning.html"), "utf8");
const notifier = fs.readFileSync(path.join(__dirname, "..", "notifikasi.js"), "utf8");

assert.match(entry, /entry\.id = "btn-math-lab"/, "Admin entry must create the Math Lab navigation element.");
assert.match(entry, /entry\.href = "math-lab-my-learning\.html"/, "Admin entry must target My Learning.");
assert.match(entry, /Belajar Saya/, "Admin entry must be labeled Belajar Saya.");
assert.match(entry, /fa-calculator/, "Admin entry must use the Math Lab calculator icon.");
assert.match(entry, /dashboard-admin/, "Admin entry must be limited to the admin dashboard.");
assert.match(notifier, /math-lab\/admin-entry\.js/, "Admin dashboard must load the isolated Math Lab entry module.");

assert.match(learningPage, /<title>Belajar Saya — Math Lab<\/title>/, "My Learning page must have the expected title.");
assert.match(learningPage, /firebasePortal\.guard\(\["admin"\]\)/, "My Learning entry target must be admin-guarded.");
assert.match(learningPage, /id="learning-target"/, "My Learning shell must expose a learning target area.");
assert.match(learningPage, /id="learning-practice"/, "My Learning shell must expose a practice area.");
assert.match(learningPage, /id="learning-history"/, "My Learning shell must expose a history area.");
assert.match(learningPage, /Practice tersedia pada Step 4/, "Step 3 must not start Practice yet.");
assert.doesNotMatch(learningPage, /practiceSession|answerEvaluator|questionProvider|mathEvaluations/, "Step 3 shell must not instantiate or expose Practice internals.");

console.log("Admin Math Lab entry + My Learning shell: PASS");
