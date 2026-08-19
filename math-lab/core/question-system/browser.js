/**
 * Deterministic Math Lab browser boundary.
 * Student pages never load evaluation-bearing Question System modules.
 * Public and privileged admin pages use explicitly separated entries.
 */
const root = globalThis;
root.KakHarrisMathLab = root.KakHarrisMathLab || {};

const ready = (async () => {
  const current = typeof location !== "undefined" ? `${location.pathname}${location.search}${location.hash}` : "";
  if (/(?:^|\/)math-lab-public\.html(?:$|[?#])/.test(current)) return (await import("./public-browser.js")).default;
  if (/(?:^|\/)math-lab-my-learning\.html(?:$|[?#])/.test(current)) return (await import("./admin-browser.js")).default;
  return null;
})();

root.KakHarrisMathLab.questionSystemReady = ready;
ready.then(() => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") root.dispatchEvent(new root.CustomEvent("math-lab:question-system-ready"));
}).catch((error) => {
  if (typeof root.dispatchEvent === "function" && typeof root.CustomEvent === "function") root.dispatchEvent(new root.CustomEvent("math-lab:question-system-error", { detail:error }));
});

export default ready;
