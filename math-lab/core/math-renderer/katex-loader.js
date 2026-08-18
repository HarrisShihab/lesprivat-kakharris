(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.mathRenderer = root.KakHarrisMathLab.mathRenderer || {};
  root.KakHarrisMathLab.mathRenderer.katexLoader = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const KATEX_VERSION = "0.18.1";
  const KATEX_SCRIPT_URL = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.js`;
  const KATEX_CSS_URL = `https://cdn.jsdelivr.net/npm/katex@${KATEX_VERSION}/dist/katex.min.css`;
  const SCRIPT_ID = "kakharris-mathlab-katex-script";
  const STYLE_ID = "kakharris-mathlab-katex-style";

  let loadPromise = null;

  function getGlobalKatex(globalObject) {
    const scope = globalObject || (typeof globalThis !== "undefined" ? globalThis : null);
    return scope && scope.katex ? scope.katex : null;
  }

  function ensureStylesheet(documentObject) {
    if (!documentObject || !documentObject.head) return null;
    const existing = documentObject.getElementById(STYLE_ID);
    if (existing) return existing;

    const link = documentObject.createElement("link");
    link.id = STYLE_ID;
    link.rel = "stylesheet";
    link.href = KATEX_CSS_URL;
    link.crossOrigin = "anonymous";
    documentObject.head.appendChild(link);
    return link;
  }

  function loadScript(documentObject, globalObject) {
    const existingKatex = getGlobalKatex(globalObject);
    if (existingKatex) return Promise.resolve(existingKatex);
    if (!documentObject || !documentObject.head) {
      return Promise.reject(new Error("KaTeX requires a browser document to load dynamically."));
    }

    if (loadPromise) return loadPromise;

    loadPromise = new Promise((resolve, reject) => {
      const existingScript = documentObject.getElementById(SCRIPT_ID);
      const script = existingScript || documentObject.createElement("script");

      const onLoad = () => {
        const katex = getGlobalKatex(globalObject);
        if (katex) {
          resolve(katex);
        } else {
          loadPromise = null;
          reject(new Error("KaTeX script loaded but window.katex was not found."));
        }
      };

      const onError = () => {
        loadPromise = null;
        reject(new Error("Unable to load KaTeX from the configured CDN."));
      };

      script.addEventListener("load", onLoad, { once: true });
      script.addEventListener("error", onError, { once: true });
      script.id = SCRIPT_ID;
      script.src = KATEX_SCRIPT_URL;
      script.async = true;
      script.crossOrigin = "anonymous";

      if (!existingScript) documentObject.head.appendChild(script);
    });

    return loadPromise;
  }

  function load(options) {
    const value = options || {};
    const globalObject = value.globalObject || (typeof globalThis !== "undefined" ? globalThis : null);
    const documentObject = value.documentObject || (typeof document !== "undefined" ? document : null);
    const existingKatex = getGlobalKatex(globalObject);

    if (existingKatex) {
      ensureStylesheet(documentObject);
      return Promise.resolve(existingKatex);
    }

    ensureStylesheet(documentObject);
    return loadScript(documentObject, globalObject);
  }

  return Object.freeze({
    KATEX_VERSION,
    KATEX_SCRIPT_URL,
    KATEX_CSS_URL,
    SCRIPT_ID,
    STYLE_ID,
    getGlobalKatex,
    ensureStylesheet,
    load,
  });
});
