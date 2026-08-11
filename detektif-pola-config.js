/**
 * Konfigurasi & Bank Soal untuk game "Detektif Pola Bilangan".
 *
 * Sesuai prinsip arsitektur "konten terpisah dari mekanik" (docs/Games/
 * 02-Arsitektur-Game.md), generator pola bilangan hidup di sini — bukan
 * di dalam engine. Item yang dihasilkan membawa:
 *   { answer, difficulty, values, missingIndex, hint }
 * sehingga game (lapisan presentasi) hanya perlu merender deret angka.
 *
 * Jenjang (grade) menentukan pola yang boleh muncul: pola SD lebih
 * sederhana (aritmetika, bolak-balik, kelipatan), sedangkan SMP menambah
 * pola geometri, kuadrat, dan selisih naik.
 */
(function () {
  "use strict";

  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[rand(0, items.length - 1)];

  const SD_PATTERNS = [(ctx) => arithmetic(20, 10), (ctx) => alternating(15, 8), (ctx) => multiples()];

  const SMP_PATTERNS = [(ctx) => arithmetic(30, 15), (ctx) => alternating(20, 12), (ctx) => geometric(), (ctx) => squares(), (ctx) => growingDifference()];

  function arithmetic(max, stepMax) {
    const first = rand(1, max);
    const step = rand(2, stepMax);
    return {
      values: Array.from({ length: 6 }, (_, index) => first + index * step),
      hint: `Setiap angka bertambah ${step}.`,
    };
  }

  function alternating(max, stepMax) {
    const first = rand(1, max);
    const firstStep = rand(2, stepMax);
    const secondStep = rand(1, stepMax - 1);
    const values = [first];
    for (let index = 1; index < 6; index += 1) {
      values.push(values[index - 1] + (index % 2 ? firstStep : secondStep));
    }
    return { values, hint: `Kenaikannya bergantian: +${firstStep}, lalu +${secondStep}.` };
  }

  function multiples() {
    const factor = rand(2, 9);
    return { values: Array.from({ length: 6 }, (_, index) => factor * (index + 1)), hint: `Ini adalah kelipatan ${factor}.` };
  }

  function geometric() {
    const first = rand(1, 4);
    const ratio = rand(2, 3);
    return { values: Array.from({ length: 6 }, (_, index) => first * ratio ** index), hint: `Setiap angka dikali ${ratio}.` };
  }

  function squares(ctx) {
    const first = rand(1, 5);
    return { values: Array.from({ length: 6 }, (_, index) => (first + index) ** 2), hint: "Ini adalah hasil kuadrat berurutan." };
  }

  function growingDifference() {
    const first = rand(1, 12);
    const step = rand(1, 4);
    const values = [first];
    for (let index = 1; index < 6; index += 1) {
      values.push(values[index - 1] + step + index - 1);
    }
    return { values, hint: `Selisihnya naik satu-satu, mulai dari +${step}.` };
  }

  function createItem(ctx) {
    const grade = ctx.grade || "SD";
    const pattern = pick(grade === "SMP" ? SMP_PATTERNS : SD_PATTERNS)(ctx);
    const missingIndex = rand(1, 4);
    return {
      text: String(pattern.values[missingIndex]),
      answer: pattern.values[missingIndex],
      difficulty: grade === "SMP" ? "medium" : "easy",
      values: pattern.values,
      missingIndex,
      hint: pattern.hint,
    };
  }

  window.DetektifPolaConfig = {
    perGameKey: "detektifPola",
    questionLimit: 10,
    lives: 3,
    hintCost: 5,
    feedbackDurationMs: 1050,
    basePoints: { easy: 10, medium: 20, hard: 30 },
    bank: createItem,
  };
})();
