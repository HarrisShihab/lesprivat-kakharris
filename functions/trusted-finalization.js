"use strict";

function requireNonEmptyString(value, field) {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!normalized) {
    const error = new Error(`${field} is required.`);
    error.code = "invalid-argument";
    throw error;
  }
  return normalized;
}

function evaluatePracticeResponses({ pilot, session, responses }) {
  if (!Array.isArray(responses) || responses.length !== session.questionRefs.length) {
    const error = new Error("Practice requires exactly one response per session question.");
    error.code = "failed-precondition";
    throw error;
  }

  const expectedIds = new Set(session.questionRefs.map(String));
  const seen = new Set();
  const evaluated = responses.map((item) => {
    const questionId = requireNonEmptyString(item?.questionId, "questionId");
    const answer = typeof item?.answer === "string" || typeof item?.answer === "number"
      ? String(item.answer).trim()
      : "";
    if (!answer) {
      const error = new Error(`Answer is required for ${questionId}.`);
      error.code = "invalid-argument";
      throw error;
    }
    if (!expectedIds.has(questionId) || seen.has(questionId)) {
      const error = new Error(`Invalid or duplicate questionId: ${questionId}.`);
      error.code = "invalid-argument";
      throw error;
    }
    seen.add(questionId);
    const evaluation = pilot.evaluate(questionId, answer);
    if (!evaluation) {
      const error = new Error(`Question evaluation is unavailable: ${questionId}.`);
      error.code = "failed-precondition";
      throw error;
    }
    return {
      questionId,
      questionVersion: String(session.questionVersions?.[questionId] || "1.0"),
      answer,
      isCorrect: evaluation.isCorrect === true,
      evaluationCode: evaluation.evaluationCode,
      misconceptionCode: evaluation.misconceptionCode || null,
      answeredAt: Number.isFinite(Number(item?.answeredAt)) ? Number(item.answeredAt) : null,
    };
  });

  if (seen.size !== expectedIds.size) {
    const error = new Error("Practice responses do not cover every trusted session question.");
    error.code = "failed-precondition";
    throw error;
  }

  const correctCount = evaluated.filter((item) => item.isCorrect).length;
  const totalQuestions = evaluated.length;
  return {
    responses: evaluated,
    correctCount,
    wrongCount: totalQuestions - correctCount,
    totalQuestions,
    score: Number(((correctCount / totalQuestions) * 100).toFixed(2)),
    accuracy: correctCount / totalQuestions,
  };
}

function normalizeDiagnosticResult({ pilot, sessionId, ownerUid, responses }) {
  const analyzed = pilot.analyze(sessionId, responses);
  const evaluatedResponses = analyzed.responses;
  const correctCount = evaluatedResponses.filter((response) => response.isCorrect === true).length;
  const totalQuestions = evaluatedResponses.length;
  const summary = {
    ...(analyzed.result.diagnosticSummary || {}),
    correctCount,
    wrongCount: totalQuestions - correctCount,
    totalQuestions,
    questionCount: totalQuestions,
    responseCount: totalQuestions,
    score: Number(((correctCount / totalQuestions) * 100).toFixed(2)),
  };

  return {
    ...analyzed.result,
    ownerUid,
    sessionId,
    sessionType: "diagnostic",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    score: summary.score,
    accuracy: totalQuestions ? correctCount / totalQuestions : 0,
    correctCount,
    wrongCount: totalQuestions - correctCount,
    totalQuestions,
    questionVersions: Object.fromEntries(pilot.RECORDS.map((record) => [record.question.questionId, record.question.version.contentVersion])),
    responses: evaluatedResponses,
    diagnosticSummary: summary,
    mastery: Array.isArray(analyzed.result.mastery) ? analyzed.result.mastery : [],
    recommendations: Array.isArray(analyzed.result.recommendations) ? analyzed.result.recommendations : [],
    trustStatus: "trusted",
  };
}

module.exports = { evaluatePracticeResponses, normalizeDiagnosticResult };
