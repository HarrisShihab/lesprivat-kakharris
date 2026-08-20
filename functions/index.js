const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const crypto = require("crypto");
const pilot = require("./math-lab-pilot.js");
const diagnosticPilot = require("../netlify/functions/diagnostic-pilot.js");
const { evaluatePracticeResponses, normalizeDiagnosticResult } = require("./trusted-finalization.js");

initializeApp();
const db = getFirestore();

function sessionId() { return `math-session-${crypto.randomUUID()}`; }
function diagnosticSessionId() { return `math-diagnostic-${crypto.randomUUID()}`; }
function requireAuth(request) {
  if (!request.auth?.uid) throw new HttpsError("unauthenticated", "Authentication is required.");
  return request.auth.uid;
}
function validateConfig(data) {
  const value = data || {};
  if (String(value.educationLevel || "SMP") !== "SMP" || Number(value.grade || 7) !== 7 || String(value.phase || "D") !== "D" || String(value.subject || "matematika") !== "matematika" || String(value.topicId || "aljabar") !== "aljabar") {
    throw new HttpsError("failed-precondition", "The current Math Lab trusted pilot only provisions the Algebra Grade 7 pilot.");
  }
  return { educationLevel:"SMP", grade:7, phase:"D", subject:"matematika", topicId:"aljabar", subtopicId:value.subtopicId ? String(value.subtopicId) : null };
}
function asHttpsError(error) {
  if (error instanceof HttpsError) return error;
  const code = ["invalid-argument", "failed-precondition", "permission-denied", "not-found"].includes(error?.code) ? error.code : "internal";
  return new HttpsError(code, error?.message || "Trusted Math Lab request failed.");
}

exports.startMathLabPractice = onCall(async (request) => {
  const uid = requireAuth(request);
  const config = validateConfig(request.data);
  const questions = pilot.createPractice().map((entry) => entry.question);
  const id = sessionId();
  const now = Date.now();
  const questionVersions = Object.fromEntries(questions.map((q) => [q.questionId, q.version.contentVersion]));
  return { session:{ contractVersion:"1.0", sessionId:id, ownerUid:uid, sessionType:"practice", educationLevel:config.educationLevel, grade:config.grade, phase:config.phase, subject:config.subject, topicId:config.topicId, subtopicId:config.subtopicId, questionRefs:questions.map((q)=>q.questionId), questionVersions, currentIndex:0, status:"active", startedAt:now, finishedAt:null }, questions };
});

exports.evaluateMathLabAnswer = onCall(async (request) => {
  const uid = requireAuth(request);
  const data = request.data || {};
  const sessionIdValue = typeof data.sessionId === "string" ? data.sessionId.trim() : "";
  const questionId = typeof data.questionId === "string" ? data.questionId.trim() : "";
  const answer = typeof data.answer === "string" || typeof data.answer === "number" ? String(data.answer).trim() : "";
  if (!sessionIdValue || !questionId || !answer) throw new HttpsError("invalid-argument", "sessionId, questionId, and answer are required.");
  const sessionSnap = await db.collection("mathSessions").doc(sessionIdValue).get();
  if (!sessionSnap.exists) throw new HttpsError("not-found", "Math Lab session not found.");
  const session = sessionSnap.data() || {};
  if (session.ownerUid !== uid) throw new HttpsError("permission-denied", "Session ownership mismatch.");
  if (!Array.isArray(session.questionRefs) || !session.questionRefs.includes(questionId)) throw new HttpsError("permission-denied", "Question is not part of this Math Lab session.");
  const evaluation = pilot.evaluate(questionId, answer);
  if (!evaluation) throw new HttpsError("not-found", "Question evaluation is unavailable.");
  return { questionId, questionVersion:String(session.questionVersions?.[questionId] || "1.0"), isCorrect:evaluation.isCorrect, evaluationCode:evaluation.evaluationCode, misconceptionCode:evaluation.misconceptionCode };
});

