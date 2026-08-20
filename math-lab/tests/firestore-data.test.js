const assert = require('assert');
const persistence = require('../core/firestore/practice-persistence.js');

function createFakeFirestore(initial = {}) {
  const docs = new Map(Object.entries(initial));
  const stats = { get: {}, set: {}, update: {} };
  function ref(path) {
    return {
      id: path.split('/').pop(),
      async get() {
        const collectionName = path.split('/')[0];
        stats.get[collectionName] = (stats.get[collectionName] || 0) + 1;
        const data = docs.get(path);
        return { exists: Boolean(data), id: path.split('/').pop(), data: () => data && JSON.parse(JSON.stringify(data)) };
      },
      async set(data) {
        const collectionName = path.split('/')[0];
        stats.set[collectionName] = (stats.set[collectionName] || 0) + 1;
        docs.set(path, JSON.parse(JSON.stringify(data)));
      },
      async update(data) {
        const collectionName = path.split('/')[0];
        stats.update[collectionName] = (stats.update[collectionName] || 0) + 1;
        if (!docs.has(path)) throw new Error('missing document');
        docs.set(path, { ...docs.get(path), ...JSON.parse(JSON.stringify(data)) });
      },
    };
  }
  function collection(name) {
    return {
      doc(id) { return ref(`${name}/${id}`); },
      where(field, op, value) {
        const chain = { _filters: [[field, op, value]], _order: null, _limit: null };
        chain.orderBy = (field, direction) => { chain._order = [field, direction]; return chain; };
        chain.limit = (value) => { chain._limit = value; return chain; };
        chain.get = async () => {
          let rows = [...docs.entries()].filter(([key]) => key.startsWith(`${name}/`)).map(([key, data]) => ({ id: key.split('/').pop(), data }));
          for (const [f, o, v] of chain._filters) rows = rows.filter((row) => o === '==' && row.data[f] === v);
          if (chain._order) {
            const [f, direction] = chain._order;
            rows.sort((a, b) => String(a.data[f] || '').localeCompare(String(b.data[f] || '')) * (direction === 'desc' ? -1 : 1));
          }
          if (chain._limit) rows = rows.slice(0, chain._limit);
          return { docs: rows.map((row) => ({ id: row.id, data: () => JSON.parse(JSON.stringify(row.data)) })) };
        };
        return chain;
      },
    };
  }
  return { collection, _docs: docs, _stats: () => JSON.parse(JSON.stringify(stats)), Timestamp: { fromMillis: (value) => ({ toMillis: () => value }) }, FieldValue: { serverTimestamp: () => ({ __serverTimestamp: true }) } };
}

function fakeFirebase(uid, profile, db) {
  function firestore() { return db; }
  firestore.Timestamp = db.Timestamp;
  firestore.FieldValue = db.FieldValue;
  return {
    auth: () => ({ currentUser: uid ? { uid } : null }),
    firestore,
  };
}

