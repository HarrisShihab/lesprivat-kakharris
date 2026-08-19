"use strict";

const crypto = require("crypto");
const pilot = require("./diagnostic-pilot.js");
const {
  json,
  methodGuard,
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
    const sessionId = `math-diagnostic-${crypto.randomUUID()}`;
    const startedAt = Date.now();

    return json(200, {
      data: {
        session: {
          contractVersion: "1.0",
          sessionId,
          ownerUid: auth.uid,
          sessionType: "diagnostic",
          educationLevel: "SMP",
          grade: 7,
          phase: "D",
          subject: "matematika",
          topicId: "aljabar",
          questionRefs: pilot.RECORDS.map((record) => record.question.questionId),
          questionVersions: Object.fromEntries(pilot.RECORDS.map((record) => [record.question.questionId, record.question.version.contentVersion])),
          startedAt,
          status: "active",
          trustStatus: "client-untrusted",
        },
        questions: pilot.getQuestions(),
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};
