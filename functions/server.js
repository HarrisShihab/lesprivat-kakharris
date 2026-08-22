const express = require("express");
const cors = require("cors");
const crypto = require("crypto");
const { getApps, initializeApp, applicationDefault, cert } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const pilot = require("./math-lab-pilot.js");
const diagnosticPilot = require("./diagnostic-trusted-pilot.js");
const { evaluatePracticeResponses, normalizeDiagnosticResult } = require("./trusted-finalization.js");

function initFirebase() {
  if (getApps().length) return getApps()[0];
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return initializeApp({ credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)) });
  }
  return initializeApp({ credential: applicationDefault() });
}

initFirebase();
const auth = getAuth();
const db = getFirestore();
const app = express();
app.use(cors());
app.use(express.json({ limit: "64kb" }));

function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

async function requireAuth(req, _res, next) {
  try {
    const header = String(req.headers.authorization || "");
    if (!header.startsWith("Bearer ")) throw httpError(401, "Authentication is required.");
    req.uid = (await auth.verifyIdToken(header.slice(7).trim())).uid;
    next();
  } catch (e) { next(e.status ? e : httpError(401, "Invalid authentication token.")); }
}

function validateConfig(data) {
  const value = data || {};
  if (String(value.educationLevel || "SMP") !== "SMP" || Number(value.grade || 7) !== 7 || String(value.phase || "D") !== "D" || String(value.subject || "matematika") !== "matematika" || String(value.topicId || "aljabar") !== "aljabar") {
    throw httpError(412, "The current Math Lab trusted pilot only provisions the Algebra Grade 7 pilot.");
  }
  return { educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", subtopicId: value.subtopicId ? String(value.subtopicId) : null };
}

app.get("/health", (_req, res) => res.json({ ok: true, service: "math-lab-trusted-backend" }));

app.post("/v1/math-lab/practice/start", requireAuth, (req, res, next) => {
  try {
    const config = validateConfig(req.body);
    const questions = pilot.createPractice().map((entry) => entry.question);
    const id = `math-session-${crypto.randomUUID()}`;
    const now = Date.now();
    const questionVersions = Object.fromEntries(questions.map((q) => [q.questionId, q.version.contentVersion]));
    res.json({ session: { contractVersion: "1.0", sessionId: id, ownerUid: req.uid, sessionType: "practice", educationLevel: config.educationLevel, grade: config.grade, phase: config.phase, subject: config.subject, topicId: config.topicId, subtopicId: config.subtopicId, questionRefs: questions.map((q) => q.questionId), questionVersions, currentIndex: 0, status: "active", startedAt: now, finishedAt: null }, questions });
  } catch (e) { next(e); }
});

app.post("/v1/math-lab/practice/evaluate", requireAuth, async (req, res, next) => {
  try {
    const data = req.body || {};
    const sessionId = typeof data.sessionId === "string" ? data.sessionId.trim() : "";
    const questionId = typeof data.questionId === "string" ? data.questionId.trim() : "";
    const answer = typeof data.answer === "string" || typeof data.answer === "number" ? String(data.answer).trim() : "";
    if (!sessionId || !questionId || !answer) throw httpError(400, "sessionId, questionId, and answer are required.");
    const snap = await db.collection("mathSessions").doc(sessionId).get();
    if (!snap.exists) throw httpError(404, "Math Lab session not found.");
    const session = snap.data() || {};
    if (session.ownerUid !== req.uid) throw httpError(403, "Session ownership mismatch.");
    if (!Array.isArray(session.questionRefs) || !session.questionRefs.includes(questionId)) throw httpError(403, "Question is not part of this Math Lab session.");
    const evaluation = pilot.evaluate(questionId, answer);
    if (!evaluation) throw httpError(404, "Question evaluation is unavailable.");
    res.json({ questionId, questionVersion: String(session.questionVersions?.[questionId] || "1.0"), isCorrect: evaluation.isCorrect, evaluationCode: evaluation.evaluationCode, misconceptionCode: evaluation.misconceptionCode });
  } catch (e) { next(e); }
});

app.post("/v1/math-lab/practice/complete", requireAuth, async (req, res, next) => {
  try {
    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
    if (!sessionId) throw httpError(400, "sessionId is required.");
    const sessionRef = db.collection("mathSessions").doc(sessionId);
    const snap = await sessionRef.get();
    if (!snap.exists) throw httpError(404, "Math Lab session not found.");
    const session = snap.data() || {};
    if (session.ownerUid !== req.uid) throw httpError(403, "Session ownership mismatch.");
    if (session.sessionType !== "practice") throw httpError(412, "Only Practice sessions can be finalized here.");
    const trustedResultId = String(session.trustedResultId || `math-result-${sessionId}`);
    const resultRef = db.collection("mathResults").doc(trustedResultId);
    const existing = await resultRef.get();
    if (existing.exists && existing.data()?.trustStatus === "trusted") return res.json({ result: existing.data(), idempotent: true });
    const evaluated = evaluatePracticeResponses({ pilot, session, responses: session.responses });
    const finishedAt = Date.now();
    const result = { contractVersion: "1.0", resultId: trustedResultId, sessionId, ownerUid: req.uid, sessionType: "practice", educationLevel: String(session.educationLevel || "SMP"), grade: session.grade == null ? 7 : session.grade, phase: String(session.phase || "D"), subject: String(session.subject || "matematika"), topicId: String(session.topicId || "aljabar"), score: evaluated.score, accuracy: evaluated.accuracy, correctCount: evaluated.correctCount, wrongCount: evaluated.wrongCount, totalQuestions: evaluated.totalQuestions, duration: Math.max(0, finishedAt - Number(session.startedAt || finishedAt)), questionVersions: session.questionVersions || {}, responses: evaluated.responses, diagnosticSummary: null, mastery: null, recommendations: [], trustStatus: "trusted", createdAt: FieldValue.serverTimestamp() };
    await db.runTransaction(async (tx) => {
      const fresh = await tx.get(sessionRef);
      const current = fresh.data() || {};
      if (current.ownerUid !== req.uid) throw httpError(403, "Session ownership mismatch.");
      const currentResult = await tx.get(resultRef);
      if (currentResult.exists && currentResult.data()?.trustStatus === "trusted") return;
      tx.set(resultRef, result);
      tx.update(sessionRef, { status: "completed", finishedAt: FieldValue.serverTimestamp(), currentIndex: Math.max(0, evaluated.totalQuestions - 1), responses: evaluated.responses, updatedAt: FieldValue.serverTimestamp(), trustStatus: "trusted", trustedResultId });
    });
    res.json({ result, idempotent: false });
  } catch (e) { next(e); }
});

app.post("/v1/math-lab/diagnostic/complete", requireAuth, async (req, res, next) => {
  try {
    const sessionId = typeof req.body?.sessionId === "string" ? req.body.sessionId.trim() : "";
    if (!sessionId.startsWith("math-diagnostic-")) throw httpError(400, "A valid diagnostic sessionId is required.");
    const responses = Array.isArray(req.body?.responses) ? req.body.responses : [];
    const resultId = `math-diagnostic-result-${sessionId}`;
    const resultRef = db.collection("mathDiagnosticResults").doc(resultId);
    const existing = await resultRef.get();
    if (existing.exists && existing.data()?.ownerUid === req.uid && existing.data()?.trustStatus === "trusted") return res.json({ result: existing.data(), responses: existing.data()?.responses || [], persisted: true, idempotent: true });
    const result = normalizeDiagnosticResult({ pilot: diagnosticPilot, sessionId, ownerUid: req.uid, responses });
    result.resultId = resultId;
    result.createdAt = FieldValue.serverTimestamp();
    await db.runTransaction(async (tx) => {
      const current = await tx.get(resultRef);
      if (current.exists && current.data()?.ownerUid === req.uid && current.data()?.trustStatus === "trusted") return;
      tx.set(resultRef, result);
      const masteryRef = db.collection("mathMastery").doc(`${req.uid}_aljabar`);
      tx.set(masteryRef, { ownerUid: req.uid, educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", mastery: result.mastery, evidence: result.indicatorEvidence || [], recommendations: result.recommendations, sourceResultId: resultId, trustStatus: "trusted", updatedAt: FieldValue.serverTimestamp() }, { merge: true });
    });
    res.json({ result, responses: result.responses, persisted: true, idempotent: false });
  } catch (e) { next(e); }
});

app.get("/firebase-check", async (_req, res, next) => {
  try {
    await db.collection("mathSessions").limit(1).get();
    res.json({ ok: true, firestore: true });
  } catch (e) {
    next(e);
  }
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(Number(error.status) || 500).json({ error: { message: error.message || "Trusted Math Lab request failed." } });
});

const port = Number(process.env.PORT || 8080);
if (require.main === module) app.listen(port, "0.0.0.0", () => console.log(`Math Lab trusted backend listening on ${port}`));
module.exports = { app };
