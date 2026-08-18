(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.firestore = root.KakHarrisMathLab.firestore || {};
  root.KakHarrisMathLab.firestore.practicePersistence = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const COLLECTIONS = Object.freeze({
    sessions: "mathSessions",
    results: "mathResults",
  });

  const ALLOWED_ROLES = Object.freeze(["murid", "admin"]);
  const SESSION_MUTABLE_KEYS = Object.freeze([
    "currentIndex",
    "status",
    "finishedAt",
    "responses",
    "updatedAt",
  ]);

  function sanitizeDebugMessage(value) {
    return String(value ?? "")
      .replace(/(token|password|passwd|authorization|idToken)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, "Bearer [REDACTED]");
  }

  function createDebugLogger(debug) {
    if (!debug) return () => {};
    const sink = typeof debug === "function" ? debug : debug.log;
    if (typeof sink !== "function") return () => {};
    return (entry) => {
      try {
        sink(Object.freeze({
          scope: "Firestore",
          collection: String(entry.collection || ""),
          path: String(entry.path || ""),
          operation: String(entry.operation || ""),
          stage: String(entry.stage || ""),
          status: String(entry.status || ""),
          code: entry.code == null ? null : String(entry.code),
          message: entry.message == null ? null : sanitizeDebugMessage(entry.message),
          meta: entry.meta && typeof entry.meta === "object" ? Object.freeze({ ...entry.meta }) : null,
          timestamp: Date.now(),
        }));
      } catch (_) {}
    };
  }

  async function debugOperation(debugLog, entry, operation) {
    try {
      const result = await operation();
      debugLog({ ...entry, status: "OK" });
      return result;
    } catch (error) {
      debugLog({
        ...entry,
        status: "DENIED",
        code: error?.code || "unknown-error",
        message: error?.message || String(error),
      });
      throw error;
    }
  }

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function getFirebase(firebaseLike) {
    const fb = firebaseLike || (typeof globalThis !== "undefined" ? globalThis.firebase : null);
    if (!fb || typeof fb.auth !== "function" || typeof fb.firestore !== "function") {
      throw new Error("Firebase Auth/Firestore belum tersedia.");
    }
    return fb;
  }

  function getCurrentUser(firebaseLike) {
    const fb = getFirebase(firebaseLike);
    const user = fb.auth().currentUser;
    if (!user || !user.uid) throw new Error("Sesi login tidak aktif.");
    return { fb, user };
  }

  async function getActiveProfile(firebaseLike, uid, debugLog) {
    const { fb } = getCurrentUser(firebaseLike);
    const snap = await debugOperation(debugLog, { collection: "users", path: `users/${uid}`, operation: "GET", stage: "load active profile" }, () => fb.firestore().collection("users").doc(uid).get());
    if (!snap.exists) throw new Error("Profil pengguna tidak ditemukan.");
    const profile = snap.data() || {};
    if (profile.aktif === false) throw new Error("Akun pengguna tidak aktif.");
    if (!ALLOWED_ROLES.includes(profile.role)) throw new Error("Role tidak diizinkan menggunakan Math Lab.");
    return profile;
  }

  function timestamp(firebaseLike, value) {
    if (value == null) return null;
    if (typeof value === "object" && typeof value.toMillis === "function") return value;
    const fb = getFirebase(firebaseLike);
    if (fb.firestore?.Timestamp?.fromMillis) return fb.firestore.Timestamp.fromMillis(Number(value));
    return value;
  }

  function serverTimestamp(firebaseLike) {
    const fb = getFirebase(firebaseLike);
    return fb.firestore.FieldValue.serverTimestamp();
  }

  function sanitizeResponse(response) {
    if (!response || typeof response !== "object") return null;
    return {
      questionId: String(response.questionId || ""),
      questionVersion: String(response.questionVersion || ""),
      answer: clone(response.answer),
      isCorrect: response.isCorrect === true,
      evaluationCode: String(response.evaluationCode || ""),
      misconceptionCode: response.misconceptionCode == null ? null : String(response.misconceptionCode),
      answeredAt: response.answeredAt == null ? null : Number(response.answeredAt),
    };
  }

  function sanitizeResponses(responses) {
    if (!Array.isArray(responses)) return [];
    return responses.map(sanitizeResponse).filter(Boolean);
  }

  function sessionPayload(snapshot, responses, firebaseLike) {
    const session = snapshot?.session || snapshot;
    if (!session || !session.sessionId) throw new Error("Session tidak valid.");
    if (!session.ownerUid) throw new Error("Session membutuhkan ownerUid.");
    if (session.sessionType !== "practice") throw new Error("Persistence MVP hanya menerima Practice Session.");

    return {
      contractVersion: String(session.contractVersion || "1.0"),
      sessionId: String(session.sessionId),
      ownerUid: String(session.ownerUid),
      sessionType: "practice",
      educationLevel: String(session.educationLevel),
      grade: session.grade,
      phase: String(session.phase),
      subject: String(session.subject),
      topicId: String(session.topicId),
      subtopicId: session.subtopicId == null ? null : String(session.subtopicId),
      questionRefs: Array.isArray(session.questionRefs) ? session.questionRefs.map(String) : [],
      questionVersions: clone(session.questionVersions || {}),
      currentIndex: Number(session.currentIndex || 0),
      status: String(session.status),
      startedAt: timestamp(firebaseLike, session.startedAt),
      finishedAt: timestamp(firebaseLike, session.finishedAt),
      responses: sanitizeResponses(responses),
      trustStatus: "client-untrusted",
      updatedAt: serverTimestamp(firebaseLike),
    };
  }

  function resultPayload(result, firebaseLike) {
    if (!result || !result.resultId || !result.sessionId || !result.ownerUid) throw new Error("Result tidak valid.");
    if (result.sessionType !== "practice") throw new Error("Persistence MVP hanya menerima Practice Result.");

    return {
      contractVersion: String(result.contractVersion || "1.0"),
      resultId: String(result.resultId),
      sessionId: String(result.sessionId),
      ownerUid: String(result.ownerUid),
      sessionType: "practice",
      educationLevel: String(result.educationLevel),
      grade: result.grade,
      phase: String(result.phase),
      subject: String(result.subject),
      topicId: String(result.topicId),
      score: Number(result.score),
      accuracy: Number(result.accuracy),
      correctCount: Number(result.correctCount),
      wrongCount: Number(result.wrongCount),
      totalQuestions: Number(result.totalQuestions),
      duration: result.duration == null ? null : Number(result.duration),
      questionVersions: clone(result.questionVersions || {}),
      responses: sanitizeResponses(result.responses),
      diagnosticSummary: null,
      mastery: null,
      recommendations: [],
      // History timestamps must come from Firestore, not from the client result.
      createdAt: serverTimestamp(firebaseLike),
      trustStatus: "client-untrusted",
    };
  }

  function assertOwner(payload, uid) {
    if (String(payload.ownerUid) !== String(uid)) throw new Error("Session/result bukan milik pengguna aktif.");
  }

  function createPersistence(options) {
    const value = options || {};
    const firebaseLike = value.firebase || (typeof globalThis !== "undefined" ? globalThis.firebase : null);
    const db = value.db || getFirebase(firebaseLike).firestore();
    const debugLog = createDebugLogger(value.debug);

    async function assertUser(includeProfile = false) {
      const { user } = getCurrentUser(firebaseLike);
      const profile = await getActiveProfile(firebaseLike, user.uid, debugLog);
      return includeProfile ? { user, profile } : user;
    }

    async function saveSession(snapshot, responses, mode = "update") {
      const context = mode === "create" ? await assertUser(true) : { user: await assertUser() };
      const user = context.user;
      const payload = sessionPayload(snapshot, responses, firebaseLike);
      assertOwner(payload, user.uid);
      const ref = db.collection(COLLECTIONS.sessions).doc(payload.sessionId);

      if (mode === "create") {
        // For a new document, Firestore Rules authorize from request.resource.data.
        // A pre-read would evaluate the get rule against missing resource.data and
        // can therefore fail before the create rule is ever reached.
        await debugOperation(debugLog, {
          collection: COLLECTIONS.sessions,
          path: `${COLLECTIONS.sessions}/${payload.sessionId}`,
          operation: "SET",
          stage: "create session",
          meta: {
            documentId: payload.sessionId,
            authUid: String(user.uid),
            role: String(context.profile?.role || ""),
            aktif: context.profile?.aktif === true,
            mathLabUser: context.profile?.aktif === true && ["murid", "admin"].includes(context.profile?.role),
            ownerUidPresent: Boolean(payload.ownerUid),
            ownerUidMatchesAuth: String(payload.ownerUid) === String(user.uid),
            sessionIdMatchesPath: String(payload.sessionId) === String(ref.id),
            sessionType: payload.sessionType,
            trustStatus: payload.trustStatus,
            topLevelKeys: Object.keys({ ...payload, createdAt: null }).sort(),
          },
        }, () => ref.set({ ...payload, createdAt: serverTimestamp(firebaseLike) }));
        return { sessionId: payload.sessionId, ownerUid: user.uid, trustStatus: "client-untrusted" };
      }

      if (mode !== "update") throw new Error("Mode persistence session tidak valid.");

      // Existing sessions require an ownership read before the restricted update.
      const existing = await debugOperation(debugLog, { collection: COLLECTIONS.sessions, path: `${COLLECTIONS.sessions}/${payload.sessionId}`, operation: "GET", stage: "verify existing session ownership" }, () => ref.get());
      if (!existing.exists) throw new Error("Session yang akan diperbarui tidak ditemukan.");
      const current = existing.data() || {};
      if (String(current.ownerUid) !== String(user.uid)) throw new Error("Session bukan milik pengguna aktif.");
      await debugOperation(debugLog, { collection: COLLECTIONS.sessions, path: `${COLLECTIONS.sessions}/${payload.sessionId}`, operation: "UPDATE", stage: "update existing session" }, () => ref.update({
        currentIndex: payload.currentIndex,
        status: payload.status,
        finishedAt: payload.finishedAt,
        responses: payload.responses,
        updatedAt: serverTimestamp(firebaseLike),
        trustStatus: "client-untrusted",
      }));
      return { sessionId: payload.sessionId, ownerUid: user.uid, trustStatus: "client-untrusted" };
    }

    async function saveResult(result) {
      const user = await assertUser();
      const payload = resultPayload(result, firebaseLike);
      assertOwner(payload, user.uid);
      const ref = db.collection(COLLECTIONS.results).doc(payload.resultId);
      // Results are immutable. A direct set is safe here: Rules allow create
      // only when ownerUid matches; an existing result is an update and the
      // update rule is explicitly denied. This avoids a pre-read against the
      // resource-based get rule for a new result.
      await debugOperation(debugLog, { collection: COLLECTIONS.results, path: `${COLLECTIONS.results}/${payload.resultId}`, operation: "SET", stage: "create result" }, () => ref.set(payload));
      return { resultId: payload.resultId, ownerUid: user.uid, trustStatus: "client-untrusted", alreadyExists: false };
    }

    async function getSession(sessionId) {
      const user = await assertUser();
      const snap = await debugOperation(debugLog, { collection: COLLECTIONS.sessions, path: `${COLLECTIONS.sessions}/${String(sessionId)}`, operation: "GET", stage: "load session" }, () => db.collection(COLLECTIONS.sessions).doc(String(sessionId)).get());
      if (!snap.exists) return null;
      const data = snap.data() || {};
      if (String(data.ownerUid) !== String(user.uid)) throw new Error("Session bukan milik pengguna aktif.");
      return { id: snap.id, ...clone(data) };
    }

    async function getResult(resultId) {
      const user = await assertUser();
      const snap = await debugOperation(debugLog, { collection: COLLECTIONS.results, path: `${COLLECTIONS.results}/${String(resultId)}`, operation: "GET", stage: "load result" }, () => db.collection(COLLECTIONS.results).doc(String(resultId)).get());
      if (!snap.exists) return null;
      const data = snap.data() || {};
      if (String(data.ownerUid) !== String(user.uid)) throw new Error("Result bukan milik pengguna aktif.");
      return { id: snap.id, ...clone(data) };
    }

    async function listHistory(limit = 50) {
      const { user, profile } = await assertUser(true);
      const safeLimit = Math.max(1, Math.min(100, Number(limit) || 50));
      const query = db.collection(COLLECTIONS.results)
        .where("ownerUid", "==", user.uid)
        .orderBy("createdAt", "desc")
        .limit(safeLimit);
      const snap = await debugOperation(debugLog, {
        collection: COLLECTIONS.results,
        path: COLLECTIONS.results,
        operation: "LIST",
        stage: "load history",
        meta: {
          queryWhere: { field: "ownerUid", operator: "==", valueType: "string" },
          queryOrderBy: { field: "createdAt", direction: "desc" },
          limit: safeLimit,
          authUid: String(user.uid),
          role: String(profile.role || ""),
          aktif: profile.aktif === true,
          mathLabUser: profile.aktif === true && ["murid", "admin"].includes(profile.role),
          queryOwnerUidMatchesAuth: true,
        },
      }, () => query.get());
      return snap.docs.map((doc) => {
        const data = doc.data() || {};
        return {
          id: doc.id,
          ...clone(data),
          createdAt: data.createdAt,
        };
      });
    }

    return Object.freeze({
      saveSession,
      saveResult,
      getSession,
      getResult,
      listHistory,
      COLLECTIONS,
      SESSION_MUTABLE_KEYS,
    });
  }

  return Object.freeze({
    COLLECTIONS,
    ALLOWED_ROLES,
    SESSION_MUTABLE_KEYS,
    createPersistence,
    sessionPayload,
    resultPayload,
    sanitizeResponse,
  });
});
