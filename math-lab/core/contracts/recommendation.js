(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.contracts = root.KakHarrisMathLab.contracts || {};
  root.KakHarrisMathLab.contracts.recommendation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const CONTRACT_VERSION = "1.0";
  const PRIORITIES = Object.freeze(["high", "medium", "low"]);
  const schema = Object.freeze({
    contractVersion: "string",
    recommendationId: "string",
    indicatorId: "string|null",
    priority: "high|medium|low",
    action: "string",
    reason: "string",
  });

  function create(input) {
    const value = input || {};
    return {
      contractVersion: value.contractVersion || CONTRACT_VERSION,
      recommendationId: value.recommendationId || null,
      indicatorId: value.indicatorId ?? null,
      priority: value.priority || "medium",
      action: value.action || "",
      reason: value.reason || "",
    };
  }

  return Object.freeze({ CONTRACT_VERSION, PRIORITIES, schema, create });
});
