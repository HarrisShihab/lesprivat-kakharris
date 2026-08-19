/**
 * Public-only Question System browser entry.
 * This file is intentionally loaded only by the anonymous Public Math Lab.
 * Authenticated Math Lab must use the trusted evaluation boundary instead.
 */
const root = globalThis;
root.KakHarrisMathLab = root.KakHarrisMathLab || {};

const ready = (async () => {
  const load = async (path) => import(path);
  await load("../contracts/question.js");
  await load("../contracts/taxonomy.js");
  await load("./fingerprint.js");
  await load("./versioning.js");
  await load("./question-factory.js");
  await load("./validator.js");
  await load("../../content/pilot/algebra-curated.js");
  await load("../../content/pilot/algebra-taxonomy.js");
  await load("./generators.js");
  await load("./story-templates.js");
  await load("./provider.js");
  await load("./index.js");
  const questionSystem = root.KakHarrisMathLab?.questionSystem;
  if (!questionSystem?.createPilotProvider) throw new Error("Public Question System failed to initialize.");
  return questionSystem;
})();

root.KakHarrisMathLab.publicQuestionSystemReady = ready;
ready.then(() => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") root.dispatchEvent(new root.CustomEvent("math-lab:public-question-system-ready"));
}).catch((error) => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") root.dispatchEvent(new root.CustomEvent("math-lab:public-question-system-error", { detail:error }));
});

export default ready;
