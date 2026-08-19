const assert = require('assert');
const LABELS = { concept: 'Konsep', problem_solving: 'Pemecahan masalah', procedure: 'Prosedur', representation: 'Representasi' };
const ACTIONS = { maintain_indicator: 'Pertahankan kemampuan', practice_indicator: 'Perlu latihan tambahan', review_indicator: 'Perlu mengulang materi' };
function humanRecommendation(item) { return `${LABELS[item.indicator] || item.indicator} — ${ACTIONS[item.action] || 'Lanjutkan latihan'}`; }
assert.strictEqual(humanRecommendation({ indicator: 'concept', action: 'maintain_indicator' }), 'Konsep — Pertahankan kemampuan');
assert.strictEqual(humanRecommendation({ indicator: 'problem_solving', action: 'practice_indicator' }), 'Pemecahan masalah — Perlu latihan tambahan');
assert.strictEqual(humanRecommendation({ indicator: 'representation', action: 'review_indicator' }), 'Representasi — Perlu mengulang materi');
console.log('diagnostic presentation contract PASS');
