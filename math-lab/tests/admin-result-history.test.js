const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const uiPath = path.join(root, 'ui', 'student-math-lab.js');
const persistencePath = path.join(root, 'core', 'firestore', 'practice-persistence.js');
const htmlPath = path.join(root, '..', 'math-lab-my-learning.html');
const ui = fs.readFileSync(uiPath, 'utf8');
const persistence = fs.readFileSync(persistencePath, 'utf8');
const html = fs.readFileSync(htmlPath, 'utf8');

assert.match(ui, /state\.manager\.finalize\(state\.sessionId\)/);
assert.match(ui, /state\.persistence\.saveResult\(result\)/);
assert.match(ui, /await loadHistory\(\)/);
assert.match(ui, /state\.persistence\.listHistory\(20\)/);
assert.match(ui, /result\.score/);
assert.match(ui, /result\.correctCount/);
assert.match(ui, /result\.totalQuestions/);
assert.match(ui, /client-untrusted/);
assert.match(ui, /item\.ownerUid/);
assert.match(ui, /escapeHtml\(item\.score\)/);
assert.match(ui, /escapeHtml\(item\.createdAt\)/);

assert.match(persistence, /const ALLOWED_ROLES = Object\.freeze\(\["murid", "admin"\]\)/);
assert.match(persistence, /async function saveResult\(result\)/);
assert.match(persistence, /assertOwner\(payload, user\.uid\)/);
assert.match(persistence, /where\("ownerUid", "==", user\.uid\)/);
assert.match(persistence, /orderBy\("createdAt", "desc"\)/);
assert.match(persistence, /trustStatus: "client-untrusted"/);
assert.match(persistence, /if \(String\(data\.ownerUid\) !== String\(user\.uid\)\) throw new Error\("Result bukan milik pengguna aktif\."\)/);

assert.match(html, /id="math-lab-result"/);
assert.match(html, /id="math-lab-result-score"/);
assert.match(html, /id="math-lab-result-summary"/);
assert.match(html, /id="math-lab-result-trust"/);
assert.match(html, /id="learning-history"/);
assert.match(html, /id="math-lab-history-list"/);
assert.match(html, /id="math-lab-refresh-history"/);

console.log('Admin result/history contract: PASS');
console.log('Admin result/history owner-boundary contract: PASS');
