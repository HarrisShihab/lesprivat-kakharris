"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "../ui/diagnostic-student-presentation.js"), "utf8");

assert.ok(source.includes("review_indicator"), "Review action mapping missing");
assert.ok(source.includes("practice_indicator"), "Practice action mapping missing");
assert.ok(source.includes("maintain_indicator"), "Maintain action mapping missing");
assert.ok(source.includes("Perlu mengulang dan memperkuat indikator ini sebelum lanjut."), "Human review text missing");
assert.ok(source.includes("Perbanyak latihan pada indikator ini agar pemahaman semakin kuat."), "Human practice text missing");
assert.ok(source.includes("Pertahankan kemampuan ini dengan latihan berkala."), "Human maintain text missing");
assert.ok(source.includes("client-untrusted"), "Internal trust marker must remain detectable for removal from UI");
assert.ok(source.includes("element.remove()"), "Trust marker removal is not implemented");
assert.ok(source.includes("concept: \"Konsep\""), "Human indicator label missing");
assert.ok(source.includes("problem_solving: \"Pemecahan masalah\""), "Human problem-solving label missing");

console.log("diagnostic-student-presentation: PASS");
