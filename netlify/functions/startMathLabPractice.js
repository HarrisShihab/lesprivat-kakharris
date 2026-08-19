"use strict";

const crypto = require("crypto");
const pilot = require("../../functions/math-lab-pilot.js");
const {
  json,
  methodGuard,
  readBody,
  bearer,
  verifyIdToken,
  errorResponse,
} = require("./math-lab-trusted-utils.js");

function validateConfig(data) {
  const value = data || {};
  if (String(value.educationLevel || "SMP") !== "SMP" || Number(value.grade || 7) !== 7 || String(value.phase || "D") !== "D" || String(value.subject || "matematika") !== "matematika" || String(value.topicId || "aljabar") !== "aljabar") {
    const error = new Error("The current Math Lab trusted pilot only provisions the Algebra Grade 7 pilot.");
    error.statusCode = 412;
    throw error;
  }
  return {
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    subtopicId: value.subtopicId ? String(value.subtopicId) : null,
  };
}

exports.handler = async (event) => {
  const methodError = methodGuard(event);
  if (methodError) return methodError;

  try {
    const token = bearer(event);
    const auth = await verifyIdToken(token);
    const config = validateConfig(readBody(event)?.data);
    const questions = pilot.createPractice().map((entry) => entry.question);
    if (questions.length !== 10) {
      const error = new Error("Trusted Math Lab pilot returned an invalid question count.");
      error.statusCode = 500;
      throw error;
    }

    const id = `math-session-${crypto.randomUUID()}`;
    const startedAt = Date.now();
    const questionVersions = Object.fromEntries(questions.map((question) => [question.questionId, question.version.contentVersion]));

    // Persistence remains in the existing authenticated Firestore client path.
    // The trusted boundary is the question/evaluation source, not the score.
    return json(200, {
      data: {
        session: {
          contractVersion: "1.0",
          sessionId: id,
          ownerUid: auth.uid,
          sessionType: "practice",
          educationLevel: config.educationLevel,
          grade: config.grade,
          phase: config.phase,
          subject: config.subject,
          topicId: config.topicId,
          subtopicId: config.subtopicId,
          questionRefs: questions.map((question) => question.questionId),
          questionVersions,
          currentIndex: 0,
          status: "active",
          startedAt,
          finishedAt: null,
          responses: [],
          trustStatus: "client-untrusted",
          updatedAt: startedAt,
        },
        questions,
      },
    });
  } catch (error) {
    return errorResponse(error);
  }
};
