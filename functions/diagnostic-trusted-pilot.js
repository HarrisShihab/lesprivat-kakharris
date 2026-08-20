"use strict";

const pilot = require("./math-lab-pilot.js");

const CURATED_IDS = [
  "alg-cur-001", "alg-cur-002", "alg-cur-005", "alg-cur-011",
  "alg-cur-012", "alg-cur-015", "alg-cur-027", "alg-cur-029",
];

function collectPilotRecords() {
  const curated = new Map();
  const generated = new Map();
  const stories = new Map();
  for (let attempt = 0; attempt < 200 && curated.size < CURATED_IDS.length; attempt += 1) {
    for (const entry of pilot.createPractice()) {
      const q = entry.question;
      if (q.contentKind === "curated" && CURATED_IDS.includes(q.questionId)) curated.set(q.questionId, entry);
      if (q.contentKind === "generated") generated.set(q.questionId, entry);
      if (q.contentKind === "story-template") stories.set(q.questionId, entry);
    }
    if (generated.size >= 2 && stories.size >= 2 && curated.size === CURATED_IDS.length) break;
  }
  if (curated.size !== CURATED_IDS.length || generated.size < 2 || stories.size < 2) {
    throw new Error("Trusted Diagnostic pilot could not assemble the required 8/2/2 distribution.");
  }
  return [
    ...CURATED_IDS.map((id) => curated.get(id)),
    ...Array.from(generated.values()).slice(0, 2),
    ...Array.from(stories.values()).slice(0, 2),
  ];
}

const RECORDS = Object.freeze(collectPilotRecords());
const BY_ID = new Map(RECORDS.map((entry) => [entry.question.questionId, entry]));

function getQuestions() {
  return RECORDS.map((entry) => entry.question);
}

function evaluateAnswer(questionId, answer) {
  const entry = BY_ID.get(String(questionId || ""));
  if (!entry) return null;
  return pilot.evaluate(questionId, answer);
}

function analyze(sessionId, rawResponses) {
  if (!Array.isArray(rawResponses) || rawResponses.length !== RECORDS.length) {
    const error = new Error(`Diagnostic requires exactly ${RECORDS.length} responses.`);
    error.code = "invalid-argument";
    throw error;
  }

  const seen = new Set();
  const responses = rawResponses.map((item) => {
    const questionId = String(item?.questionId || "").trim();
    if (seen.has(questionId) || !BY_ID.has(questionId)) {
      const error = new Error(`Invalid or duplicate diagnostic questionId: ${questionId}.`);
      error.code = "invalid-argument";
      throw error;
    }
    seen.add(questionId);
    const answer = typeof item?.answer === "string" || typeof item?.answer === "number" ? String(item.answer).trim() : "";
    if (!answer) {
      const error = new Error(`Answer is required for ${questionId}.`);
      error.code = "invalid-argument";
      throw error;
    }
    const evaluation = evaluateAnswer(questionId, answer);
    if (!evaluation) throw Object.assign(new Error(`Question evaluation unavailable: ${questionId}.`), { code: "failed-precondition" });
    const entry = BY_ID.get(questionId);
    return {
      questionId,
      questionVersion: String(entry.question.version.contentVersion),
      answer,
      isCorrect: evaluation.isCorrect === true,
      evaluationCode: evaluation.evaluationCode,
      misconceptionCode: evaluation.misconceptionCode || null,
    };
  });

  const evidence = new Map();
  for (const response of responses) {
    const entry = BY_ID.get(response.questionId);
    for (const indicatorId of entry.question.indicatorIds || []) {
      const current = evidence.get(indicatorId) || { indicatorId, questionCount: 0, correctCount: 0, accuracy: 0 };
      current.questionCount += 1;
      if (response.isCorrect) current.correctCount += 1;
      current.accuracy = current.correctCount / current.questionCount;
      evidence.set(indicatorId, current);
    }
  }

  const indicatorEvidence = Array.from(evidence.values());
  const mastery = indicatorEvidence.map((item) => ({
    indicatorId: item.indicatorId,
    mastery: item.accuracy >= 0.8 ? "mastered" : item.accuracy >= 0.5 ? "developing" : "needs-support",
    accuracy: item.accuracy,
    evidenceCount: item.questionCount,
  }));

  const recommendationText = {
    concept: "Review konsep dasar aljabar.",
    procedure: "Lakukan Practice bertahap pada prosedur operasi aljabar.",
    representation: "Latihan menghubungkan situasi dengan bentuk aljabar.",
    problem_solving: "Lakukan Practice soal cerita aljabar bertahap.",
  };
  const weak = mastery.filter((item) => item.mastery !== "mastered");
  const recommendations = weak.map((item) => ({
    indicatorId: item.indicatorId,
    priority: item.mastery === "needs-support" ? "high" : "medium",
    action: recommendationText[item.indicatorId] || "Lakukan Practice tambahan pada indikator ini.",
  }));

  const correctCount = responses.filter((response) => response.isCorrect).length;
  const totalQuestions = responses.length;
  return {
    result: {
      contractVersion: "1.0",
      resultId: `math-diagnostic-result-${sessionId}`,
      sessionId,
      sessionType: "diagnostic",
      educationLevel: "SMP",
      grade: 7,
      phase: "D",
      subject: "matematika",
      topicId: "aljabar",
      score: Number(((correctCount / totalQuestions) * 100).toFixed(2)),
      accuracy: correctCount / totalQuestions,
      correctCount,
      wrongCount: totalQuestions - correctCount,
      totalQuestions,
      questionVersions: Object.fromEntries(RECORDS.map((entry) => [entry.question.questionId, entry.question.version.contentVersion])),
      responses,
      diagnosticSummary: {
        questionCount: totalQuestions,
        responseCount: totalQuestions,
        correctCount,
        wrongCount: totalQuestions - correctCount,
        score: Number(((correctCount / totalQuestions) * 100).toFixed(2)),
      },
      indicatorEvidence,
      mastery,
      recommendations,
      trustStatus: "trusted",
    },
    responses,
  };
}

module.exports = Object.freeze({ RECORDS, getQuestions, evaluateAnswer, analyze });
