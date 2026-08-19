"use strict";

const pilot = require("./diagnostic-pilot.js");
const {
  json,
  methodGuard,
  readBody,
  bearer,
  verifyIdToken,
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