(async () => {
  const db = createFakeFirestore({ [`users/u1`]: { aktif: true, role: 'murid' } });
  const fb = fakeFirebase('u1', null, db);
  const debugLogs = [];
  const store = persistence.createPersistence({ firebase: fb, db, debug: (entry) => debugLogs.push(entry) });

  const snapshot = {
    session: {
      contractVersion: '1.0', sessionId: 's1', ownerUid: 'u1', sessionType: 'practice',
      educationLevel: 'SMP', grade: 7, phase: 'D', subject: 'matematika', topicId: 'aljabar',
      subtopicId: null, questionRefs: ['q1'], questionVersions: { q1: '1.0' },
      currentIndex: 0, status: 'active', startedAt: 1000, finishedAt: null,
    },
  };
  const response = [{ questionId: 'q1', questionVersion: '1.0', answer: 'A', isCorrect: true, evaluationCode: 'CORRECT', misconceptionCode: null, answeredAt: 1100 }];

  const getsBeforeCreate = db._stats().get.mathSessions || 0;
  await store.saveSession(snapshot, response, 'create');
  assert.equal(db._stats().get.mathSessions || 0, getsBeforeCreate, 'new session create must not pre-read the session document');
  assert.equal(db._stats().set.mathSessions, 1);
  assert.equal(db._docs.get('mathSessions/s1').ownerUid, 'u1');
  assert.equal(db._docs.get('mathSessions/s1').trustStatus, 'client-untrusted');
  assert.equal(db._docs.get('mathSessions/s1').responses[0].answer, 'A');
  assert.equal(Object.hasOwn(db._docs.get('mathSessions/s1'), 'evaluation'), false);
  assert.equal(Object.hasOwn(db._docs.get('mathSessions/s1'), 'correctAnswer'), false);
  assert.equal(Object.hasOwn(db._docs.get('mathSessions/s1'), 'evaluationRef'), false);
  assert.equal(debugLogs.some((entry) => entry.path === 'users/u1' && entry.operation === 'GET' && entry.status === 'OK'), true);
  assert.equal(debugLogs.some((entry) => entry.path === 'mathSessions/s1' && entry.operation === 'SET' && entry.status === 'OK'), true);
  const createLog = debugLogs.find((entry) => entry.path === 'mathSessions/s1' && entry.operation === 'SET');
  assert.deepEqual(createLog.meta, {
    documentId: 's1', authUid: 'u1', role: 'murid', aktif: true, mathLabUser: true,
    ownerUidPresent: true, ownerUidMatchesAuth: true, sessionIdMatchesPath: true,
    sessionType: 'practice', trustStatus: 'client-untrusted',
    topLevelKeys: ['contractVersion', 'createdAt', 'currentIndex', 'educationLevel', 'finishedAt', 'grade', 'ownerUid', 'phase', 'questionRefs', 'questionVersions', 'responses', 'sessionId', 'sessionType', 'startedAt', 'status', 'subject', 'subtopicId', 'topicId', 'trustStatus', 'updatedAt'],
  });
  assert.equal(debugLogs.some((entry) => entry.path === 'mathSessions/s1' && entry.operation === 'GET' && entry.stage === 'create session'), false, 'new session create must not log a pre-read');

  const getsBeforeUpdate = db._stats().get.mathSessions || 0;
  await store.saveSession({ session: { ...snapshot.session, currentIndex: 1, status: 'completed', finishedAt: 2000 } }, response);
  assert.equal(db._stats().get.mathSessions, getsBeforeUpdate + 1, 'existing session update must verify ownership with a read');
  assert.equal(db._stats().update.mathSessions, 1);
  assert.equal(db._docs.get('mathSessions/s1').currentIndex, 1);

  await store.saveResult({
    resultId: 'r1', sessionId: 's1', ownerUid: 'u1', sessionType: 'practice', educationLevel: 'SMP',
    grade: 7, phase: 'D', subject: 'matematika', topicId: 'aljabar', score: 100, accuracy: 1,
    correctCount: 1, wrongCount: 0, totalQuestions: 1, duration: 1000, questionVersions: { q1: '1.0' },
    responses: response, diagnosticSummary: null, mastery: null, recommendations: [], createdAt: 2000,
  });
  assert.equal(db._docs.get('mathResults/r1').trustStatus, 'client-untrusted');
  assert.equal((await store.listHistory()).length, 1);
  assert.equal(db._docs.get('mathResults/r1').trustStatus, 'client-untrusted');
  const historyLog = debugLogs.find((entry) => entry.path === 'mathResults' && entry.operation === 'LIST');
  assert.deepEqual(historyLog.meta, { authUid: 'u1', role: 'murid', limit: 5 });

  const other = fakeFirebase('u2', null, db);
  db._docs.set('users/u2', { aktif: true, role: 'murid' });
  const otherStore = persistence.createPersistence({ firebase: other, db });
  assert.rejects(() => otherStore.getSession('s1'), /bukan milik pengguna aktif/);
  const deniedLogs = [];
  const deniedStore = persistence.createPersistence({ firebase: other, db, debug: (entry) => deniedLogs.push(entry) });
  await assert.rejects(() => deniedStore.getSession('s1'), /bukan milik pengguna aktif/);
  assert.equal(deniedLogs.some((entry) => entry.path === 'mathSessions/s1' && entry.operation === 'GET' && entry.status === 'OK'), true);
  assert.rejects(() => otherStore.getResult('r1'), /bukan milik pengguna aktif/);

  const anonymous = fakeFirebase(null, null, db);
  const anonymousStore = persistence.createPersistence({ firebase: anonymous, db });
  assert.rejects(() => anonymousStore.listHistory(), /Sesi login tidak aktif/);

  db._docs.set('users/u3', { aktif: true, role: 'orangtua' });
  const parentStore = persistence.createPersistence({ firebase: fakeFirebase('u3', null, db), db });
  assert.rejects(() => parentStore.listHistory(), /Role tidak diizinkan/);

  await assert.rejects(() => store.saveResult({
    resultId: 'r2', sessionId: 's1', ownerUid: 'u2', sessionType: 'practice', educationLevel: 'SMP',
    grade: 7, phase: 'D', subject: 'matematika', topicId: 'aljabar', score: 100, accuracy: 1,
    correctCount: 1, wrongCount: 0, totalQuestions: 1, duration: 1000, questionVersions: { q1: '1.0' },
    responses: response, diagnosticSummary: null, mastery: null, recommendations: [], createdAt: 2000,
  }), /bukan milik pengguna aktif/);

  console.log('Firestore data layer tests: 11/11 passed');
  console.log('Firestore debug instrumentation tests: PASS');
})();
