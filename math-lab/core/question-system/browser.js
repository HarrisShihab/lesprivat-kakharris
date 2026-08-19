/**
 * Authenticated-safe browser entry for Math Lab.
 *
 * The evaluation-bearing Question System is deliberately isolated from this
 * entry. The anonymous Public Math Lab may opt into the separate public entry;
 * authenticated Math Lab must use the trusted evaluation boundary.
 */
const root = globalThis;
root.KakHarrisMathLab = root.KakHarrisMathLab || {};

const ready = (async () => {
  const isPublic = typeof location !== "undefined" && /(?:^|\/)math-lab-public\.html(?:$|[?#])/.test(location.pathname + location.search + location.hash);
  if (isPublic) return import("./public-browser.js").then((module) => module.default || root.KakHarrisMathLab?.publicQuestionSystemReady);
  return null;
})();

root.KakHarrisMathLab.questionSystemReady = ready;
ready.then(() => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") root.dispatchEvent(new root.CustomEvent("math-lab:question-system-ready"));
}).catch((error) => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") root.dispatchEvent(new root.CustomEvent("math-lab:question-system-error", { detail:error }));
});

export default ready;
