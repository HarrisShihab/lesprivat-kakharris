(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.mathRenderer = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const SOURCE_FORMAT = "latex";
  const RENDERER_NAME = "katex";
  const CONTRACT_VERSION = "1.0";

  const SUPPORTED = Object.freeze([
    "numbers",
    "variables",
    "operators",
    "parentheses",
    "fractions",
    "exponents",
    "roots",
    "equations",
    "inequalities",
    "basic_alignment",
  ]);

  const schema = Object.freeze({
    contractVersion: "string",
    sourceFormat: "latex",
    displayMode: "boolean",
    fallbackText: "string",
  });

  function createRequest(source, options) {
    const value = options || {};
    return {
      contractVersion: CONTRACT_VERSION,
      sourceFormat: SOURCE_FORMAT,
      source: String(source ?? ""),
      displayMode: value.displayMode !== false,
      fallbackText: value.fallbackText == null ? String(source ?? "") : String(value.fallbackText),
    };
  }

  return Object.freeze({
    CONTRACT_VERSION,
    SOURCE_FORMAT,
    RENDERER_NAME,
    SUPPORTED,
    schema,
    createRequest,
  });
});
