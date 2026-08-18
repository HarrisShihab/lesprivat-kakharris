(function (root, factory) {
  "use strict";
  const api = factory(
    typeof require === "function" ? require("./contracts/session.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts ? root.KakHarrisMathLab.contracts.session : null),
    typeof require === "function" ? require("./contracts/result.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts ? root.KakHarrisMathLab.contracts.result : null),
    typeof require === "function" ? require("./math-renderer/math-renderer.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.mathRenderer ? root.KakHarrisMathLab.mathRenderer.MathRenderer : null),
    typeof require === "function" ? require("./answer-evaluator.js") : (root.KakHarrisMathLab ? root.KakHarrisMathLab.answerEvaluator : null)
  );
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.practiceSession = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (sessionContract, resultContract, MathRenderer, answerEvaluator) {
  "use strict";

  const SESSION_TYPE = "practice";
  const DEFAULT_QUESTION_COUNT = 10;
  const DEFAULT_MIX = Object.freeze({ generated: 5, curated: 3, storyTemplate: 2 });
  const INVALID_CODES = new Set([
    "INVALID_QUESTION",
    "INVALID_EVALUATION_SPEC",
    "INVALID_OPTION",
    "INVALID_NUMERIC",
    "INVALID_EXPRESSION",
    "INVALID_EXPRESSION_TYPE",
    "UNSUPPORTED_VARIABLE",
    "UNSUPPORTED_QUESTION_TYPE",
  ]);

  function clone(value) {
    return value === undefined ? undefined : JSON.parse(JSON.stringify(value));
  }

  function now() { return Date.now(); }

  function id(prefix) {
    const cryptoObject = typeof globalThis !== "undefined" ? globalThis.crypto : null;
    if (cryptoObject && typeof cryptoObject.randomUUID === "function") return `${prefix}-${cryptoObject.randomUUID()}`;
    return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function normalizeGrade(value) {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) && String(value).trim() !== "" ? number : String(value);
  }

  function isInvalidEvaluation(result) {
    return !result || INVALID_CODES.has(result.evaluationCode);
  }

  function shuffle(items, random) {
    const output = items.slice();
    const rng = typeof random === "function" ? random : Math.random;
    for (let i = output.length - 1; i > 0; i -= 1) {
      const j = Math.floor(rng() * (i + 1));
      [output[i], output[j]] = [output[j], output[i]];
    }
    return output;
  }

  function validateConfig(config) {
    const value = config || {};
    const required = ["educationLevel", "grade", "phase", "subject", "topicId"];
    const missing = required.filter((key) => value[key] === undefined || value[key] === null || value[key] === "");
    if (missing.length) throw new Error(`Missing session configuration: ${missing.join(", ")}`);
    const quantity = value.questionCount == null ? DEFAULT_QUESTION_COUNT : Number(value.questionCount);
    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > 50) throw new Error("questionCount must be an integer between 1 and 50.");
    const mix = { ...DEFAULT_MIX, ...(value.mix || {}) };
    if (Object.values(mix).some((item) => !Number.isInteger(Number(item)) || Number(item) < 0)) throw new Error("Question mix values must be non-negative integers.");
    const mixTotal = Number(mix.generated) + Number(mix.curated) + Number(mix.storyTemplate);
    if (mixTotal !== quantity) throw new Error(`Question mix total (${mixTotal}) must equal questionCount (${quantity}).`);
    return {
      ownerUid: value.ownerUid ?? null,
      educationLevel: String(value.educationLevel),
      grade: normalizeGrade(value.grade),
      phase: String(value.phase),
      subject: String(value.subject),
      topicId: String(value.topicId),
      subtopicId: value.subtopicId == null ? null : String(value.subtopicId),
      questionCount: quantity,
      mix: { generated: Number(mix.generated), curated: Number(mix.curated), storyTemplate: Number(mix.storyTemplate) },
      difficulty: value.difficulty,
      random: value.random,
      generatorRequests: Array.isArray(value.generatorRequests) ? clone(value.generatorRequests) : null,
      storyTemplateRequests: Array.isArray(value.storyTemplateRequests) ? clone(value.storyTemplateRequests) : null,
      evaluations: value.evaluations && typeof value.evaluations === "object" ? value.evaluations : null,
      questionPolicy: clonePolicy(value.questionPolicy),
    };
  }

  function createQuestionSet(provider, config) {
    if (!provider) throw new Error("Question Provider is required.");
    const mix = config.mix;
    if (typeof provider.clearSeen === "function") provider.clearSeen();

    const filters = {
      educationLevel: config.educationLevel,
      grade: config.grade,
      phase: config.phase,
      subject: config.subject,
      topicId: config.topicId,
      ...(config.subtopicId ? { subtopicId: config.subtopicId } : {}),
      ...(config.difficulty ? { difficulty: config.difficulty } : {}),
      status: "published",
      contentKind: "curated",
    };

    const curated = shuffle(provider.list(filters), config.random);
    const generatedRequests = config.generatorRequests || (config.questionPolicy && Array.isArray(config.questionPolicy.generatorRequests)
      ? config.questionPolicy.generatorRequests.slice(0, mix.generated)
      : []);
    const storyRequests = config.storyTemplateRequests || (config.questionPolicy && Array.isArray(config.questionPolicy.storyTemplateRequests)
      ? config.questionPolicy.storyTemplateRequests.slice(0, mix.storyTemplate)
      : []);
    const output = [];
    const fingerprints = new Set();

    function add(bundle) {
      if (!bundle || !bundle.question) return false;
      const fingerprint = bundle.question.fingerprint;
      if (fingerprint && fingerprints.has(fingerprint)) return false;
      fingerprints.add(fingerprint);
      output.push(bundle);
      return true;
    }

    for (const request of generatedRequests) {
      if (output.filter((item) => item.question.contentKind === "generated").length >= mix.generated) break;
      try { add(provider.generate(request.generatorId, request.params || {})); } catch (_) { /* skip invalid unavailable profile */ }
    }

    for (const question of curated) {
      if (output.filter((item) => item.question.contentKind === "curated").length >= mix.curated) break;
      const bundle = { question, evaluation: resolveEvaluation(provider, question, config.evaluations) };
      if (bundle.evaluation) add(bundle);
    }

    for (const request of storyRequests) {
      if (output.filter((item) => item.question.contentKind === "story-template").length >= mix.storyTemplate) break;
      try { add(provider.generateStory(request.templateId, request.params || {})); } catch (_) { /* skip invalid unavailable profile */ }
    }

    if (output.length !== config.questionCount) {
      throw new Error(`Unable to create practice question set. Requested ${config.questionCount}, got ${output.length}.`);
    }

    return shuffle(output, config.random);
  }

  function resolveEvaluation(provider, question, evaluations) {
    if (!provider || !question) return null;
    // Provider intentionally exposes only question presentation publicly. The internal
    // pilot provider keeps evaluations in its closure, so this hook is supplied by the
    // session manager's internal provider adapter when available.
    if (typeof provider.getEvaluation === "function") return provider.getEvaluation(question.evaluationRef);
    if (evaluations && question.evaluationRef) return clone(evaluations[question.evaluationRef]);
    return null;
  }

  function clonePolicy(policy) {
    return policy && typeof policy === "object" ? clone(policy) : { generatorRequests: null, storyTemplateRequests: null };
  }

  function createManager(options) {
    const value = options || {};
    const provider = value.provider;
    const evaluator = value.evaluator || answerEvaluator;
    const renderer = value.renderer || (MathRenderer && typeof MathRenderer.createRenderer === "function" ? MathRenderer.createRenderer(value.rendererOptions) : null);
    const history = [];
    const sessions = new Map();

    if (!provider) throw new Error("Practice Session requires a Question Provider.");
    if (!evaluator || typeof evaluator.evaluate !== "function") throw new Error("Practice Session requires an Answer Evaluator.");

    function getEvaluation(question, bundle) {
      if (bundle && bundle.evaluation) return clone(bundle.evaluation);
      if (typeof provider.getEvaluation === "function") return provider.getEvaluation(question.evaluationRef);
      if (value.evaluations && question && question.evaluationRef) return clone(value.evaluations[question.evaluationRef]);
      throw new Error(`Evaluation unavailable for question ${question && question.questionId ? question.questionId : "unknown"}.`);
    }

    function createSession(input) {
      const config = { ...validateConfig(input), evaluations: value.evaluations || null, questionPolicy: clonePolicy(value.questionPolicy) };
      const bundles = createQuestionSet(provider, {
        ...config,
        random: config.random,
        generatorRequests: config.generatorRequests,
        storyTemplateRequests: config.storyTemplateRequests,
        evaluations: config.evaluations,
        questionPolicy: config.questionPolicy,
      });
      const sessionId = id("math-session");
      const startedAt = now();
      const contract = sessionContract.create({
        sessionId,
        ownerUid: config.ownerUid,
        sessionType: SESSION_TYPE,
        educationLevel: config.educationLevel,
        grade: config.grade,
        phase: config.phase,
        subject: config.subject,
        topicId: config.topicId,
        subtopicId: config.subtopicId,
        questionRefs: bundles.map((bundle) => bundle.question.questionId),
        questionVersions: Object.fromEntries(bundles.map((bundle) => [bundle.question.questionId, bundle.question.version.contentVersion])),
        currentIndex: 0,
        status: "active",
        startedAt,
        finishedAt: null,
      });
      const state = {
        contract,
        config,
        bundles,
        answers: bundles.map(() => null),
        completed: false,
        startedAt,
        finishedAt: null,
        result: null,
      };
      sessions.set(sessionId, state);
      return createSnapshot(state);
    }

    function requireState(sessionId) {
      const state = sessions.get(sessionId);
      if (!state) throw new Error(`Unknown session: ${sessionId}`);
      return state;
    }

    function getQuestion(sessionId, index) {
      const state = requireState(sessionId);
      const target = index == null ? state.contract.currentIndex : Number(index);
      if (!Number.isInteger(target) || target < 0 || target >= state.bundles.length) throw new Error("Question index is out of range.");
      const bundle = state.bundles[target];
      return {
        index: target,
        total: state.bundles.length,
        question: publicQuestion(bundle.question),
        answered: Boolean(state.answers[target]),
        response: state.answers[target] ? clone(state.answers[target]) : null,
      };
    }

    function publicQuestion(question) {
      const copy = clone(question);
      delete copy.fingerprint;
      delete copy.evaluationRef;
      return copy;
    }

    function currentQuestion(sessionId) { return getQuestion(sessionId); }

    function goTo(sessionId, index) {
      const state = requireState(sessionId);
      if (state.completed) throw new Error("Completed session cannot be navigated.");
      const target = Number(index);
      if (!Number.isInteger(target) || target < 0 || target >= state.bundles.length) throw new Error("Question index is out of range.");
      state.contract.currentIndex = target;
      return getQuestion(sessionId, target);
    }

    function next(sessionId) {
      const state = requireState(sessionId);
      return goTo(sessionId, Math.min(state.bundles.length - 1, state.contract.currentIndex + 1));
    }

    function previous(sessionId) {
      const state = requireState(sessionId);
      return goTo(sessionId, Math.max(0, state.contract.currentIndex - 1));
    }

    function renderCurrent(sessionId, element, options) {
      const item = currentQuestion(sessionId);
      if (!renderer || typeof renderer.renderToElement !== "function") throw new Error("MathRenderer is unavailable.");
      const expressions = item.question.content && Array.isArray(item.question.content.mathExpressions)
        ? item.question.content.mathExpressions
        : [];
      if (!expressions.length) return Promise.resolve([]);

      let targets;
      if (Array.isArray(element)) {
        targets = element;
      } else if (expressions.length === 1) {
        targets = [element];
      } else if (element && element.ownerDocument && typeof element.ownerDocument.createElement === "function") {
        element.textContent = "";
        targets = expressions.map(() => {
          const child = element.ownerDocument.createElement("div");
          element.appendChild(child);
          return child;
        });
      } else {
        throw new Error("Multiple math expressions require an array of target elements or a DOM container.");
      }

      if (targets.length < expressions.length || targets.some((target) => !target)) {
        throw new Error("A target element is required for each rendered math expression.");
      }
      return Promise.all(expressions.map((expression, expressionIndex) =>
        renderer.renderToElement(targets[expressionIndex], expression.source, options)
      ));
    }

    function submitAnswer(sessionId, answer) {
      const state = requireState(sessionId);
      if (state.completed) throw new Error("Completed session cannot accept answers.");
      const index = state.contract.currentIndex;
      if (state.answers[index]) return { accepted: false, reason: "QUESTION_ALREADY_ANSWERED", response: clone(state.answers[index]) };
      const bundle = state.bundles[index];
      const evaluation = getEvaluation(bundle.question, bundle);
      const evaluated = evaluator.evaluate(bundle.question, evaluation, answer);
      if (isInvalidEvaluation(evaluated)) {
        return { accepted: false, reason: evaluated.evaluationCode, evaluation: clone(evaluated), response: null };
      }
      const response = {
        questionId: bundle.question.questionId,
        questionVersion: bundle.question.version.contentVersion,
        answer: clone(answer),
        isCorrect: evaluated.isCorrect === true,
        evaluationCode: evaluated.evaluationCode,
        misconceptionCode: evaluated.misconceptionCode ?? null,
        answeredAt: now(),
      };
      state.answers[index] = response;
      return { accepted: true, response: clone(response), remaining: state.answers.filter((item) => !item).length };
    }

    function calculateScore(state) {
      const total = state.answers.length;
      const correct = state.answers.filter((answer) => answer && answer.isCorrect).length;
      const wrong = state.answers.filter((answer) => answer && !answer.isCorrect).length;
      return {
        score: total ? Number(((correct / total) * 100).toFixed(2)) : 0,
        accuracy: total ? correct / total : 0,
        correctCount: correct,
        wrongCount: wrong,
        totalQuestions: total,
      };
    }

    function finalize(sessionId) {
      const state = requireState(sessionId);
      if (state.result) return clone(state.result);
      const unanswered = state.answers.filter((answer) => !answer).length;
      if (unanswered > 0) throw new Error(`Session cannot be completed: ${unanswered} question(s) unanswered.`);
      const finishedAt = now();
      const score = calculateScore(state);
      const result = resultContract.create({
        resultId: id("math-result"),
        sessionId: state.contract.sessionId,
        ownerUid: state.contract.ownerUid,
        sessionType: state.contract.sessionType,
        educationLevel: state.contract.educationLevel,
        grade: state.contract.grade,
        phase: state.contract.phase,
        subject: state.contract.subject,
        topicId: state.contract.topicId,
        score: score.score,
        accuracy: score.accuracy,
        correctCount: score.correctCount,
        wrongCount: score.wrongCount,
        totalQuestions: score.totalQuestions,
        duration: Math.max(0, finishedAt - state.startedAt),
        questionVersions: clone(state.contract.questionVersions),
        responses: clone(state.answers),
        diagnosticSummary: null,
        mastery: null,
        recommendations: [],
        createdAt: finishedAt,
        trustStatus: "client-untrusted",
      });
      state.completed = true;
      state.finishedAt = finishedAt;
      state.contract.status = "completed";
      state.contract.finishedAt = finishedAt;
      state.result = result;
      history.push(clone(result));
      return clone(result);
    }

    function abandon(sessionId) {
      const state = requireState(sessionId);
      if (state.completed) throw new Error("Completed session cannot be abandoned.");
      state.completed = true;
      state.finishedAt = now();
      state.contract.status = "abandoned";
      state.contract.finishedAt = state.finishedAt;
      return createSnapshot(state);
    }

    function getResult(sessionId) {
      const state = requireState(sessionId);
      return state.result ? clone(state.result) : null;
    }

    function getHistory(ownerUid) {
      const items = ownerUid === undefined ? history : history.filter((item) => item.ownerUid === ownerUid);
      return clone(items);
    }

    function getSession(sessionId) { return createSnapshot(requireState(sessionId)); }

    function createSnapshot(state) {
      return {
        session: clone(state.contract),
        progress: {
          currentIndex: state.contract.currentIndex,
          totalQuestions: state.bundles.length,
          answeredCount: state.answers.filter(Boolean).length,
          unansweredCount: state.answers.filter((item) => !item).length,
        },
        currentQuestion: getQuestion(state.contract.sessionId),
      };
    }

    return Object.freeze({
      createSession,
      getSession,
      getQuestion,
      currentQuestion,
      goTo,
      next,
      previous,
      renderCurrent,
      submitAnswer,
      finalize,
      abandon,
      getResult,
      getHistory,
    });
  }

  return Object.freeze({
    SESSION_TYPE,
    DEFAULT_QUESTION_COUNT,
    DEFAULT_MIX,
    createManager,
    validateConfig,
  });
});
