const assert = require('assert');

function humanRecommendation(item) {
  const labels = { concept: 'Konsep', problem_solving: 'Pemecahan masalah', procedure: 'Prosedur', representation: 'Representasi' };
  const actions = { maintain_indicator: 'Pertahankan kemampuan', practice_indicator: 'Perlu latihan tambahan', review_indicator: 'Perlu mengulang materi' };
  return `${labels[item.indicator] || item.indicator} — ${actions[item.action] || 'Lanjutkan latihan'}`;
}

assert.strictEqual(humanRecommendation({ indicator: 'concept', action: 'maintain_indicator' }), 'Konsep — Pertahankan kemampuan');
assert.strictEqual(humanRecommendation({ indicator: 'problem_solving', action: 'practice_indicator' }), 'Pemecahan masalah — Perlu latihan tambahan');
console.log('diagnostic presentation contract PASS');
