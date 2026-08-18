/**
 * Browser entry point for the generic Question System.
 *
 * The Question System files remain UMD-compatible for Node tests and legacy
 * consumers, but the browser must load them through a deterministic module
 * entry point so their dependency order does not depend on <script> tags.
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
  if (!questionSystem?.createPilotProvider) {
    throw new Error("Question System browser entry loaded, but createPilotProvider is unavailable.");
  }

  return questionSystem;
})();

root.KakHarrisMathLab.questionSystemReady = ready;
ready.then(() => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") {
    root.dispatchEvent(new root.CustomEvent("math-lab:question-system-ready"));
  }
}).catch((error) => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") {
    root.dispatchEvent(new root.CustomEvent("math-lab:question-system-error", { detail: error }));
  }
});

export default ready;
