(function (root, factory) {
  "use strict";
  const api = factory(root);
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.questionSystem = root.KakHarrisMathLab.questionSystem || {};
  root.KakHarrisMathLab.questionSystem.generators = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function (root) {
  "use strict";

  const factory = typeof require === "function" ? require("./question-factory.js") : (root.KakHarrisMathLab && root.KakHarrisMathLab.questionSystem ? root.KakHarrisMathLab.questionSystem.questionFactory : null);

  function requireFactory() {
    if (!factory) throw new Error("Question factory is unavailable.");
    return factory;
  }

  function integer(value, fallback) {
    const number = Number(value);
    return Number.isInteger(number) ? number : fallback;
  }

  function difficultyForRange(min, max) {
    const span = max - min;
    if (span <= 8) return "easy";
    if (span <= 20) return "medium";
    return "hard";
  }

  function base(overrides) {
    return Object.assign({
      schemaVersion: "1.0",
      contentKind: "generated",
      questionType: "single_choice",
      status: "published",
      educationLevel: "SMP",
      grade: 7,
      phase: "D",
      subject: "matematika",
      topicId: "aljabar",
      subtopicId: null,
      difficulty: "easy",
      indicatorIds: ["concept"],
      misconceptionCodes: [],
      content: { prompt: "", options: null, mathExpressions: [], context: null, media: [] },
      evaluationRef: null,
      generation: { generatorId: null, generatorVersion: "1.0", templateId: null, templateVersion: null },
      version: { contentVersion: "1.0" },
    }, overrides);
  }

  function makeChoiceOptions(correct, distractors) {
    const values = [correct].concat(distractors);
    return values.map((label, index) => ({ id: `opt-${index + 1}`, label: String(label) }));
  }

  function variableValue(params) {
    const x = integer(params.x, 7);
    const add = integer(params.add, 5);
    const correct = x + add;
    const options = makeChoiceOptions(correct, [x - add, x * add, x]);
    const input = base({
      questionId: `gen-variable-${x}-${add}`,
      subtopicId: "variabel",
      difficulty: difficultyForRange(Math.min(x, add), Math.max(x, add)),
      content: {
        prompt: "Jika nilai $x$ adalah " + x + ", berapakah nilai $x + " + add + "$?",
        options,
        mathExpressions: [{ source: `x = ${x}` }, { source: `x + ${add}` }],
        context: null,
        media: [],
      },
      indicatorIds: ["concept"],
      misconceptionCodes: ["ALG_VARIABLE_CONFUSION"],
      generation: { generatorId: "algebra.variable-value", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function coefficient(params) {
    const coefficientValue = integer(params.coefficient, 7);
    const constant = integer(params.constant, 3);
    const options = makeChoiceOptions(coefficientValue, [constant, coefficientValue + constant, coefficientValue - 1]);
    const input = base({
      questionId: `gen-coefficient-${coefficientValue}-${constant}`,
      subtopicId: "koefisien-konstanta",
      content: {
        prompt: `Pada bentuk $${coefficientValue}x + ${constant}$, berapakah koefisien $x$?`,
        options,
        mathExpressions: [{ source: `${coefficientValue}x + ${constant}` }],
        context: null,
        media: [],
      },
      misconceptionCodes: ["ALG_COEFF_CONST_CONFUSION"],
      generation: { generatorId: "algebra.coefficient-identification", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function likeTerms(params) {
    const a = integer(params.a, 2);
    const b = integer(params.b, 5);
    const correct = `${a + b}x`;
    const options = makeChoiceOptions(correct, [`${a * b}x`, `${a + b}`, `${a}x + ${b}`]);
    const input = base({
      questionId: `gen-like-terms-${a}-${b}`,
      subtopicId: "suku-sejenis",
      content: {
        prompt: `Sederhanakan $${a}x + ${b}x$.`,
        options,
        mathExpressions: [{ source: `${a}x + ${b}x` }],
        context: null,
        media: [],
      },
      indicatorIds: ["procedure"],
      misconceptionCodes: ["ALG_LIKE_TERM_CONFUSION", "ALG_COEFFICIENT_OPERATION_ERROR"],
      generation: { generatorId: "algebra.like-terms", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function simplifyLinear(params) {
    const a = integer(params.a, 3);
    const b = integer(params.b, 4);
    const c = integer(params.c, 2);
    const d = integer(params.d, 5);
    const coefficientValue = a + c;
    const constantValue = b + d;
    const correct = `${coefficientValue}x + ${constantValue}`;
    const options = makeChoiceOptions(correct, [`${a + c}x + ${b - d}`, `${a * c}x + ${constantValue}`, `${coefficientValue}x + ${b - d}`]);
    const input = base({
      questionId: `gen-linear-op-${a}-${b}-${c}-${d}`,
      subtopicId: "operasi-bentuk-aljabar",
      difficulty: "medium",
      content: {
        prompt: `Sederhanakan $${a}x + ${b} + ${c}x + ${d}$.`,
        options,
        mathExpressions: [{ source: `${a}x + ${b} + ${c}x + ${d}` }],
        context: null,
        media: [],
      },
      indicatorIds: ["procedure", "representation"],
      misconceptionCodes: ["ALG_LIKE_TERM_CONFUSION", "ALG_COEFFICIENT_OPERATION_ERROR"],
      generation: { generatorId: "algebra.linear-combination", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function plsv(params) {
    const x = integer(params.x, 7);
    const add = integer(params.add, 5);
    const options = makeChoiceOptions(x, [x + add, x - add, add]);
    const input = base({
      questionId: `gen-plsv-${x}-${add}`,
      subtopicId: "plsv",
      difficulty: "medium",
      content: {
        prompt: `Tentukan nilai $x$ yang memenuhi persamaan $x + ${add} = ${x + add}$.`,
        options,
        mathExpressions: [{ source: `x + ${add} = ${x + add}` }],
        context: null,
        media: [],
      },
      indicatorIds: ["procedure"],
      misconceptionCodes: ["ALG_EQUATION_BALANCE_ERROR", "ALG_SIGN_OPERATION_ERROR"],
      generation: { generatorId: "algebra.plsv-addition", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function subtractionLinear(params) {
    const a = integer(params.a, 8);
    const b = integer(params.b, 3);
    const c = integer(params.c, 2);
    const correct = `${a - c}x + ${b}`;
    const options = makeChoiceOptions(correct, [`${a + c}x + ${b}`, `${a - c}x - ${b}`, `${a * c}x + ${b}`]);
    const input = base({
      questionId: `gen-linear-sub-${a}-${b}-${c}`,
      subtopicId: "operasi-bentuk-aljabar",
      difficulty: "medium",
      content: { prompt: `Sederhanakan $${a}x + ${b} - ${c}x$ .`, options, mathExpressions: [{ source: `${a}x + ${b} - ${c}x` }], context: null, media: [] },
      indicatorIds: ["procedure"],
      misconceptionCodes: ["ALG_LIKE_TERM_CONFUSION", "ALG_SIGN_OPERATION_ERROR"],
      generation: { generatorId: "algebra.linear-subtraction", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function distributive(params) {
    const k = integer(params.k, 3);
    const a = integer(params.a, 2);
    const b = integer(params.b, 4);
    const correct = `${k * a}x + ${k * b}`;
    const options = makeChoiceOptions(correct, [`${k * a}x + ${b}`, `${a}x + ${k * b}`, `${k + a}x + ${k + b}`]);
    const input = base({
      questionId: `gen-distributive-${k}-${a}-${b}`,
      subtopicId: "operasi-bentuk-aljabar",
      difficulty: "medium",
      content: { prompt: `Sederhanakan $${k}(${a}x+${b})$.`, options, mathExpressions: [{ source: `${k}(${a}x+${b})` }], context: null, media: [] },
      indicatorIds: ["procedure", "representation"],
      misconceptionCodes: ["ALG_DISTRIBUTIVE_ERROR"],
      generation: { generatorId: "algebra.distributive", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function plsvMultiplication(params) {
    const coefficient = integer(params.coefficient, 4);
    const x = integer(params.x, 6);
    const total = coefficient * x;
    const options = makeChoiceOptions(x, [coefficient, total, total + coefficient]);
    const input = base({
      questionId: `gen-plsv-mul-${coefficient}-${x}`,
      subtopicId: "plsv",
      difficulty: "medium",
      content: { prompt: `Tentukan nilai $x$: $${coefficient}x=${total}$.`, options, mathExpressions: [{ source: `${coefficient}x=${total}` }], context: null, media: [] },
      indicatorIds: ["procedure"],
      misconceptionCodes: ["ALG_EQUATION_BALANCE_ERROR"],
      generation: { generatorId: "algebra.plsv-multiplication", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function variableDifference(params) {
    const x = integer(params.x, 12);
    const subtract = integer(params.subtract, 5);
    const correct = x - subtract;
    const options = makeChoiceOptions(correct, [x + subtract, x * subtract, subtract]);
    const input = base({
      questionId: `gen-variable-difference-${x}-${subtract}`,
      subtopicId: "variabel",
      difficulty: "easy",
      content: { prompt: `Jika $x=${x}$, berapakah nilai $x-${subtract}$?`, options, mathExpressions: [{ source: `x=${x}` }, { source: `x-${subtract}` }], context: null, media: [] },
      indicatorIds: ["concept", "procedure"],
      misconceptionCodes: ["ALG_VARIABLE_CONFUSION", "ALG_SIGN_OPERATION_ERROR"],
      generation: { generatorId: "algebra.variable-difference", generatorVersion: "1.0", templateId: null, templateVersion: null },
    });
    const evaluation = { evaluationId: `eval-${input.questionId}-1.0`, questionId: input.questionId, questionVersion: "1.0", questionType: "single_choice", specification: { correctOptionId: options[0].id } };
    input.evaluationRef = evaluation.evaluationId;
    return requireFactory().create(input, evaluation);
  }

  function createGenerator(definition) {
    return Object.freeze({
      id: definition.id,
      version: definition.version,
      description: definition.description,
      generate: definition.generate,
    });
  }

  return Object.freeze({
    VARIABLE_VALUE: createGenerator({ id: "algebra.variable-value", version: "1.0", description: "Variable substitution.", generate: variableValue }),
    COEFFICIENT: createGenerator({ id: "algebra.coefficient-identification", version: "1.0", description: "Coefficient identification.", generate: coefficient }),
    LIKE_TERMS: createGenerator({ id: "algebra.like-terms", version: "1.0", description: "Combining like terms.", generate: likeTerms }),
    LINEAR_COMBINATION: createGenerator({ id: "algebra.linear-combination", version: "1.0", description: "Combining linear algebraic terms.", generate: simplifyLinear }),
    PLSV: createGenerator({ id: "algebra.plsv-addition", version: "1.0", description: "One-step linear equation.", generate: plsv }),
    LINEAR_SUBTRACTION: createGenerator({ id: "algebra.linear-subtraction", version: "1.0", description: "Subtracting linear terms.", generate: subtractionLinear }),
    DISTRIBUTIVE: createGenerator({ id: "algebra.distributive", version: "1.0", description: "Distributive property.", generate: distributive }),
    PLSV_MULTIPLICATION: createGenerator({ id: "algebra.plsv-multiplication", version: "1.0", description: "One-step multiplication equation.", generate: plsvMultiplication }),
    VARIABLE_DIFFERENCE: createGenerator({ id: "algebra.variable-difference", version: "1.0", description: "Variable substitution with subtraction.", generate: variableDifference }),
  });
});
