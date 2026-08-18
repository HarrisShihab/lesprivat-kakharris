(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.diagnostic = root.KakHarrisMathLab.diagnostic || {};
  root.KakHarrisMathLab.diagnostic.recommendation = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const contract = typeof require === "function"
    ? require("./contracts/recommendation.js")
    : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts && root.KakHarrisMathLab.contracts.recommendation);

  const ACTIONS = Object.freeze({
    insufficient: "review_indicator",
    developing: "practice_indicator",
    mastered: "maintain_indicator",
  });

  const PRIORITIES = Object.freeze({
    insufficient: "high",
    developing: "medium",
    mastered: "low",
  });

  function recommendationFor(mastery) {
    if (!mastery || typeof mastery.indicatorId !== "string") return null;
    const level = mastery.level;
    if (!Object.prototype.hasOwnProperty.call(ACTIONS, level)) return null;

    const reasons = {
      insufficient: "Evidence indicates the indicator needs review before further progression.",
      developing: "Evidence indicates partial mastery and a need for additional practice.",
      mastered: "Evidence indicates the indicator is currently mastered; maintain it through continued use.",
    };

    return contract.create({
      recommendationId: `REC_${level.toUpperCase()}`,
      indicatorId: mastery.indicatorId,
      priority: PRIORITIES[level],
      action: ACTIONS[level],
      reason: reasons[level],
    });
  }

  function generate(masteryList) {
    if (!Array.isArray(masteryList)) throw new TypeError("Mastery must be an array.");
    return masteryList.map(recommendationFor).filter(Boolean);
  }

  return Object.freeze({ generate, recommendationFor, ACTIONS, PRIORITIES });
});
