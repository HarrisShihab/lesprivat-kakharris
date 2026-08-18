(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.content = root.KakHarrisMathLab.content || {};
  root.KakHarrisMathLab.content.algebraPractice = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  // Pilot policy only. Practice Session itself remains generic and knows nothing
  // about Algebra IDs; this file supplies the pilot's content selection policy.
  const generatorRequests = Object.freeze([
    { generatorId: "algebra.variable-value", params: { x: 7, add: 5 } },
    { generatorId: "algebra.coefficient-identification", params: { coefficient: 6, constant: 4 } },
    { generatorId: "algebra.like-terms", params: { a: 2, b: 5 } },
    { generatorId: "algebra.linear-combination", params: { a: 3, b: 4, c: 2, d: 5 } },
    { generatorId: "algebra.plsv-addition", params: { x: 7, add: 5 } },
    { generatorId: "algebra.linear-subtraction", params: { a: 8, b: 3, c: 2 } },
    { generatorId: "algebra.distributive", params: { k: 3, a: 4, b: 2 } },
    { generatorId: "algebra.plsv-multiplication", params: { coefficient: 3, x: 6 } },
    { generatorId: "algebra.variable-difference", params: { x: 12, subtract: 5 } },
  ]);

  const storyTemplateRequests = Object.freeze([
    { templateId: "algebra.story-plsv-addition", params: { start: 9, difference: 6 } },
    { templateId: "algebra.story-books", params: { initial: 7, added: 5 } },
    { templateId: "algebra.story-age", params: { younger: 11, difference: 4 } },
    { templateId: "algebra.story-price", params: { quantity: 3, unit: 4000 } },
    { templateId: "algebra.story-multiplication", params: { bags: 4, perBag: 3 } },
    { templateId: "algebra.story-perimeter", params: { length: 8, width: 5 } },
  ]);

  return Object.freeze({ generatorRequests, storyTemplateRequests });
});
