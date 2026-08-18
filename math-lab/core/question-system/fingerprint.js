(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = root.KakHarrisMathLab.questionSystem || {};
  root.KakHarrisMathLab.questionSystem.fingerprint = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function stableNormalize(value) {
    if (value === null || typeof value !== "object") return value;
    if (Array.isArray(value)) return value.map(stableNormalize);
    const output = {};
    Object.keys(value).sort().forEach((key) => {
      output[key] = stableNormalize(value[key]);
    });
    return output;
  }

  function canonicalize(value) {
    return JSON.stringify(stableNormalize(value));
  }

  function hash(value) {
    const input = String(value);
    let h1 = 0x811c9dc5;
    let h2 = 0x9e3779b9;
    for (let i = 0; i < input.length; i += 1) {
      const code = input.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= code + i;
      h2 = Math.imul(h2, 0x85ebca6b);
    }
    return `${(h1 >>> 0).toString(16).padStart(8, "0")}${(h2 >>> 0).toString(16).padStart(8, "0")}`;
  }

  function createFingerprint(question) {
    const value = question || {};
    const basis = {
      contentKind: value.contentKind,
      questionType: value.questionType,
      educationLevel: value.educationLevel,
      grade: value.grade,
      phase: value.phase,
      subject: value.subject,
      topicId: value.topicId,
      subtopicId: value.subtopicId,
      difficulty: value.difficulty,
      prompt: value.content && value.content.prompt,
      options: value.content && value.content.options,
      mathExpressions: value.content && value.content.mathExpressions,
      context: value.content && value.content.context,
      generation: value.generation,
      contentVersion: value.version && value.version.contentVersion,
    };
    return `qf_${hash(canonicalize(basis))}`;
  }

  return Object.freeze({ stableNormalize, canonicalize, hash, createFingerprint });
});
