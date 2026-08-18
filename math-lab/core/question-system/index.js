(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const curated = typeof require === "function" ? require("../../content/pilot/algebra-curated.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.content ? root.KakHarrisMathLab.content.algebraCurated : null);
  const taxonomy = typeof require === "function" ? require("../../content/pilot/algebra-taxonomy.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.content ? root.KakHarrisMathLab.content.algebraTaxonomy : null);
  const generators = typeof require === "function" ? require("./generators.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.generators : null);
  const storyTemplates = typeof require === "function" ? require("./story-templates.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.storyTemplates : null);
  const provider = typeof require === "function" ? require("./provider.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.provider : null);
  const validator = typeof require === "function" ? require("./validator.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.validator : null);
  const fingerprint = typeof require === "function" ? require("./fingerprint.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.fingerprint : null);
  const versioning = typeof require === "function" ? require("./versioning.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.versioning : null);

  function generatorMap() {
    return Object.keys(generators || {}).reduce((map, key) => {
      const item = generators[key];
      if (item && item.id) map[item.id] = item;
      return map;
    }, {});
  }

  function templateMap() {
    return Object.keys(storyTemplates || {}).reduce((map, key) => {
      const item = storyTemplates[key];
      if (item && item.id) map[item.id] = item;
      return map;
    }, {});
  }

  function getTaxonomy() {
    return Array.isArray(taxonomy?.records) ? taxonomy.records.slice() : [];
  }

  function createPilotProvider() {
    const evaluations = curated.records.reduce((map, entry) => {
      map[entry.evaluation.evaluationId] = entry.evaluation;
      return map;
    }, {});
    const providerInstance = provider.createProvider({
      curated: curated.records.map((entry) => entry.question),
      generators: generatorMap(),
      storyTemplates: templateMap(),
      evaluations,
    });
    return Object.freeze({ provider: providerInstance, evaluations, taxonomy: getTaxonomy() });
  }

  return Object.freeze({
    curated,
    taxonomy,
    generators,
    storyTemplates,
    provider,
    validator,
    fingerprint,
    versioning,
    createPilotProvider,
    getTaxonomy,
  });
});
