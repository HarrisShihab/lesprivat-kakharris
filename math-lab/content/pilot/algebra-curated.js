(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.content = root.KakHarrisMathLab.content || {};
  root.KakHarrisMathLab.content.algebraCurated = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const fingerprint = typeof require === "function" ? require("../../core/question-system/fingerprint.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.fingerprint : null);

  function q(id, subtopicId, questionType, difficulty, indicatorIds, misconceptionCodes, prompt, options, mathExpressions, correctOptionIndex) {
    const optionList = options ? options.map((label, index) => ({ id: `opt-${index + 1}`, label })) : null;
    const contentVersion = "1.0";
    const evaluationId = `eval-${id}-${contentVersion}`;
    const question = {
      schemaVersion: "1.0",
      questionId: id,
      contentKind: "curated",
      questionType,
      status: "published",
      educationLevel: "SMP",
      grade: 7,
      phase: "D",
      subject: "matematika",
      topicId: "aljabar",
      subtopicId,
      difficulty,
      indicatorIds,
      misconceptionCodes,
      content: { prompt, options: optionList, mathExpressions: mathExpressions.map((source) => ({ source })), context: null, media: [] },
      evaluationRef: evaluationId,
      generation: { generatorId: null, generatorVersion: null, templateId: null, templateVersion: null },
      version: { contentVersion },
    };
    const evaluation = { evaluationId, questionId: id, questionVersion: contentVersion, questionType, specification: { correctOptionId: optionList ? optionList[correctOptionIndex].id : null } };
    if (fingerprint) question.fingerprint = fingerprint.createFingerprint(question);
    return { question, evaluation };
  }

  const records = [
    q("alg-cur-001", "variabel", "single_choice", "easy", ["concept"], ["ALG_VARIABLE_CONFUSION"], "Pada bentuk $3x + 5$, manakah yang merupakan variabel?", ["3", "x", "5", "8"], ["3x + 5"], 1),
    q("alg-cur-002", "variabel", "single_choice", "easy", ["concept"], ["ALG_VARIABLE_CONFUSION"], "Jika $x=4$, berapakah nilai $2x$?", ["2", "4", "6", "8"], ["x=4", "2x"], 3),
    q("alg-cur-005", "koefisien-konstanta", "single_choice", "easy", ["concept"], ["ALG_COEFF_CONST_CONFUSION"], "Pada $6x+4$, berapakah koefisien $x$?", ["4", "6", "10", "x"], ["6x+4"], 1),
    q("alg-cur-006", "koefisien-konstanta", "single_choice", "easy", ["concept"], ["ALG_COEFF_CONST_CONFUSION"], "Pada $5y-9$, konstanta adalah ...", ["5", "y", "-9", "9y"], ["5y-9"], 2),
    q("alg-cur-009", "suku-sejenis", "single_choice", "easy", ["concept"], ["ALG_LIKE_TERM_CONFUSION"], "Manakah pasangan suku yang sejenis?", ["$2x$ dan $3x$", "$2x$ dan $3y$", "$2x$ dan $3$", "$x^2$ dan $x$"], ["2x", "3x"], 0),
    q("alg-cur-010", "suku-sejenis", "single_choice", "easy", ["concept"], ["ALG_LIKE_TERM_CONFUSION"], "Manakah yang bukan suku sejenis dengan $5a$?", ["$2a$", "$-3a$", "$7a$", "$5b$"], ["5a"], 3),
    q("alg-cur-011", "suku-sejenis", "single_choice", "medium", ["procedure"], ["ALG_LIKE_TERM_CONFUSION"], "Sederhanakan $2x+5x$.", ["$7x$", "$10x$", "$7$", "$2x^5$"], ["2x+5x"], 0),
    q("alg-cur-012", "suku-sejenis", "single_choice", "medium", ["procedure"], ["ALG_LIKE_TERM_CONFUSION", "ALG_COEFFICIENT_OPERATION_ERROR"], "Sederhanakan $8y-3y$.", ["$5y$", "$11y$", "$5$", "$24y$"], ["8y-3y"], 0),
    q("alg-cur-013", "suku-sejenis", "single_choice", "hard", ["representation", "procedure"], ["ALG_LIKE_TERM_CONFUSION"], "Bentuk paling sederhana dari $3a+2b+4a$ adalah ...", ["$7a+2b$", "$9ab$", "$7a+6b$", "$3a+6b$"], ["3a+2b+4a"], 0),
    q("alg-cur-014", "operasi-bentuk-aljabar", "single_choice", "easy", ["procedure"], ["ALG_LIKE_TERM_CONFUSION"], "Sederhanakan $4x+2+3x$.", ["$7x+2$", "$7x+5$", "$12x+2$", "$4x+5$"], ["4x+2+3x"], 0),
    q("alg-cur-015", "operasi-bentuk-aljabar", "single_choice", "medium", ["procedure"], ["ALG_SIGN_OPERATION_ERROR"], "Sederhanakan $6x-4x+3$.", ["$2x+3$", "$10x+3$", "$2x-3$", "$24x+3$"], ["6x-4x+3"], 0),
    q("alg-cur-021", "plsv", "single_choice", "easy", ["procedure"], ["ALG_EQUATION_BALANCE_ERROR"], "Tentukan $x$: $x+4=9$.", ["4", "5", "9", "13"], ["x+4=9"], 1),
    q("alg-cur-022", "plsv", "single_choice", "medium", ["procedure"], ["ALG_EQUATION_BALANCE_ERROR", "ALG_SIGN_OPERATION_ERROR"], "Tentukan $x$: $x-3=8$.", ["5", "8", "11", "24"], ["x-3=8"], 2),
    q("alg-cur-027", "soal-cerita-aljabar", "single_choice", "medium", ["problem_solving", "representation"], ["ALG_STORY_TRANSLATION_ERROR"], "Dina memiliki $x$ buku. Ia mendapat 4 buku lagi sehingga memiliki 11 buku. Persamaan yang tepat adalah ...", ["$x-4=11$", "$x+4=11$", "$4x=11$", "$x+11=4"], ["x+4=11"], 1),
    q("alg-cur-029", "soal-cerita-aljabar", "single_choice", "hard", ["problem_solving"], ["ALG_STORY_TRANSLATION_ERROR"], "Harga sebuah buku adalah $x$ rupiah. Dua buku dan biaya sampul Rp2.000 berjumlah Rp12.000. Persamaan yang tepat adalah ...", ["$2x+2000=12000$", "$2x-2000=12000$", "$x+2000=12000$", "$2(x+2000)=12000$"], ["2x+2000=12000"], 0),
  ];

  return Object.freeze({ records: Object.freeze(records) });
});
