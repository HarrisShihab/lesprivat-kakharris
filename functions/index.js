const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");

initializeApp();
const db = getFirestore();

/**
 * Minimal trusted evaluation boundary for authenticated Math Lab submissions.
 * Evaluation specifications remain server-side and are never returned.
 */
exports.evaluateMathLabAnswer = onCall(async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Authentication is required.");
  }

  const data = request.data || {};
  const sessionId = typeof data.sessionId === "string" ? data.sessionId.trim() : "";
  const questionId = typeof data.questionId === "string" ? data.questionId.trim() : "";
  const answer = typeof data.answer === "string" || typeof data.answer === "number"
    ? String(data.answer).trim()
    : "";

  if (!sessionId || !questionId || !answer) {
    throw new HttpsError("invalid-argument", "sessionId, questionId, and answer are required.");
  }

  const sessionRef = db.collection("mathSessions").doc(sessionId);
  const sessionSnap = await sessionRef.get();
  if (!sessionSnap.exists) {
    throw new HttpsError("not-found", "Math Lab session not found.");
  }

  const session = sessionSnap.data() || {};
  if (session.ownerUid !== request.auth.uid) {
    throw new HttpsError("permission-denied", "Session ownership mismatch.");
  }

  // Evaluation resolution is intentionally isolated here. Do not accept an
  // evaluation specification, answer key, or scoring rule from the client.
  // Until the existing pilot evaluation data is migrated into this trusted
  // server boundary, fail closed rather than performing untrusted scoring.
  throw new HttpsError(
    "failed-precondition",
    "Trusted evaluation specification is not provisioned yet."
  );
});
