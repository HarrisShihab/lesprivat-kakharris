(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = root.KakHarrisMathLab.questionSystem || {};
  root.KakHarrisMathLab.questionSystem.provider = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const validator = typeof require === "function" ? require("./validator.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.validator : null);
  const fingerprint = typeof require === "function" ? require("./fingerprint.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.fingerprint : null);
  const factory = typeof require === "function" ? require("./question-factory.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.questionFactory : null);

  function clone(value) { return JSON.parse(JSON.stringify(value)); }

  function defaultFilter(question, filters) {
    const keys = ["educationLevel", "grade", "phase", "subject", "topicId", "subtopicId", "difficulty", "contentKind", "questionType", "status"];
    return keys.every((key) => filters[key] === undefined || filters[key] === null || question[key] === filters[key]);
  }

  function createProvider(options) {
    const value = options || {};
    const curated = Array.isArray(value.curated) ? value.curated : [];
    const evaluations = value.evaluations || {};
    const generators = value.generators || {};
    const storyTemplates = value.storyTemplates || {};
    const seenFingerprints = new Set();

    function validateEntry(entry) {
      const result = validator.validateQuestion(entry.question || entry, { evaluationSpec: entry.evaluation });
      if (!result.valid) {
        const error = new Error(`Invalid question: ${entry.question?.questionId || entry.questionId || "unknown"}`);
        error.issues = result.issues;
        throw error;
      }
      return result;
    }

    function register(questionBundle) {
      const result = validateEntry(questionBundle);
      const question = questionBundle.question || questionBundle;
      const fp = question.fingerprint || result.fingerprint;
      if (seenFingerprints.has(fp)) return false;
      seenFingerprints.add(fp);
      return true;
    }

    curated.forEach((entry) => register({ question: entry, evaluation: entry.evaluation }));

    function list(filters) {
      const filter = filters || {};
      return curated
        .filter((question) => defaultFilter(question, filter))
        .map((question) => clone(question));
    }

    function findById(questionId) {
      const found = curated.find((question) => question.questionId === questionId);
      return found ? clone(found) : null;
    }

    function generate(generatorId, params) {
      const generator = generators[generatorId];
      if (!generator || typeof generator.generate !== "function") throw new Error(`Unknown generator: ${generatorId}`);
      const bundle = generator.generate(params || {});
      const result = validateEntry(bundle);
      const question = bundle.question;
      const fp = question.fingerprint || result.fingerprint;
      if (seenFingerprints.has(fp)) throw new Error(`Duplicate generated question fingerprint: ${fp}`);
      seenFingerprints.add(fp);
      return clone(bundle);
    }

    function generateStory(templateId, params) {
      const template = storyTemplates[templateId];
      if (!template || typeof template.generate !== "function") throw new Error(`Unknown story template: ${templateId}`);
      const bundle = template.generate(params || {});
      const result = validateEntry(bundle);
      const question = bundle.question;
      const fp = question.fingerprint || result.fingerprint;
      if (seenFingerprints.has(fp)) throw new Error(`Duplicate story question fingerprint: ${fp}`);
      seenFingerprints.add(fp);
      return clone(bundle);
    }

    function createQuestionSet(policy) {
      const spec = policy || {};
      const quantity = Number(spec.quantity || 0);
      if (!Number.isInteger(quantity) || quantity <= 0) throw new Error("quantity must be a positive integer.");
      const output = [];
      const localFingerprints = new Set();

      function addBundle(bundle) {
        const result = validator.validateQuestion(bundle.question, { evaluationSpec: bundle.evaluation });
        if (!result.valid) throw new Error(`Invalid question set item: ${result.issues.map((x) => x.message).join("; ")}`);
        const fp = bundle.question.fingerprint || result.fingerprint;
        if (localFingerprints.has(fp)) return false;
        localFingerprints.add(fp);
        output.push(clone(bundle));
        return true;
      }

      const curatedCandidates = list(spec.filters || {});
      for (const question of curatedCandidates) {
        if (output.length >= quantity) break;
        const evaluation = evaluations[question.evaluationRef] || (spec.evaluations && spec.evaluations[question.evaluationRef]);
        if (evaluation) addBundle({ question, evaluation });
      }

      const generatedRequests = Array.isArray(spec.generated) ? spec.generated : [];
      for (const request of generatedRequests) {
        if (output.length >= quantity) break;
        addBundle(generate(request.generatorId, request.params));
      }

      const storyRequests = Array.isArray(spec.storyTemplates) ? spec.storyTemplates : [];
      for (const request of storyRequests) {
        if (output.length >= quantity) break;
        addBundle(generateStory(request.templateId, request.params));
      }

      if (output.length !== quantity) throw new Error(`Unable to build requested question set. Requested ${quantity}, got ${output.length}.`);
      return output;
    }

    function clearSeen() { seenFingerprints.clear(); curated.forEach((entry) => register({ question: entry, evaluation: entry.evaluation })); }

    return Object.freeze({ list, findById, generate, generateStory, createQuestionSet, validateEntry, clearSeen });
  }

  return Object.freeze({ createProvider });
});
