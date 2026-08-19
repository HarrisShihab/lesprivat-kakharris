const assert = require('assert');
const persistence = require('../core/firestore/diagnostic-persistence.js');
const docs = new Map();
const collection = () => ({
  doc(id) { return { set: async d => docs.set(id, d), get: async () => ({ exists: docs.has(id), id, data: () => docs.get(id) }) }; },
  where() { return this; }, orderBy() { return this; }, limit() { return this; },
  get: async () => ({ docs: [...docs].map(([id, data]) => ({ id, data: () => data })) })
});
const firebase = { auth: () => ({ currentUser: { uid: 'u1' } }), firestore: () => ({ collection }) };
firebase.firestore.FieldValue = { serverTimestamp: () => ({ __serverTimestamp: true }) };
(async () => {
  const p = persistence.createPersistence({ firebase });
  const r = { resultId: 'd1', ownerUid: 'u1', educationLevel: 'SMP', grade: 7, topicId: 'aljabar', score: 75, accuracy: 75, correctCount: 9, wrongCount: 3, totalQuestions: 12, mastery: [], recommendations: [] };
  await p.saveResult(r);
  assert.strictEqual((await p.getResult('d1')).ownerUid, 'u1');
  assert.strictEqual((await p.listHistory()).length, 1);
  assert.throws(() => persistence.payload({ ...r, ownerUid: 'other' }, firebase, 'u1'));
  console.log('diagnostic persistence tests PASS');
})();
