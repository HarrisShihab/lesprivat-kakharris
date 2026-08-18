(function () {
  "use strict";

  const fs = require("fs");
  const assert = require("assert");
  const path = require("path");

  const root = path.resolve(__dirname, "..");
  const uiPath = path.join(root, "student-math-lab.js");
  const htmlPath = path.join(root, "..", "math-lab-my-learning.html");
  const source = fs.readFileSync(uiPath, "utf8");
  const html = fs.readFileSync(htmlPath, "utf8");

  assert.match(source, /createManager\(\)/);
  assert.match(source, /state\.manager\.createSession\(\{[\s\S]*ownerUid:/);
  assert.match(source, /state\.manager\.submitAnswer\(state\.sessionId, answer\)/);
  assert.match(source, /state\.manager\.next\(state\.sessionId\)/);
  assert.match(source, /state\.manager\.previous\(state\.sessionId\)/);
  assert.match(source, /state\.manager\.finalize\(state\.sessionId\)/);
  assert.match(source, /state\.persistence\.saveResult\(result\)/);
  assert.match(source, /state\.persistence\.listHistory\(20\)/);

  assert.match(source, /questionCount:\s*10/);
  assert.match(source, /item\.answered/);
  assert.match(source, /!item\.answered/);
  assert.match(source, /input\.disabled = item\.answered/);

  assert.match(html, /id="math-lab-start"/);
  assert.match(html, /id="math-lab-submit"/);
  assert.match(html, /id="math-lab-prev"/);
  assert.match(html, /id="math-lab-next"/);
  assert.match(html, /id="math-lab-finish"/);
  assert.match(html, /student-math-lab\.js/);

  console.log("Admin practice flow contract: PASS");
})();
