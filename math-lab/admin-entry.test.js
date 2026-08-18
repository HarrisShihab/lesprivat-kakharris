const fs = require("fs");
const path = require("path");
const assert = require("assert");

const entry = fs.readFileSync(path.join(__dirname, "admin-entry.js"), "utf8");
const learningPage = fs.readFileSync(path.join(__dirname, "..", "math-lab-my-learning.html"), "utf8");
const notifier = fs.readFileSync(path.join(__dirname, "..", "notifikasi.js"), "utf8");

assert.match(entry, /id = "btn-math-lab"/, "Admin entry must create the Math Lab navigation element.");
assert.match(entry, /href = "math-lab-my-learning\.html"/, "Admin entry must target My Learning.");
assert.match(entry, /Belajar Saya/, "Admin entry must be labeled Belajar Saya.");
assert.match(entry, /fa-calculator/, "Admin entry must use the Math Lab calculator icon.");
assert.match(entry, /dashboard-admin/, "Admin entry must be limited to the admin dashboard.");
assert.match(notifier, /math-lab\/admin-entry\.js/, "Admin dashboard must load the isolated Math Lab entry module.");
assert.match(learningPage, /firebasePortal\.guard\(\["admin"\]\)/, "My Learning entry target must be admin-guarded.");

console.log("Admin Math Lab entry: PASS");
