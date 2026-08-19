const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const crypto = require("crypto");
const pilot = require("./math-lab-pilot.js");

initializeApp();
const db = getFirestore();

function sessionId() { return `math-session-${crypto.randomUUID()}`; }
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
