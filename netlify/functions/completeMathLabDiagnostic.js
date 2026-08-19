"use strict";

const pilot = require("./diagnostic-pilot.js");
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

async function assertMathLabUser(token, uid) {
  const document = await firestoreRequest(`users/${encodeURIComponent(uid)}`, token, { method: "GET" });
  const profile = decodeDocument(document);
  if (profile.aktif !== true || !["murid", "admin"].includes(String(profile.role || ""))) {
    const error = new Error("Akun tidak memiliki akses Math Lab.");
    error.statusCode = 403;
    throw error;
  }
}

exports.handler = async (event) => {
  const methodError = methodGuard(event);
  if (methodError) return methodError;

  try {
    const token = bearer(event);
    const auth = await verifyIdToken(token);
    await assertMathLabUser(token, auth.uid);
    const data = readBody(event)?.data || {};
    const sessionId = typeof data.sessionId === "string" ? data.sessionId.trim() : "";
    if (!sessionId || !sessionId.startsWith("math-diagnostic-")) {
      const error = new Error("A valid diagnostic sessionId is required.");
      error.statusCode = 400;
      throw error;
    }

    const responses = Array.isArray(data.responses) ? data.responses : [];
    const analyzed = pilot.analyze(sessionId, responses);
    const correctCount = analyzed.responses.filter((response) => response.isCorrect).length;
    const totalQuestions = analyzed.responses.length;
    const diagnosticSummary = {
      ...analyzed.result.diagnosticSummary,
      correctCount,
      wrongCount: totalQuestions - correctCount,
      totalQuestions,
      score: Number(((correctCount / totalQuestions) * 100).toFixed(2)),
    };

    return json(200, {
      data: {
        result: {
          ...analyzed.result,
          ownerUid: auth.uid,
          diagnosticSummary,
          trustStatus: "client-untrusted",
        },
        responses: analyzed.responses,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};
