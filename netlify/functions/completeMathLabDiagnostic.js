"use strict";

const pilot = require("./diagnostic-pilot.js");
const {
  json,
  methodGuard,
  readBody,
  bearer,
  verifyIdToken,
  firestoreRequest,
  fsFields,
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

async function persistDiagnosticResult(token, result, responses) {
  const resultId = String(result.resultId || "").trim();
  if (!resultId) throw new Error("Diagnostic resultId tidak valid.");

  const document = {
    fields: fsFields({
      contractVersion: String(result.contractVersion || "1.0"),
      resultId,
      sessionId: String(result.sessionId || ""),
      ownerUid: String(result.ownerUid || ""),
      sessionType: "diagnostic",
      educationLevel: String(result.educationLevel || ""),
      grade: result.grade == null ? null : result.grade,
      phase: result.phase == null ? null : String(result.phase),
      subject: result.subject == null ? null : String(result.subject),
      topicId: String(result.topicId || ""),
      score: Number(result.score || 0),
      accuracy: Number(result.accuracy || 0),
      correctCount: Number(result.correctCount || 0),
      wrongCount: Number(result.wrongCount || 0),
      totalQuestions: Number(result.totalQuestions || 0),
      questionVersions: result.questionVersions || {},
      responses: Array.isArray(responses) ? responses : [],
      diagnosticSummary: result.diagnosticSummary || {},
      mastery: Array.isArray(result.mastery) ? result.mastery : [],
      recommendations: Array.isArray(result.recommendations) ? result.recommendations : [],
      trustStatus: "client-untrusted",
      createdAt: { __timestamp: new Date().toISOString() },
    }),
  };

  await firestoreRequest(`mathDiagnosticResults/${encodeURIComponent(resultId)}`, token, {
    method: "PATCH",
    body: JSON.stringify(document),
  });
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
    const result = {
      ...analyzed.result,
      ownerUid: auth.uid,
      diagnosticSummary,
      trustStatus: "client-untrusted",
    };

    await persistDiagnosticResult(token, result, responses);

    return json(200, {
      data: {
        result,
        responses: analyzed.responses,
        persisted: true,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};
