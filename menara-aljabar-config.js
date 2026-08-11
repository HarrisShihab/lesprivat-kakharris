/**
 * Konfigurasi & Bank Soal untuk game "Menara Aljabar".
 *
 * Sesuai prinsip arsitektur "konten terpisah dari mekanik" (docs/Games/
 * 02-Arsitektur-Game.md), generator persamaan aljabar hidup di sini —
 * bukan di dalam engine. Item yang dihasilkan membawa:
 *   { answer, difficulty, equation, hint, boss }
 * sehingga game (lapisan presentasi) hanya perlu merender persamaan.
 *
 * Game ini khusus murid SMP. Tingkat kesulitan naik seiring lantai:
 * lantai 1-3 satu langkah, 4-7 dua langkah/kedua sisi, 8-10 bracket/turunan.
 */
(function () {
  "use strict";

  const TOTAL_FLOORS = 10;

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[rand(0, items.length - 1)];

  function signed(minAbs, maxAbs) {
    const value = rand(minAbs, maxAbs);
    return Math.random() < 0.28 ? -value : value;
  }

  function formatLinear(a, b) {
    const aText = a === 1 ? "x" : a === -1 ? "−x" : `${a}x`;
    if (b === 0) return aText;
    return `${aText} ${b > 0 ? "+" : "−"} ${Math.abs(b)}`;
  }

  function oneStepMultiply() {
    const x = signed(2, 12);
    const a = rand(2, 9);
    return { answer: x, equation: `${a}x = ${a * x}`, hint: `Bagi kedua ruas dengan ${a}.` };
  }

  function oneStepAdd() {
    const x = signed(2, 15);
    const b = signed(2, 12);
    return { answer: x, equation: `x ${b > 0 ? "+" : "−"} ${Math.abs(b)} = ${x + b}`, hint: `${b > 0 ? "Kurangi" : "Tambah"} kedua ruas dengan ${Math.abs(b)}.` };
  }

  function twoStep() {
    const x = signed(2, 12);
    const a = rand(2, 9);
    const b = signed(1, 15);
    const c = a * x + b;
    return { answer: x, equation: `${formatLinear(a, b)} = ${c}`, hint: `Pindahkan ${b > 0 ? b : `−${Math.abs(b)}`} terlebih dahulu, lalu bagi dengan ${a}.` };
  }

  function bothSides() {
    const x = signed(2, 10);
    const rightA = rand(1, 5);
    const leftA = rand(rightA + 1, rightA + 6);
    const leftB = signed(1, 12);
    const rightB = (leftA - rightA) * x + leftB;
    return { answer: x, equation: `${formatLinear(leftA, leftB)} = ${formatLinear(rightA, rightB)}`, hint: `Kumpulkan suku x di kiri dan konstanta di kanan.` };
  }

  function bracket() {
    const x = signed(2, 8);
    const a = rand(2, 5);
    const b = signed(1, 8);
    const c = a * (x + b);
    return { answer: x, equation: `${a}(x ${b > 0 ? "+" : "−"} ${Math.abs(b)}) = ${c}`, hint: `Bagi kedua ruas dengan ${a}, lalu isolasi x.` };
  }

  function createItem(ctx) {
    const floor = Number(ctx.floor) || 1;
    const factories = floor <= 3 ? [oneStepMultiply, oneStepAdd] : floor <= 7 ? [twoStep, twoStep, bothSides] : [twoStep, bothSides, bracket];
    const q = pick(factories)();
    return {
      text: q.equation,
      answer: q.answer,
      difficulty: floor <= 3 ? "medium" : "hard",
      equation: q.equation,
      hint: q.hint,
      boss: floor % TOTAL_FLOORS === 0,
    };
  }

  window.MenaraAljabarConfig = {
    perGameKey: "menaraAljabar",
    questionLimit: TOTAL_FLOORS,
    lives: 3,
    hintCost: 5,
    feedbackDurationMs: 1100,
    basePoints: { easy: 10, medium: 20, hard: 30 },
    bank: createItem,
  };
})();
