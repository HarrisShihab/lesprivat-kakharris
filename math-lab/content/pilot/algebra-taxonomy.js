(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.content = root.KakHarrisMathLab.content || {};
  root.KakHarrisMathLab.content.algebraTaxonomy = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const taxonomy = typeof require === "function" ? require("../../core/contracts/taxonomy.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.contracts ? root.KakHarrisMathLab.contracts.taxonomy : null);

  const INDICATORS = taxonomy ? taxonomy.INDICATORS : ["concept", "procedure", "representation", "problem_solving", "communication"];
  const base = {
    schemaVersion: "1.0",
    educationLevel: "SMP",
    grade: 7,
    phase: "D",
    subject: "matematika",
    topicId: "aljabar",
    status: "published",
  };

  const items = [
    { subtopicId: "variabel", title: "Variabel", prerequisiteIds: [], indicatorIds: [INDICATORS[0]] },
    { subtopicId: "koefisien-konstanta", title: "Koefisien dan Konstanta", prerequisiteIds: ["variabel"], indicatorIds: [INDICATORS[0], INDICATORS[1]] },
    { subtopicId: "suku-sejenis", title: "Suku Sejenis", prerequisiteIds: ["variabel", "koefisien-konstanta"], indicatorIds: [INDICATORS[0], INDICATORS[1]] },
    { subtopicId: "operasi-bentuk-aljabar", title: "Operasi Bentuk Aljabar", prerequisiteIds: ["suku-sejenis"], indicatorIds: [INDICATORS[1], INDICATORS[2]] },
    { subtopicId: "plsv", title: "Persamaan Linear Satu Variabel", prerequisiteIds: ["operasi-bentuk-aljabar"], indicatorIds: [INDICATORS[1], INDICATORS[2]] },
    { subtopicId: "soal-cerita-aljabar", title: "Soal Cerita Aljabar Sederhana", prerequisiteIds: ["plsv"], indicatorIds: [INDICATORS[2], INDICATORS[3]] },
  ];

  const records = items.map((item) => Object.assign({}, base, item));
  return Object.freeze({ TOPIC_ID: "aljabar", records: Object.freeze(records) });
});
