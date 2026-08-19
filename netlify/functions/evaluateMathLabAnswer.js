"use strict";

const pilot = require("../../functions/math-lab-pilot.js");
const {
  json,
  methodGuard,
  readBody,
  bearer,
  verifyIdToken,
  firestoreRequest,
  decodeDocument,
  errorResponse,
} = require("./math-lab-trusted-utils.js");

exports.handler = async (event) => {
  const methodError = methodGuard(event);
  if (methodError) return methodError;

  try {
    const token = bearer(event);
    const auth = await verifyIdToken(token);
    const data = readBody(event)?.data || {};
    const sessionId = typeof data.sessionId === "string" ? data.sessionId.trim() : "";
    const questionId = typeof data.questionId === "string" ? data.questionId.trim() : "";
    const answer = typeof data.answer === "string" || typeof data.answer === "number" ? String(data.answer).trim() : "";

    if (!sessionId || !questionId || !answer) {
      const error = new Error("sessionId, questionId, and answer are required.");
      error.statusCode = 400;
      throw error;
    }

    // Firebase ID-token authentication means this read remains subject to the
    // existing Firestore Security Rules. A different user's session cannot be read.
    const document = await firestoreRequest(`mathSessions/${encodeURIComponent(sessionId)}`, token, { method: "GET" });
    const session = decodeDocument(document);
    if (String(session.ownerUid) !== auth.uid) {
      const error = new Error("Session ownership mismatch.");
      error.statusCode = 403;
      throw error;
    }
    if (!Array.isArray(session.questionRefs) || !session.questionRefs.includes(questionId)) {
      const error = new Error("Question is not part of this Math Lab session.");
      error.statusCode = 403;
      throw error;
    }

    const evaluation = pilot.evaluate(questionId, answer);
    if (!evaluation) {
      const error = new Error("Question evaluation is unavailable.");
      error.statusCode = 404;
      throw error;
    }

    return json(200, {
      data: {
        questionId,
        questionVersion: String(session.questionVersions?.[questionId] || "1.0"),
        isCorrect: evaluation.isCorrect,
        evaluationCode: evaluation.evaluationCode,
        misconceptionCode: evaluation.misconceptionCode,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};
