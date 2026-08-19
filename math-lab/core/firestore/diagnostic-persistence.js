(function (root, factory) {
  "use strict";
  const api = factory();
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.firestore = root.KakHarrisMathLab.firestore || {};
  root.KakHarrisMathLab.firestore.diagnosticPersistence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLLECTION = "mathDiagnosticResults";

  function getFirebase(firebaseLike) {
    const fb = firebaseLike || (typeof globalThis !== "undefined" ? globalThis.firebase : null);
    if (!fb || typeof fb.auth !== "function" || typeof fb.firestore !== "function") {
      throw new Error("Firebase Auth/Firestore belum tersedia.");
    }

    // The student portal normally initializes Firebase through firebase-api-legacy.js.
    // Diagnostic history can also be initialized slightly earlier, however, so make
    // this persistence layer self-healing when the compat SDK is loaded but the
    // default app has not been created yet.
    if (Array.isArray(fb.apps) && fb.apps.length === 0) {
      const config = typeof globalThis !== "undefined" ? globalThis.FIREBASE_CONFIG : null;
      if (!config || !config.apiKey || !config.appId || !config.projectId) {
        throw new Error("Firebase belum dikonfigurasi.");
      }
      fb.initializeApp(config);
    }

    if (Array.isArray(fb.apps) && fb.apps.length === 0) {
      throw new Error("Firebase App belum siap.");
    }

    return fb;
  }

  function currentUser(firebaseLike) {
    const fb = getFirebase(firebaseLike);
    const user = fb.auth().currentUser;
    if (!user || !user.uid) throw new Error("Sesi login tidak aktif.");
    return { fb, user };
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function serverTimestamp(fb) {
    return fb.firestore.FieldValue.serverTimestamp();
  }

  function payload(result, fb, uid) {
    if (!result || !result.resultId) throw new Error("Diagnostic result tidak valid.");
    if (String(result.ownerUid) !== String(uid)) throw new Error("Diagnostic result bukan milik pengguna aktif.");

    return {
      contractVersion: String(result.contractVersion || "1.0"),
      resultId: String(result.resultId),
      sessionId: result.sessionId == null ? null : String(result.sessionId),
      ownerUid: String(uid),
      sessionType: "diagnostic",
      educationLevel: String(result.educationLevel || ""),
      grade: result.grade == null ? null : result.grade,
      topicId: String(result.topicId || ""),
      score: Number(result.score || 0),
      accuracy: Number(result.accuracy || 0),
      correctCount: Number(result.correctCount || 0),
      wrongCount: Number(result.wrongCount || 0),
      totalQuestions: Number(result.totalQuestions || 0),
      questionVersions: clone(result.questionVersions || {}),
      diagnosticSummary: clone(result.diagnosticSummary || null),
      mastery: clone(result.mastery || []),
      recommendations: clone(result.recommendations || []),
      trustStatus: "client-untrusted",
      createdAt: serverTimestamp(fb),
    };
  }

  function createPersistence(options) {
    const value = options || {};
    const { fb, user } = currentUser(value.firebase);
    const db = value.db || fb.firestore();

    async function saveResult(result) {
      const data = payload(result, fb, user.uid);
      await db.collection(COLLECTION).doc(data.resultId).set(data);
      return {
        resultId: data.resultId,
        ownerUid: user.uid,
        trustStatus: "client-untrusted",
      };
    }

    async function listHistory(limit = 5) {
      const safeLimit = Math.max(1, Math.min(5, Number(limit) || 5));
      const snap = await db
        .collection(COLLECTION)
        .where("ownerUid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(safeLimit)
        .get();

      return snap.docs.map((doc) => ({ id: doc.id, ...clone(doc.data()) }));
    }

    async function getResult(resultId) {
      const snap = await db.collection(COLLECTION).doc(String(resultId)).get();
      if (!snap.exists) return null;

      const data = snap.data() || {};
      if (String(data.ownerUid) !== String(user.uid)) {
        throw new Error("Diagnostic result bukan milik pengguna aktif.");
      }

      return { id: snap.id, ...clone(data) };
    }

    return Object.freeze({ saveResult, listHistory, getResult, COLLECTION });
  }

  return Object.freeze({ COLLECTION, createPersistence, payload });
});
