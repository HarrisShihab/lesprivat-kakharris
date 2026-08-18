(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.answerEvaluator = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const MAX_INPUT_LENGTH = 500;
  const DEFAULT_TOLERANCE = 1e-9;
  const MAX_DEGREE = 6;
  const NUMBER_PATTERN = /^[+-]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?$/i;
  const ALLOWED_EXPRESSION = /^[0-9a-zA-ZxX+\-*/^().=≤≥<>\s,−–—]+$/;

  function result(isCorrect, evaluationCode, misconceptionCode) {
    return Object.freeze({
      isCorrect: isCorrect === true,
      outcome: isCorrect === true ? "correct" : "incorrect",
      evaluationCode: evaluationCode || (isCorrect ? "CORRECT" : "INCORRECT"),
      misconceptionCode: misconceptionCode ?? null,
    });
  }

  function invalidResult(code) {
    return result(false, code || "INVALID_ANSWER", null);
  }

  function normalizeText(value) {
    if (typeof value !== "string" && typeof value !== "number") return null;
    let text = String(value).trim();
    if (!text || text.length > MAX_INPUT_LENGTH) return null;
    text = text
      .replace(/[−–—]/g, "-")
      .replace(/[×·]/g, "*")
      .replace(/÷/g, "/")
      .replace(/,/g, ".")
      .replace(/\s+/g, " ")
      .trim();
    return text || null;
  }

  function normalizeOptionId(value) {
    if (typeof value !== "string") return null;
    const text = value.trim();
    return text && text.length <= 100 ? text : null;
  }

  function parseNumeric(value) {
    const text = normalizeText(value);
    if (!text || !NUMBER_PATTERN.test(text)) return null;
    const number = Number(text);
    return Number.isFinite(number) ? number : null;
  }

  function numbersEquivalent(a, b, tolerance) {
    if (!Number.isFinite(a) || !Number.isFinite(b)) return false;
    const t = Number.isFinite(tolerance) && tolerance >= 0 ? tolerance : DEFAULT_TOLERANCE;
    const scale = Math.max(1, Math.abs(a), Math.abs(b));
    return Math.abs(a - b) <= t * scale;
  }

  function validateExpressionSource(value) {
    const text = normalizeText(value);
    if (!text) return { valid: false, code: "INVALID_ANSWER" };
    if (!ALLOWED_EXPRESSION.test(text)) return { valid: false, code: "INVALID_EXPRESSION" };
    if (/[a-wy-z]/i.test(text)) return { valid: false, code: "UNSUPPORTED_VARIABLE" };
    if (/[^x0-9+\-*/^().=<>≤≥\s]/i.test(text)) return { valid: false, code: "INVALID_EXPRESSION" };
    return { valid: true, text };
  }

  function tokenize(expression) {
    const checked = validateExpressionSource(expression);
    if (!checked.valid) throw new Error(checked.code);
    const source = checked.text.replace(/≤/g, "<=").replace(/≥/g, ">=");
    const tokens = [];
    let i = 0;
    while (i < source.length) {
      const ch = source[i];
      if (/\s/.test(ch)) { i += 1; continue; }
      if (/[0-9.]/.test(ch)) {
        const match = source.slice(i).match(/^(?:\d+(?:\.\d+)?|\.\d+)(?:e[+-]?\d+)?/i);
        if (!match) throw new Error("INVALID_NUMBER");
        const value = Number(match[0]);
        if (!Number.isFinite(value)) throw new Error("INVALID_NUMBER");
        tokens.push({ type: "number", value });
        i += match[0].length;
        continue;
      }
      if (ch === "x" || ch === "X") { tokens.push({ type: "variable", value: "x" }); i += 1; continue; }
      if ("+-*/^()".includes(ch)) { tokens.push({ type: ch, value: ch }); i += 1; continue; }
      if (source.slice(i, i + 2) === "<=") { tokens.push({ type: "relation", value: "<=" }); i += 2; continue; }
      if (source.slice(i, i + 2) === ">=") { tokens.push({ type: "relation", value: ">=" }); i += 2; continue; }
      if (ch === "=" || ch === "<" || ch === ">") { tokens.push({ type: "relation", value: ch }); i += 1; continue; }
      throw new Error("INVALID_EXPRESSION");
    }
    tokens.push({ type: "eof", value: null });
    return tokens;
  }

  function addPoly(a, b, sign) {
    const out = a.slice();
    for (let i = 0; i < b.length; i += 1) out[i] = (out[i] || 0) + sign * (b[i] || 0);
    return trimPoly(out);
  }

  function multiplyPoly(a, b) {
    const out = Array(Math.min(MAX_DEGREE + 1, a.length + b.length - 1)).fill(0);
    for (let i = 0; i < a.length; i += 1) {
      for (let j = 0; j < b.length && i + j <= MAX_DEGREE; j += 1) out[i + j] += a[i] * b[j];
    }
    if (a.length + b.length - 2 > MAX_DEGREE) throw new Error("EXPRESSION_TOO_COMPLEX");
    return trimPoly(out);
  }

  function scalePoly(a, scalar) { return trimPoly(a.map((v) => v * scalar)); }

  function trimPoly(poly) {
    const out = poly.slice();
    while (out.length > 1 && Math.abs(out[out.length - 1]) < 1e-12) out.pop();
    return out;
  }

  function isZeroPoly(poly) { return trimPoly(poly).every((v) => Math.abs(v) < 1e-10); }

  function dividePoly(a, b) {
    const denominator = trimPoly(b);
    if (denominator.length !== 1 || Math.abs(denominator[0]) < 1e-15) throw new Error("NON_CONSTANT_DIVISOR");
    return scalePoly(a, 1 / denominator[0]);
  }

  function powPoly(base, exponent) {
    if (!Number.isInteger(exponent) || exponent < 0 || exponent > MAX_DEGREE) throw new Error("UNSUPPORTED_POWER");
    let resultPoly = [1];
    for (let i = 0; i < exponent; i += 1) resultPoly = multiplyPoly(resultPoly, base);
    return resultPoly;
  }

  function parsePolynomial(expression) {
    const tokens = tokenize(expression);
    let index = 0;

    function peek(type) { return tokens[index].type === type; }
    function consume(type) {
      if (!peek(type)) throw new Error("UNEXPECTED_TOKEN");
      return tokens[index++];
    }

    function primary() {
      if (peek("number")) return [consume("number").value];
      if (peek("variable")) { consume("variable"); return [0, 1]; }
      if (peek("(")) { consume("("); const value = expressionNode(); consume(")"); return value; }
      throw new Error("EXPECTED_PRIMARY");
    }

    function unary() {
      if (peek("+")) { consume("+"); return unary(); }
      if (peek("-")) { consume("-"); return scalePoly(unary(), -1); }
      return primary();
    }

    function power() {
      const left = unary();
      if (peek("^")) {
        consume("^");
        if (!peek("number")) throw new Error("POWER_MUST_BE_INTEGER");
        const exponent = consume("number").value;
        return powPoly(left, exponent);
      }
      return left;
    }

    function hasImplicitMultiplication() {
      return peek("number") || peek("variable") || peek("(");
    }

    function term() {
      let value = power();
      while (peek("*") || peek("/") || hasImplicitMultiplication()) {
        if (peek("*")) { consume("*"); value = multiplyPoly(value, power()); }
        else if (peek("/")) { consume("/"); value = dividePoly(value, power()); }
        else value = multiplyPoly(value, power());
      }
      return value;
    }

    function expressionNode() {
      let value = term();
      while (peek("+") || peek("-")) {
        if (peek("+")) { consume("+"); value = addPoly(value, term(), 1); }
        else { consume("-"); value = addPoly(value, term(), -1); }
      }
      return value;
    }

    const left = expressionNode();
    if (peek("relation")) {
      const relation = consume("relation").value;
      const right = expressionNode();
      if (!peek("eof")) throw new Error("UNEXPECTED_TOKEN");
      return { kind: "relation", relation, polynomial: addPoly(left, right, -1) };
    }
    if (!peek("eof")) throw new Error("UNEXPECTED_TOKEN");
    return { kind: "expression", polynomial: left };
  }

  function polynomialEquivalent(a, b) {
    const left = parsePolynomial(a);
    const right = parsePolynomial(b);
    if (left.kind !== right.kind) return false;
    if (left.kind === "relation" && left.relation !== right.relation) return false;
    const max = Math.max(left.polynomial.length, right.polynomial.length);
    for (let i = 0; i < max; i += 1) {
      if (!numbersEquivalent(left.polynomial[i] || 0, right.polynomial[i] || 0, 1e-9)) return false;
    }
    return true;
  }

  function normalizeExpression(value) {
    const checked = validateExpressionSource(value);
    if (!checked.valid) return { valid: false, code: checked.code, value: null };
    try {
      const parsed = parsePolynomial(checked.text);
      return { valid: true, value: parsed };
    } catch (error) {
      return { valid: false, code: error.message || "INVALID_EXPRESSION", value: null };
    }
  }

  function evaluateSingleChoice(question, spec, answer) {
    const answerId = normalizeOptionId(answer);
    if (!answerId) return invalidResult("INVALID_OPTION");
    const optionIds = Array.isArray(question?.content?.options) ? question.content.options.map((o) => o.id) : [];
    if (!optionIds.includes(answerId)) return invalidResult("INVALID_OPTION");
    const correctId = normalizeOptionId(spec.correctOptionId);
    if (!correctId || !optionIds.includes(correctId)) return invalidResult("INVALID_EVALUATION_SPEC");
    return answerId === correctId
      ? result(true, "CORRECT", null)
      : result(false, "WRONG_OPTION", null);
  }

  function evaluateNumeric(spec, answer) {
    const actual = parseNumeric(answer);
    if (actual === null) return invalidResult("INVALID_NUMERIC");
    const accepted = Array.isArray(spec.acceptedAnswers) ? spec.acceptedAnswers : [spec.correctAnswer];
    const expected = accepted.map(parseNumeric).filter((value) => value !== null);
    if (!expected.length) return invalidResult("INVALID_EVALUATION_SPEC");
    const tolerance = Number.isFinite(spec.tolerance) ? spec.tolerance : DEFAULT_TOLERANCE;
    return expected.some((value) => numbersEquivalent(actual, value, tolerance))
      ? result(true, "CORRECT", null)
      : result(false, "WRONG_NUMERIC", null);
  }

  function evaluateExpression(spec, answer) {
    const normalized = normalizeExpression(answer);
    if (!normalized.valid) return invalidResult(normalized.code);
    const accepted = Array.isArray(spec.acceptedAnswers) ? spec.acceptedAnswers : [spec.correctAnswer];
    const candidates = accepted.filter((value) => typeof value === "string");
    if (!candidates.length) return invalidResult("INVALID_EVALUATION_SPEC");
    try {
      const equivalent = candidates.some((candidate) => polynomialEquivalent(answer, candidate));
      return equivalent ? result(true, "CORRECT", null) : result(false, "WRONG_EXPRESSION", null);
    } catch (error) {
      return invalidResult(error.message || "INVALID_EXPRESSION");
    }
  }

  function evaluate(question, evaluationSpec, answer) {
    if (!question || typeof question !== "object") return invalidResult("INVALID_QUESTION");
    if (!evaluationSpec || typeof evaluationSpec !== "object") return invalidResult("INVALID_EVALUATION_SPEC");
    const questionType = question.questionType || evaluationSpec.questionType;
    const spec = evaluationSpec.specification && typeof evaluationSpec.specification === "object"
      ? evaluationSpec.specification
      : evaluationSpec;

    if (questionType === "single_choice") return evaluateSingleChoice(question, spec, answer);
    if (questionType === "numeric_input") return evaluateNumeric(spec, answer);
    if (questionType === "expression_choice") return evaluateExpression(spec, answer);
    return invalidResult("UNSUPPORTED_QUESTION_TYPE");
  }

  function publicResult(evaluationResult) {
    return result(
      evaluationResult?.isCorrect === true,
      evaluationResult?.evaluationCode || "INCORRECT",
      evaluationResult?.misconceptionCode ?? null,
    );
  }

  return Object.freeze({
    MAX_INPUT_LENGTH,
    DEFAULT_TOLERANCE,
    normalizeText,
    normalizeOptionId,
    parseNumeric,
    numbersEquivalent,
    validateExpressionSource,
    normalizeExpression,
    polynomialEquivalent,
    evaluate,
    publicResult,
  });
});
