const assert = require('assert');
const persistence = require('../core/firestore/diagnostic-persistence.js');

function fakeFirebase() {
  const docs = new Map();
  const fb = {
    auth: () => ({ currentUser: { uid: 'u1' } }),
    firestore: Object.assign(() => ({ collection: () => ({}) }), {
      FieldValue: { serverTimestamp: () => ({ __serverTimestamp: true }) }
    })
  };
  function collection() {
    return {
      doc(id) {
        return {
          async set(data) { docs.set(id, data); },
          async get() { const data = docs.get(id); return { exists: Boolean(data), id, data: () => data }; }
        };
      },
      where() { return this; },
      orderBy() { return this; },
      limit() { return this; },
      async get() { return { docs: [...docs].map(([id, data]) => ({ id, data: () => data })) }; }
    };
  }
  fb.firestore = () => ({ collection });
  return fb;
}

(async () => {
  const fb = fakeFirebase();
  const p = persistence.createPersistence({ firebase: fb });
  const result = {
    resultId: 'diag-1', ownerUid: 'u1', sessionId: 'sess-1', educationLevel: 'SMP', grade: 7,
    topicId: 'aljabar', score: 75, accuracy: 75, correctCount: 9, wrongCount: 3, totalQuestions: 12,
    mastery: [{ indicator: 'concept', percentage: 80, status: 'mastered' }],
    recommendations: [{ indicator: 'concept', action: 'maintain_indicator', priority: 'low' }]
  };
  const saved = await p.saveResult(result);
  assert.strictEqual(saved.resultId, 'diag-1');
  assert.strictEqual((await p.getResult('diag-1')).ownerUid, 'u1');
  assert.strictEqual((await p.listHistory(10)).length, 1);
  assert.throws(() => persistence.payload({ ...result, ownerUid: 'other' }, fb, 'u1'));
  console.log('diagnostic persistence tests PASS');
})();
