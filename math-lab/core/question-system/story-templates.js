(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = root.KakHarrisMathLab.questionSystem || {};
  root.KakHarrisMathLab.questionSystem.storyTemplates = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const factory = typeof require === "function" ? require("./question-factory.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.questionFactory : null);

  function createTemplate(definition) {
    return Object.freeze({ id: definition.id, version: definition.version, description: definition.description, generate: definition.generate });
  }

  function makeChoice(correct, distractors) {
    return [correct].concat(distractors).map((label, index) => ({ id: `opt-${index + 1}`, label: String(label) }));
  }

  function pslvStory(params) {
    const start = Number.isInteger(Number(params.start)) ? Number(params.start) : 8;
    const difference = Number.isInteger(Number(params.difference)) ? Number(params.difference) : 5;
    const total = start + difference;
    const correct = start;
    const options = makeChoice(correct, [difference, total, total - difference]);
    const questionId = `story-plsv-${start}-${difference}`;
    const question = {
      schemaVersion: "1.0",
      questionId,
      contentKind: "story-template",
      questionType: "single_choice",
      status: "published",
      educationLevel: "SMP",
      grade: 7,
      phase: "D",
      subject: "matematika",
      topicId: "aljabar",
      subtopicId: "soal-cerita-aljabar",
      difficulty: "medium",
      indicatorIds: ["problem_solving", "representation"],
      misconceptionCodes: ["ALG_STORY_TRANSLATION_ERROR", "ALG_EQUATION_BALANCE_ERROR"],
      content: {
        prompt: `Rani memiliki sejumlah pensil. Setelah membeli ${difference} pensil lagi, jumlahnya menjadi ${total}. Jika banyak pensil mula-mula dinyatakan dengan $x$, berapakah nilai $x$?`,
        options,
        mathExpressions: [{ source: `x + ${difference} = ${total}` }],
        context: { variables: { start, difference, total }, model: `x + ${difference} = ${total}` },
        media: [],
      },
      evaluationRef: null,
      generation: { generatorId: null, generatorVersion: null, templateId: "algebra.story-plsv-addition", templateVersion: "1.0" },
      version: { contentVersion: "1.0" },
    };
    const evaluation = { evaluationId: `eval-${questionId}-1.0`, questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    question.evaluationRef = evaluation.evaluationId;
    return factory.create(question, evaluation);
  }

  function quantityStory(params) {
    const bags = Number.isInteger(Number(params.bags)) ? Number(params.bags) : 4;
    const perBag = Number.isInteger(Number(params.perBag)) ? Number(params.perBag) : 3;
    const total = bags * perBag;
    const options = makeChoice(total, [bags + perBag, total - perBag, total + perBag]);
    const questionId = `story-quantity-${bags}-${perBag}`;
    const question = {
      schemaVersion: "1.0",
      questionId,
      contentKind: "story-template",
      questionType: "single_choice",
      status: "published",
      educationLevel: "SMP",
      grade: 7,
      phase: "D",
      subject: "matematika",
      topicId: "aljabar",
      subtopicId: "soal-cerita-aljabar",
      difficulty: "easy",
      indicatorIds: ["problem_solving", "concept"],
      misconceptionCodes: ["ALG_STORY_TRANSLATION_ERROR"],
      content: {
        prompt: `Sebuah toko menata ${bags} kotak. Setiap kotak berisi ${perBag} buku. Jika banyak buku dinyatakan sebagai $${bags}x$ saat $x=${perBag}$, berapa jumlah buku seluruhnya?`,
        options,
        mathExpressions: [{ source: `${bags}x`, }, { source: `x = ${perBag}` }],
        context: { variables: { bags, perBag, total }, model: `${bags}x` },
        media: [],
      },
      evaluationRef: null,
      generation: { generatorId: null, generatorVersion: null, templateId: "algebra.story-multiplication", templateVersion: "1.0" },
      version: { contentVersion: "1.0" },
    };
    const evaluation = { evaluationId: `eval-${questionId}-1.0`, questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    question.evaluationRef = evaluation.evaluationId;
    return factory.create(question, evaluation);
  }

  function ageStory(params) {
    const younger = Number.isInteger(Number(params.younger)) ? Number(params.younger) : 11;
    const difference = Number.isInteger(Number(params.difference)) ? Number(params.difference) : 4;
    const older = younger + difference;
    const options = makeChoice(younger, [older, difference, older + difference]);
    const questionId = `story-age-${younger}-${difference}`;
    const question = { schemaVersion: "1.0", questionId, contentKind: "story-template", questionType: "single_choice", status: "published", educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", subtopicId: "soal-cerita-aljabar", difficulty: "medium", indicatorIds: ["problem_solving", "representation"], misconceptionCodes: ["ALG_STORY_TRANSLATION_ERROR"], content: { prompt: `Usia kakak ${difference} tahun lebih tua dari adiknya. Jika usia kakak ${older} tahun dan usia adik dinyatakan $x$, berapakah nilai $x$?`, options, mathExpressions: [{ source: `x + ${difference} = ${older}` }], context: { variables: { younger, difference, older }, model: `x + ${difference} = ${older}` }, media: [] }, evaluationRef: null, generation: { generatorId: null, generatorVersion: null, templateId: "algebra.story-age", templateVersion: "1.0" }, version: { contentVersion: "1.0" } };
    const evaluation = { evaluationId: `eval-${questionId}-1.0`, questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    question.evaluationRef = evaluation.evaluationId;
    return factory.create(question, evaluation);
  }

  function bookStory(params) {
    const initial = Number.isInteger(Number(params.initial)) ? Number(params.initial) : 7;
    const added = Number.isInteger(Number(params.added)) ? Number(params.added) : 5;
    const total = initial + added;
    const options = makeChoice(initial, [initial - added, initial * added, added]);
    const questionId = `story-books-${initial}-${added}`;
    const question = { schemaVersion: "1.0", questionId, contentKind: "story-template", questionType: "single_choice", status: "published", educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", subtopicId: "soal-cerita-aljabar", difficulty: "easy", indicatorIds: ["problem_solving", "concept"], misconceptionCodes: ["ALG_STORY_TRANSLATION_ERROR"], content: { prompt: `Doni memiliki $x$ buku. Ia mendapat ${added} buku lagi sehingga jumlahnya menjadi ${total}. Berapakah nilai $x$?`, options, mathExpressions: [{ source: `x + ${added} = ${total}` }], context: { variables: { initial, added, total }, model: `x + ${added} = ${total}` }, media: [] }, evaluationRef: null, generation: { generatorId: null, generatorVersion: null, templateId: "algebra.story-books", templateVersion: "1.0" }, version: { contentVersion: "1.0" } };
    const evaluation = { evaluationId: `eval-${questionId}-1.0`, questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    question.evaluationRef = evaluation.evaluationId;
    return factory.create(question, evaluation);
  }

  function priceStory(params) {
    const quantity = Number.isInteger(Number(params.quantity)) ? Number(params.quantity) : 3;
    const unit = Number.isInteger(Number(params.unit)) ? Number(params.unit) : 4000;
    const total = quantity * unit;
    const options = makeChoice(total, [unit, total - unit, quantity + unit]);
    const questionId = `story-price-${quantity}-${unit}`;
    const question = { schemaVersion: "1.0", questionId, contentKind: "story-template", questionType: "single_choice", status: "published", educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", subtopicId: "soal-cerita-aljabar", difficulty: "medium", indicatorIds: ["problem_solving", "representation"], misconceptionCodes: ["ALG_STORY_TRANSLATION_ERROR"], content: { prompt: `Harga satu buku adalah $x$ rupiah. Jika membeli ${quantity} buku dengan harga Rp${unit.toLocaleString("id-ID") } per buku, berapa total harganya?`, options, mathExpressions: [{ source: `${quantity}x` }, { source: `x=${unit}` }], context: { variables: { quantity, unit, total }, model: `${quantity}x` }, media: [] }, evaluationRef: null, generation: { generatorId: null, generatorVersion: null, templateId: "algebra.story-price", templateVersion: "1.0" }, version: { contentVersion: "1.0" } };
    const evaluation = { evaluationId: `eval-${questionId}-1.0`, questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    question.evaluationRef = evaluation.evaluationId;
    return factory.create(question, evaluation);
  }

  function perimeterStory(params) {
    const length = Number.isInteger(Number(params.length)) ? Number(params.length) : 8;
    const width = Number.isInteger(Number(params.width)) ? Number(params.width) : 5;
    const perimeter = 2 * (length + width);
    const options = makeChoice(perimeter, [length + width, length * width, 2 * length + width]);
    const questionId = `story-perimeter-${length}-${width}`;
    const question = { schemaVersion: "1.0", questionId, contentKind: "story-template", questionType: "single_choice", status: "published", educationLevel: "SMP", grade: 7, phase: "D", subject: "matematika", topicId: "aljabar", subtopicId: "soal-cerita-aljabar", difficulty: "hard", indicatorIds: ["problem_solving", "representation"], misconceptionCodes: ["ALG_STORY_TRANSLATION_ERROR"], content: { prompt: `Panjang sebuah persegi panjang adalah $${length}$ cm dan lebarnya $${width}$ cm. Jika panjang dinyatakan $x$ dan lebar dinyatakan $y$, berapakah kelilingnya?`, options, mathExpressions: [{ source: `2x+2y` }, { source: `x=${length}` }, { source: `y=${width}` }], context: { variables: { length, width, perimeter }, model: `2x+2y` }, media: [] }, evaluationRef: null, generation: { generatorId: null, generatorVersion: null, templateId: "algebra.story-perimeter", templateVersion: "1.0" }, version: { contentVersion: "1.0" } };
    const evaluation = { evaluationId: `eval-${questionId}-1.0`, questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    question.evaluationRef = evaluation.evaluationId;
    return factory.create(question, evaluation);
  }

  return Object.freeze({
    PLSV_STORY: createTemplate({ id: "algebra.story-plsv-addition", version: "1.0", description: "Simple one-variable story mapped to a linear equation.", generate: pslvStory }),
    QUANTITY_STORY: createTemplate({ id: "algebra.story-multiplication", version: "1.0", description: "Simple quantity story using a variable substitution.", generate: quantityStory }),
    AGE_STORY: createTemplate({ id: "algebra.story-age", version: "1.0", description: "Simple age relationship story.", generate: ageStory }),
    BOOK_STORY: createTemplate({ id: "algebra.story-books", version: "1.0", description: "Simple quantity increase story.", generate: bookStory }),
    PRICE_STORY: createTemplate({ id: "algebra.story-price", version: "1.0", description: "Simple price-variable story.", generate: priceStory }),
    PERIMETER_STORY: createTemplate({ id: "algebra.story-perimeter", version: "1.0", description: "Simple perimeter expression story.", generate: perimeterStory }),
  });
});
