/**
 * Konfigurasi & Bank Soal untuk game "Hitung Tanpa Batas".
 *
 * Sesuai prinsip arsitektur "konten terpisah dari mekanik" (docs/Games/
 * 02-Arsitektur-Game.md), definisi game, tingkat kesulitan, dan generator
 * soal hidup di sini — bukan di dalam engine. Engine quiz hanya menerima
 * item soal lewat fungsi generator ini.
 *
 * Item yang dihasilkan mengikuti kontrak umum:
 *   { text, answer, difficulty }
 */
(function () {
  "use strict";

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function binaryQuestion(symbol, min, max) {
    let a = randomInt(min, max);
    let b = randomInt(min, max);
    if (symbol === "-" && b > a) [a, b] = [b, a];
    return {
      text: `${a} ${symbol} ${b}`,
      answer: symbol === "+" ? a + b : a - b,
    };
  }

  function multiplicationQuestion(maxFactor) {
    const a = randomInt(1, maxFactor);
    const b = randomInt(1, maxFactor);
    return { text: `${a} × ${b}`, answer: a * b };
  }

  function divisionQuestion(maxFactor) {
    const divisor = randomInt(1, maxFactor);
    const answer = randomInt(1, maxFactor);
    return { text: `${divisor * answer} ÷ ${divisor}`, answer };
  }

  function evaluateTokens(numbers, operators) {
    const values = numbers.slice();
    const ops = operators.slice();
    for (let i = 0; i < ops.length; ) {
      if (ops[i] === "×" || ops[i] === "÷") {
        const result = ops[i] === "×" ? values[i] * values[i + 1] : values[i] / values[i + 1];
        values.splice(i, 2, result);
        ops.splice(i, 1);
      } else {
        i += 1;
      }
    }
    let result = values[0];
    ops.forEach((operator, index) => {
      result = operator === "+" ? result + values[index + 1] : result - values[index + 1];
    });
    return result;
  }

  function mixedQuestion(level) {
    if (level === "easy") return binaryQuestion(Math.random() < 0.5 ? "+" : "-", 0, 20);

    const count = level === "medium" ? 3 : 4;
    const max = level === "medium" ? 12 : 25;
    const pool = level === "medium" ? ["+", "-", "×"] : ["+", "-", "×", "÷"];

    for (let attempt = 0; attempt < 200; attempt += 1) {
      const numbers = Array.from({ length: count }, () => randomInt(1, max));
      const operators = Array.from({ length: count - 1 }, () => pool[randomInt(0, pool.length - 1)]);
      const answer = evaluateTokens(numbers, operators);
      if (Number.isInteger(answer) && answer >= 0 && answer <= 2000) {
        const text = numbers.map((number, index) => (index < operators.length ? `${number} ${operators[index]}` : `${number}`)).join(" ");
        return { text, answer };
      }
    }
    return binaryQuestion("+", 10, level === "medium" ? 100 : 1000);
  }

  function createQuestion(ctx) {
    const operation = ctx.operation || "mixed";
    const level = ctx.level || "easy";
    let question;

    if (operation === "addition" || operation === "subtraction") {
      const maximum = level === "easy" ? 20 : level === "medium" ? 100 : 1000;
      question = binaryQuestion(operation === "addition" ? "+" : "-", 0, maximum);
    } else if (operation === "multiplication") {
      question = multiplicationQuestion(level === "easy" ? 5 : level === "medium" ? 10 : 12);
    } else if (operation === "division") {
      question = divisionQuestion(level === "easy" ? 5 : level === "medium" ? 10 : 20);
    } else {
      question = mixedQuestion(level);
    }

    return {
      text: question.text,
      answer: question.answer,
      difficulty: level,
    };
  }

  window.HitungTanpaBatasConfig = {
    perGameKey: "hitungTanpaBatas",
    questionLimit: 10,
    basePoints: { easy: 10, medium: 20, hard: 30 },
    feedbackDurationMs: 850,
    // Question Provider: fungsi generator soal.
    bank: createQuestion,
  };
})();
