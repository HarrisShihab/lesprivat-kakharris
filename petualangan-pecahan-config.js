/**
 * Konfigurasi & Bank Soal untuk game "Petualangan Pecahan".
 *
 * Sesuai prinsip arsitektur "konten terpisah dari mekanik" (docs/Games/
 * 02-Arsitektur-Game.md), generator soal pecahan hidup di sini — bukan
 * di dalam engine. Item yang dihasilkan membawa:
 *   { answer, difficulty, text, choices, hint, label, type, n, d, symbol }
 *
 * Game ini khusus murid SD dan memakai jawaban PICOHAN GANDA (becahan/
 * tanda), bukan input angka. Jawaban disimpan sebagai teks, mis. "1/2" atau
 * "<". Engine mengevaluasinya sebagai string.
 */
(function () {
  "use strict";

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[rand(0, items.length - 1)];
  const TOTAL = 10;

  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const fraction = (n, d) => `${n}/${d}`;

  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) {
      const j = rand(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function choices(answer, distractors) {
    return shuffle([answer, ...distractors.filter((x) => x !== answer)])
      .filter((x, i, a) => a.indexOf(x) === i)
      .slice(0, 4);
  }

  function visualQuestion() {
    const d = pick([3, 4, 5, 6, 8]);
    const n = rand(1, d - 1);
    const answer = fraction(n, d);
    return {
      type: "visual",
      n,
      d,
      text: "Berapa bagian yang berwarna kuning?",
      answer,
      choices: choices(answer, [fraction(d - n, d), fraction(n, Math.max(2, d - 1)), fraction(n + 1, d)]),
      hint: `Hitung ${d} bagian seluruhnya, lalu hitung ${n} bagian berwarna.`,
      label: "Pantai Pecahan",
      difficulty: "easy",
    };
  }

  function equivalentQuestion() {
    const d = pick([2, 3, 4, 5]);
    const n = rand(1, d - 1);
    const k = rand(2, 4);
    const answer = fraction(n * k, d * k);
    return {
      type: "symbol",
      symbol: fraction(n, d),
      text: `Pecahan mana yang senilai dengan ${fraction(n, d)}?`,
      answer,
      choices: choices(answer, [fraction(n + k, d + k), fraction(n * k, d + k), fraction(n + k, d * k)]),
      hint: `Kalikan pembilang dan penyebut dengan bilangan yang sama, yaitu ${k}.`,
      label: "Hutan Pecahan Senilai",
      difficulty: "easy",
    };
  }

  function compareQuestion() {
    const d = pick([4, 5, 6, 8]);
    const a = rand(1, d - 2);
    const b = rand(a + 1, d - 1);
    const leftFirst = Math.random() < 0.5;
    const left = leftFirst ? a : b;
    const right = leftFirst ? b : a;
    const answer = left > right ? ">" : "<";
    return {
      type: "symbol",
      symbol: `${fraction(left, d)}  ?  ${fraction(right, d)}`,
      text: "Pilih tanda perbandingan yang benar.",
      answer,
      choices: ["<", ">", "="],
      hint: "Penyebutnya sama. Pecahan dengan pembilang lebih besar memiliki nilai lebih besar.",
      label: "Jembatan Perbandingan",
      difficulty: "medium",
    };
  }

  function simplifyQuestion() {
    const baseD = pick([3, 4, 5, 6]);
    const baseN = rand(1, baseD - 1);
    const k = rand(2, 4);
    const divisor = gcd(baseN, baseD);
    const n = (baseN / divisor) * k;
    const d = (baseD / divisor) * k;
    const answer = fraction(n / k, d / k);
    return {
      type: "symbol",
      symbol: fraction(n, d),
      text: `Bentuk paling sederhana dari ${fraction(n, d)} adalah ...`,
      answer,
      choices: choices(answer, [fraction(n - 1, d - 1), fraction(n / k, d), fraction(n, d / k)]),
      hint: `Pembilang dan penyebut sama-sama bisa dibagi ${k}.`,
      label: "Gua Penyederhanaan",
      difficulty: "medium",
    };
  }

  function operationQuestion() {
    const d = pick([4, 5, 6, 8]);
    const subtract = Math.random() < 0.4;
    let a;
    let b;
    let result;
    if (subtract) {
      a = rand(2, d - 1);
      b = rand(1, a - 1);
      result = a - b;
    } else {
      a = rand(1, d - 2);
      b = rand(1, d - a - 1);
      result = a + b;
    }
    const op = subtract ? "−" : "+";
    const common = gcd(result, d);
    const answer = fraction(result / common, d / common);
    return {
      type: "symbol",
      symbol: `${fraction(a, d)} ${op} ${fraction(b, d)}`,
      text: "Hitung hasil operasi pecahan berikut.",
      answer,
      choices: choices(answer, [fraction(result, d + d), fraction(Math.abs(a - b) || 1, d), fraction(result + 1, d)]),
      hint: "Karena penyebutnya sama, hitung pembilangnya lalu sederhanakan jika bisa.",
      label: "Puncak Operasi Pecahan",
      difficulty: "hard",
    };
  }

  function createItem(ctx) {
    const mission = Number(ctx.floor) || Number(ctx.round) || 1;
    const factories =
      mission <= 3
        ? [visualQuestion, visualQuestion, equivalentQuestion]
        : mission <= 6
          ? [equivalentQuestion, compareQuestion, simplifyQuestion]
          : [compareQuestion, simplifyQuestion, operationQuestion, operationQuestion];
    return pick(factories)();
  }

  window.PetualanganPecahanConfig = {
    perGameKey: "petualanganPecahan",
    questionLimit: TOTAL,
    lives: 3,
    hintCost: 5,
    feedbackDurationMs: 1250,
    basePoints: { easy: 10, medium: 20, hard: 30 },
    bank: createItem,
  };
})();
