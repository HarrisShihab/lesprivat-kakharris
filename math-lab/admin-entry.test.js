const fs = require("fs");
const path = require("path");
const assert = require("assert");

const dashboard = fs.readFileSync(path.join(__dirname, "..", "dashboard.html"), "utf8");

assert.match(dashboard, /id="btn-math-lab"/, "Admin dashboard must expose the Math Lab entry button.");
assert.match(dashboard, /Belajar Saya/, "Math Lab entry must be labeled Belajar Saya.");
assert.match(dashboard, /math-lab-my-learning\.html/, "Admin Math Lab entry must target the My Learning page.");
assert.match(dashboard, /fa-calculator/, "Math Lab entry must use the Math Lab calculator icon.");

console.log("Admin Math Lab entry: PASS");
