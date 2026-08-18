const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const html = fs.readFileSync(path.join(root, "math-lab-my-learning.html"), "utf8");
const adapter = fs.readFileSync(path.join(root, "math-lab/admin-math-lab.js"), "utf8");

assert.match(html, /math-lab\/core\/question-system\/browser\.js/);
assert.match(html, /math-lab\/core\/practice-session\.js/);
assert.match(html, /math-lab\/core\/answer-evaluator\.js/);
assert.match(html, /math-lab\/core\/firestore\/practice-persistence\.js/);
assert.match(html, /math-lab\/ui\/student-math-lab\.js/);
assert.match(html, /math-lab\/admin-math-lab\.js/);
assert.ok(html.indexOf("math-lab/ui/student-math-lab.js") < html.indexOf("math-lab/admin-math-lab.js"));

assert.match(adapter, /questionSystemReady/);
assert.match(adapter, /studentUI\?\.init/);
assert.match(adapter, /collection\("users"\)/);
assert.match(adapter, /profile\.role !== "admin"/);
assert.match(adapter, /educationLevel: "SMP"/);
assert.match(adapter, /grade: "7"/);
assert.match(adapter, /topicId: "aljabar"/);

assert.doesNotMatch(adapter, /adminPracticeEngine/);
assert.doesNotMatch(adapter, /answerEvaluator/);
assert.doesNotMatch(adapter, /correctAnswer/);
assert.doesNotMatch(adapter, /evaluationRef/);

console.log("Admin Math Lab shared-engine contract: PASS");
