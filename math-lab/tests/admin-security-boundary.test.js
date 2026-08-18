const assert = require("assert");
const fs = require("fs");
const path = require("path");
const persistence = require("../core/firestore/practice-persistence.js");
const evaluatorApi = require("../core/answer-evaluator.js");

const root = path.resolve(__dirname, "..");
const rules = fs.readFileSync(path.join(root, "..", "firestore.rules"), "utf8");
const adminAdapter = fs.readFileSync(path.join(root, "admin-math-lab.js"), "utf8");
const adminHtml = fs.readFileSync(path.join(root, "..", "math-lab-my-learning.html"), "utf8");
const evaluator = fs.readFileSync(path.join(root, "core", "answer-evaluator.js"), "utf8");
const persistenceSource = fs.readFileSync(path.join(root, "core", "firestore", "practice-persistence.js"), "utf8");

// Firestore Rules: Math Lab is available to admin, but every session/result is owner-bound.
assert.match(rules, /function mathLabUser\(\)\s*\{[\s\S]*?myUser\(\)\.role in \[\"murid\", \"admin\"\]/);
assert.match(rules, /match \/mathSessions\/\{sessionId\} \{[\s\S]*allow get, list: if mathLabUser\(\) && resource\.data\.ownerUid == request\.auth\.uid;/);
assert.match(rules, /allow create: if mathLabUser\(\)[\s\S]*ownsMathLabCreate\(\)/);
assert.match(rules, /allow update: if ownsMathLabDocument\(\)/);
assert.match(rules, /match \/mathResults\/\{resultId\} \{[\s\S]*allow get, list: if mathLabUser\(\) && resource\.data\.ownerUid == request\.auth\.uid;/);
assert.match(rules, /allow create: if mathLabUser\(\)[\s\S]*ownsMathLabCreate\(\)/);
assert.match(rules, /allow update, delete: if false;/);
assert.match(rules, /match \/mathEvaluations\/\{docId\} \{\s*allow read, write: if false;/);
assert.match(rules, /match \/mathMastery\/\{docId\} \{\s*allow read, write: if false;/);

// Admin adapter must authenticate the admin profile and delegate to shared learner UI.
assert.match(adminAdapter, /profile\.role !== "admin"/);
assert.match(adminAdapter, /studentUI\.init\(\{ profile, questionSystem \}\)/);
assert.doesNotMatch(adminAdapter, /correctAnswer|evaluationRef|mathEvaluations|evaluationSpec|specification/);

// Admin page may load the public evaluator, but the page/adapter must not embed evaluator secrets.
assert.doesNotMatch(adminHtml, /correctAnswer|evaluationRef|mathEvaluations|evaluationSpec/);
assert.match(evaluator, /function publicResult\(evaluationResult\)/);
const publicResult = evaluatorApi.publicResult({
  isCorrect: true,
  evaluationCode: "CORRECT",
  misconceptionCode: null,
  correctAnswer: "SECRET",
});
assert.deepStrictEqual(Object.keys(publicResult).sort(), ["evaluationCode", "isCorrect", "misconceptionCode", "outcome"].sort());
assert.strictEqual(Object.prototype.hasOwnProperty.call(publicResult, "correctAnswer"), false);

// Persistence explicitly permits admin and enforces ownerUid before reads/writes.
assert.match(persistenceSource, /ALLOWED_ROLES = Object\.freeze\(\[\"murid\", \"admin\"\]\)/);
assert.match(persistenceSource, /assertOwner\(payload, user\.uid\)/);
assert.match(persistenceSource, /where\("ownerUid", "==", user\.uid\)/);
assert.match(persistenceSource, /String\(data\.ownerUid\) !== String\(user\.uid\)/);

function createFakeFirestore(initial = {}) {
  const docs = new Map(Object.entries(initial));
  function ref(docPath) {
    return {
      id: docPath.split("/").pop(),
      async get() {
        const data = docs.get(docPath);
        return { exists: Boolean(data), id: this.id, data: () => data && JSON.parse(JSON.stringify(data)) };
      },
      async set(data) { docs.set(docPath, JSON.parse(JSON.stringify(data))); },
      async update(data) {
        if (!docs.has(docPath)) throw new Error("missing document");
        docs.set(docPath, { ...docs.get(docPath), ...JSON.parse(JSON.stringify(data)) });
      },
    };
  }
  function collection(name) {
    return {
      doc(id) { return ref(`${name}/${id}`); },
      where(field, op, value) {
        const chain = { filters: [[field, op, value]], order: null, max: null };
        chain.orderBy = (fieldName, direction) => { chain.order = [fieldName, direction]; return chain; };
        chain.limit = (value) => { chain.max = value; return chain; };
        chain.get = async () => {
          let rows = [...docs.entries()]
            .filter(([key]) => key.startsWith(`${name}/`))
            .map(([key, data]) => ({ id: key.split("/").pop(), data }));
          for (const [fieldName, operator, expected] of chain.filters) {
            rows = rows.filter((row) => operator === "==" && row.data[fieldName] === expected);
          }
          if (chain.order) {
            const [fieldName, direction] = chain.order;
            rows.sort((a, b) => String(a.data[fieldName] || "").localeCompare(String(b.data[fieldName] || "")) * (direction === "desc" ? -1 : 1));
          }
          if (chain.max) rows = rows.slice(0, chain.max);
          return { docs: rows.map((row) => ({ id: row.id, data: () => JSON.parse(JSON.stringify(row.data)) })) };
        };
        return chain;
      },
    };
  }
  return {
    collection,
    Timestamp: { fromMillis: (value) => ({ toMillis: () => value }) },
    FieldValue: { serverTimestamp: () => ({ __serverTimestamp: true }) },
  };
}

function fakeFirebase(uid, db) {
  function firestore() { return db; }
  firestore.Timestamp = db.Timestamp;
  firestore.FieldValue = db.FieldValue;
  return { auth: () => ({ currentUser: uid ? { uid } : null }), firestore };
}

(async () => {
  const db = createFakeFirestore({
    "users/admin1": { aktif: true, role: "admin" },
    "users/admin2": { aktif: true, role: "admin" },
  });
  const admin1 = persistence.createPersistence({ firebase: fakeFirebase("admin1", db), db });
  const admin2 = persistence.createPersistence({ firebase: fakeFirebase("admin2", db), db });

  const session = {
    session: {
      contractVersion: "1.0", sessionId: "admin-session-1", ownerUid: "admin1", sessionType: "practice",
      educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", subtopicId: null,
      questionRefs: ["q1"], questionVersions: { q1: "1.0" }, currentIndex: 0, status: "active", startedAt: 1000, finishedAt: null,
    },
  };
  const response = [{ questionId: "q1", questionVersion: "1.0", answer: "A", isCorrect: true, evaluationCode: "CORRECT", misconceptionCode: null, answeredAt: 1100 }];

  await admin1.saveSession(session, response, "create");
  assert.equal((await admin1.getSession("admin-session-1")).ownerUid, "admin1");
  await assert.rejects(() => admin2.getSession("admin-session-1"), /bukan milik pengguna aktif/);

  await admin1.saveResult({
    resultId: "admin-result-1", sessionId: "admin-session-1", ownerUid: "admin1", sessionType: "practice",
    educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", score: 100,
    accuracy: 1, correctCount: 1, wrongCount: 0, totalQuestions: 1, duration: 1000,
    questionVersions: { q1: "1.0" }, responses: response, diagnosticSummary: null, mastery: null, recommendations: [], createdAt: 2000,
  });
  assert.equal((await admin1.getResult("admin-result-1")).ownerUid, "admin1");
  assert.equal((await admin1.listHistory()).length, 1);
  assert.equal((await admin2.listHistory()).length, 0);
  await assert.rejects(() => admin2.getResult("admin-result-1"), /bukan milik pengguna aktif/);

  console.log("Admin security boundary: PASS");
  console.log("Admin owner isolation: PASS");
  console.log("Evaluator secret exposure contract: PASS");
})();