exports.completeMathLabPractice = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const sessionIdValue = typeof request.data?.sessionId === "string" ? request.data.sessionId.trim() : "";
    if (!sessionIdValue) throw Object.assign(new Error("sessionId is required."), { code: "invalid-argument" });
    const sessionRef = db.collection("mathSessions").doc(sessionIdValue);
    const sessionSnap = await sessionRef.get();
    if (!sessionSnap.exists) throw Object.assign(new Error("Math Lab session not found."), { code: "not-found" });
    const session = sessionSnap.data() || {};
    if (session.ownerUid !== uid) throw Object.assign(new Error("Session ownership mismatch."), { code: "permission-denied" });
    if (session.sessionType !== "practice") throw Object.assign(new Error("Only Practice sessions can be finalized here."), { code: "failed-precondition" });

    const trustedResultId = String(session.trustedResultId || `math-result-${sessionIdValue}`);
    const existingResult = await db.collection("mathResults").doc(trustedResultId).get();
    if (existingResult.exists && existingResult.data()?.trustStatus === "trusted") {
      return { result: existingResult.data(), idempotent: true };
    }

    const evaluated = evaluatePracticeResponses({ pilot, session, responses: session.responses });
    const finishedAt = Date.now();
    const result = {
      contractVersion: "1.0",
      resultId: trustedResultId,
      sessionId: sessionIdValue,
      ownerUid: uid,
      sessionType: "practice",
      educationLevel: String(session.educationLevel || "SMP"),
      grade: session.grade == null ? 7 : session.grade,
      phase: String(session.phase || "D"),
      subject: String(session.subject || "matematika"),
      topicId: String(session.topicId || "aljabar"),
      score: evaluated.score,
      accuracy: evaluated.accuracy,
      correctCount: evaluated.correctCount,
      wrongCount: evaluated.wrongCount,
      totalQuestions: evaluated.totalQuestions,
      duration: Math.max(0, finishedAt - Number(session.startedAt || finishedAt)),
      questionVersions: session.questionVersions || {},
      responses: evaluated.responses,
      diagnosticSummary: null,
      mastery: null,
      recommendations: [],
      trustStatus: "trusted",
      createdAt: FieldValue.serverTimestamp(),
    };

    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(sessionRef);
      const current = fresh.data() || {};
      if (current.ownerUid !== uid) throw Object.assign(new Error("Session ownership mismatch."), { code: "permission-denied" });
      const currentResult = await tx.get(db.collection("mathResults").doc(trustedResultId));
      if (currentResult.exists && currentResult.data()?.trustStatus === "trusted") return;
      tx.set(db.collection("mathResults").doc(trustedResultId), result);
      tx.update(sessionRef, {
        status: "completed",
        finishedAt: FieldValue.serverTimestamp(),
        currentIndex: Math.max(0, evaluated.totalQuestions - 1),
        responses: evaluated.responses,
        updatedAt: FieldValue.serverTimestamp(),
        trustStatus: "trusted",
        trustedResultId,
      });
    });

    return { result, idempotent: false };
  } catch (error) {
    throw asHttpsError(error);
  }
});

exports.completeMathLabDiagnostic = onCall(async (request) => {
  const uid = requireAuth(request);
  try {
    const sessionIdValue = typeof request.data?.sessionId === "string" ? request.data.sessionId.trim() : "";
    if (!sessionIdValue.startsWith("math-diagnostic-")) throw Object.assign(new Error("A valid diagnostic sessionId is required."), { code: "invalid-argument" });
    const responses = Array.isArray(request.data?.responses) ? request.data.responses : [];
    const resultId = `math-diagnostic-result-${sessionIdValue}`;
    const existing = await db.collection("mathDiagnosticResults").doc(resultId).get();
    if (existing.exists && existing.data()?.ownerUid === uid && existing.data()?.trustStatus === "trusted") {
      return { result: existing.data(), responses: existing.data()?.responses || [], persisted: true, idempotent: true };
    }

    const result = normalizeDiagnosticResult({ pilot: diagnosticPilot, sessionId: sessionIdValue, ownerUid: uid, responses });
    result.resultId = resultId;
    result.createdAt = FieldValue.serverTimestamp();

    await db.runTransaction(async (tx) => {
      const resultRef = db.collection("mathDiagnosticResults").doc(resultId);
      const current = await tx.get(resultRef);
      if (current.exists && current.data()?.ownerUid === uid && current.data()?.trustStatus === "trusted") return;
      tx.set(resultRef, result);
      const masteryRef = db.collection("mathMastery").doc(`${uid}_aljabar`);
      tx.set(masteryRef, {
        ownerUid: uid,
        educationLevel: "SMP",
        grade: 7,
        phase: "D",
        subject: "matematika",
        topicId: "aljabar",
        mastery: result.mastery,
        evidence: result.indicatorEvidence || [],
        recommendations: result.recommendations,
        sourceResultId: resultId,
        trustStatus: "trusted",
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    return { result, responses: result.responses, persisted: true, idempotent: false };
  } catch (error) {
    throw asHttpsError(error);
  }
});
