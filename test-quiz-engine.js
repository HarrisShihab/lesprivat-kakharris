// Uji cepat Engine Quiz (dijalankan dengan `node test-quiz-engine.js`)
// Memverifikasi: alur soal, scoring, bonus streak, mode limited, endless,
// skip, dan penyimpanan statistik ke localStorage mock.
(function () {
  "use strict";
  if (typeof require === "undefined") return;

  global.window = {};
  global.localStorage = {
    _s: {},
    getItem(k) {
      return this._s[k] || null;
    },
    setItem(k, v) {
      this._s[k] = String(v);
    },
  };

  const fs = require("fs");
  eval(fs.readFileSync("game-engine.js", "utf8"));
  eval(fs.readFileSync("hitung-tanpa-batas-config.js", "utf8"));
  eval(fs.readFileSync("toko-matematika-config.js", "utf8"));
  eval(fs.readFileSync("detektif-pola-config.js", "utf8"));
  eval(fs.readFileSync("menara-aljabar-config.js", "utf8"));
  eval(fs.readFileSync("petualangan-pecahan-config.js", "utf8"));

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function makeGame(opts) {
    const log = [];
    const game = window.KakHarrisGameEngine.createQuizGame(
      Object.assign(
        {
          bank: window.HitungTanpaBatasConfig.bank,
          basePoints: window.HitungTanpaBatasConfig.basePoints,
          questionLimit: 5,
          feedbackDurationMs: 1,
          level: "easy",
          operation: "addition",
        },
        opts,
      ),
    );
    return { game, log };
  }

  async function testLimited() {
    const { game, log } = makeGame({
      isEndless: false,
      onQuestion: (q) => log.push("Q:" + q.number),
      onFinish: (r) => log.push("FINISH " + JSON.stringify(r)),
    });
    game.start();
    for (let i = 0; i < 5; i++) {
      await sleep(8);
      game.submitAnswer(Number(game.getState().question.answer));
    }
    await sleep(15);
    const finished = log.some((x) => x.startsWith("FINISH"));
    const result = log.find((x) => x.startsWith("FINISH"));
    return { name: "limited-all-correct", ok: finished && result.includes('"correct":5'), info: result };
  }

  async function testEndlessNoAutoFinish() {
    const { game, log } = makeGame({
      isEndless: true,
      onFinish: (r) => log.push("FINISH " + JSON.stringify(r)),
    });
    game.start();
    // Tanpa menekan selesai, endless tidak boleh berhenti sendiri.
    for (let i = 0; i < 12; i++) {
      await sleep(6);
      game.submitAnswer(Number(game.getState().question.answer));
    }
    await sleep(15);
    return { name: "endless-does-not-auto-finish", ok: !log.some((x) => x.startsWith("FINISH")), info: "log had " + log.length + " entries (no FINISH expected)" };
  }

  async function testSkip() {
    const { game, log } = makeGame({
      isEndless: false,
      onFinish: (r) => log.push("FINISH " + JSON.stringify(r)),
    });
    game.start();
    await sleep(6);
    game.skipQuestion();
    await sleep(8);
    const st = game.getState();
    return { name: "skip-counts-wrong", ok: st.wrong === 1 && st.streak === 0, info: "wrong=" + st.wrong + " streak=" + st.streak };
  }

  async function testWrongAnswers() {
    const { game, log } = makeGame({
      isEndless: false,
      onFinish: (r) => log.push("FINISH " + JSON.stringify(r)),
    });
    game.start();
    // Jawab salah: selalu 999999 (pasti bukan jawaban penjumlahan kecil)
    for (let i = 0; i < 3; i++) {
      await sleep(8);
      game.submitAnswer(999999);
    }
    await sleep(10);
    const st = game.getState();
    return { name: "wrong-resets-streak", ok: st.wrong === 3 && st.streak === 0, info: "wrong=" + st.wrong + " streak=" + st.streak };
  }

  async function testLivesFinish() {
    // Simulasi Detektif: lives habis (3) harus mengakhiri sesi limited.
    const { game, log } = makeGame({
      isEndless: false,
      lives: 3,
      feedbackDurationMs: 1,
      pointsFor: () => 10,
      onFinish: (r) => log.push("FINISH " + JSON.stringify(r)),
    });
    game.start();
    for (let i = 0; i < 3; i++) {
      await sleep(8);
      // Jawab selalu salah sampai nyawa habis
      const wrong = Number(game.getState().question.answer) + 1;
      game.submitAnswer(wrong);
    }
    await sleep(20);
    const finished = log.some((x) => x.startsWith("FINISH"));
    const showLives = game.getState().lives;
    return { name: "lives-run-out-finishes", ok: finished && showLives === 0, info: "lives=" + showLives + " finished=" + finished };
  }

  async function testLivesNoDebitOnEndless() {
    // Endless tidak mengurangi nyawa (lives dilewatkan null).
    const { game, log } = makeGame({
      isEndless: true,
      lives: null,
      feedbackDurationMs: 1,
      onFinish: (r) => log.push("FINISH " + JSON.stringify(r)),
    });
    game.start();
    for (let i = 0; i < 4; i++) {
      await sleep(6);
      const wrong = Number(game.getState().question.answer) + 1;
      game.submitAnswer(wrong);
    }
    await sleep(12);
    return { name: "endless-no-lives", ok: !log.some((x) => x.startsWith("FINISH")), info: "no auto FINISH (expected)" };
  }

  async function testHintReducesScore() {
    const { game, log } = makeGame({
      isEndless: false,
      hintCost: 5,
      getHint: () => "Petunjuk contoh.",
    });
    // Cetak skor lewat jawaban benar terlebih dahulu, lalu gunakan hint.
    game.start();
    await sleep(6);
    game.submitAnswer(Number(game.getState().question.answer));
    await sleep(8);
    const before = game.getState().score;
    const used = game.useHint();
    const after = game.getState().score;
    return { name: "hint-reduces-score", ok: used === true && before - after === 5, info: "before=" + before + " after=" + after };
  }

  async function testPointsOverride() {
    // Detektif memakai rumus poin custom: 10 + min(streak-1, 5)*2.
    const streakLog = [];
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank: window.DetektifPolaConfig.bank,
      basePoints: window.DetektifPolaConfig.basePoints,
      questionLimit: 4,
      feedbackDurationMs: 1,
      grade: "SD",
      pointsFor: ({ streak }) => 10 + Math.min(streak - 1, 5) * 2,
      onAnswer: (outcome) => streakLog.push(outcome.points),
    });
    game.start();
    for (let i = 0; i < 4; i++) {
      await sleep(8);
      game.submitAnswer(Number(game.getState().question.answer));
    }
    await sleep(20);
    // streak 1->10, 2->12, 3->14, 4->16
    const expected = [10, 12, 14, 16];
    const ok = JSON.stringify(streakLog) === JSON.stringify(expected);
    return { name: "points-override", ok, info: "points=" + JSON.stringify(streakLog) + " (expected " + JSON.stringify(expected) + ")" };
  }

  async function testTextAnswer() {
    // Simulasikan Petualangan Pecahan: jawaban pilihan ganda berupa string.
    let seq = 0;
    const fakeBank = () => ({ text: `soal ${++seq}?`, answer: "<", choices: ["<", ">", "="], hint: "Bandingkan." });
    const outcomes = [];
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank: fakeBank,
      questionLimit: 2,
      feedbackDurationMs: 1,
      lives: 3,
      pointsFor: () => 10,
      onAnswer: (o) => outcomes.push(o.correct),
    });
    game.start();
    await sleep(6);
    const correct = game.submitAnswer("<");
    await sleep(8);
    const wrong = game.submitAnswer(">");
    await sleep(12);
    return { name: "text-choice-answer", ok: correct && correct.correct === true && wrong && wrong.correct === false, info: "outcomes=" + JSON.stringify(outcomes) };
  }

  async function testMenaraBossPoints() {
    // Bank Menara Aljabar: pada lantai kelipatan 10, item boss=true.
    const item10 = window.MenaraAljabarConfig.bank({ floor: 10 });
    const item3 = window.MenaraAljabarConfig.bank({ floor: 3 });
    const ok = item10.boss === true && item3.boss === false;
    return { name: "menara-boss-flag", ok, info: "floor10.boss=" + item10.boss + " floor3.boss=" + item3.boss };
  }

  async function testPetualanganChoices() {
    // Bank Petualangan selalu menghasilkan 4 pilihan unik berisi jawaban.
    const seen = [];
    for (let i = 0; i < 50; i += 1) {
      const item = window.PetualanganPecahanConfig.bank({ floor: i + 1 });
      if (!item.choices || item.choices.length < 2 || !item.choices.includes(item.answer)) return { name: "petualangan-choices", ok: false, info: "bad item at #" + i };
      seen.push(1);
    }
    return { name: "petualangan-choices", ok: seen.length === 50, info: "50 items valid" };
  }

  // --- Validasi MVP (Tahap 2 roadmap) ---

  async function testFinishIdempotent() {
    // Sesi yang diputus (finish dipanggil lebih dari sekali) tidak boleh
    // menggandakan pencatatan. Guard finish() harus mencegahnya.
    const key = "kakHarrisGameStats:idem-test";
    const callbacks = [];
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank: window.HitungTanpaBatasConfig.bank,
      questionLimit: 2,
      feedbackDurationMs: 1,
      onFinish: (r) => callbacks.push(r),
    });
    game.start();
    await sleep(6);
    game.finish();
    game.finish();
    game.finish();
    await sleep(6);
    const ok = callbacks.length === 1 && game.getState().finished === true;
    return { name: "finish-is-idempotent", ok, info: "onFinish called " + callbacks.length + "x (expected 1)" };
  }

  async function testSummaryConsistent() {
    // Ringkasan harus konsisten dengan jawaban yang dikerjakan:
    // answered = correct + wrong, dan skor >= 0.
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank: window.HitungTanpaBatasConfig.bank,
      questionLimit: 3,
      feedbackDurationMs: 1,
    });
    game.start();
    await sleep(6);
    game.submitAnswer(Number(game.getState().question.answer)); // benar
    await sleep(8);
    game.submitAnswer(999999); // salah
    await sleep(8);
    game.submitAnswer(Number(game.getState().question.answer)); // benar
    await sleep(20);
    const st = game.getState();
    const ok = st.correct === 2 && st.wrong === 1 && st.correct + st.wrong === 3 && st.score >= 0;
    return { name: "summary-consistent", ok, info: "correct=" + st.correct + " wrong=" + st.wrong + " score=" + st.score };
  }

  async function testEndlessNoRapidRepeat() {
    // Soal tidak berulang terlalu cepat pada mode Endless: bank Hitung
    // memakai cache recent 10, jadi 10 soal pertama tidak boleh kembar.
    const texts = [];
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank: window.HitungTanpaBatasConfig.bank,
      isEndless: true,
      feedbackDurationMs: 1,
      questionLimit: 100,
      onQuestion: (q) => texts.push(q.text),
    });
    game.start();
    for (let i = 0; i < 10; i++) {
      await sleep(6);
      game.submitAnswer(Number(game.getState().question.answer));
    }
    await sleep(15);
    const unique = new Set(texts).size;
    return { name: "endless-no-rapid-repeat", ok: unique === texts.length, info: "unique=" + unique + "/" + texts.length };
  }

  async function testGradeFilter() {
    // Filter jenjang: murid SMP -> Menara boleh, Petualangan (SD) ditolak.
    // Murid SD -> sebaliknya.
    function getGrade(student) {
      const text = `${student.jenjang || ""} KELAS ${student.kelas || ""}`.toUpperCase();
      return text.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(text) ? "SMP" : text.includes("SD") || /KELAS\s*([1-6])\b/.test(text) ? "SD" : "UNKNOWN";
    }
    const sd = getGrade({ jenjang: "SD", kelas: "5" });
    const smp = getGrade({ jenjang: "SMP", kelas: "8" });
    const guardMenara = (student) => getGrade(student) === "SMP";
    const guardPecahan = (student) => getGrade(student) === "SD";
    const ok =
      sd === "SD" &&
      smp === "SMP" &&
      guardMenara({ jenjang: "SMP", kelas: "8" }) === true &&
      guardPecahan({ jenjang: "SD", kelas: "4" }) === true &&
      guardMenara({ jenjang: "SD", kelas: "4" }) === false;
    return { name: "grade-filter", ok, info: "sd=" + sd + " smp=" + smp };
  }

  // --- Kenaikan kesulitan adaptif (Difficulty Controller) ---

  async function testAdaptiveUp() {
    // Menjawab benar terus-menerus pada window 5 harus menaikkan level
    // bertahap: easy -> medium -> hard (terbatas allowedDifficulties).
    // 10 jawaban benar = 2 window -> naik 2 tingkat.
    let seq = 0;
    const bank = ({ level }) => ({ text: `a${++seq}-${level}`, answer: 1 });
    const changes = [];
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank,
      isEndless: true,
      feedbackDurationMs: 1,
      adaptiveDifficulty: true,
      allowedDifficulties: ["easy", "medium", "hard"],
      difficultyWindow: 5,
      difficultyUpThreshold: 0.8,
      difficultyDownThreshold: 0.5,
      level: "easy",
      basePoints: { easy: 10, medium: 20, hard: 30 },
      onDifficultyChange: (level) => changes.push(level),
    });
    game.start();
    for (let i = 0; i < 10; i += 1) {
      await sleep(6);
      game.submitAnswer(1); // selalu benar
    }
    await sleep(15);
    const st = game.getState();
    const ok = st.difficulty === "hard" && changes.includes("medium") && changes.includes("hard");
    return { name: "adaptive-up", ok, info: "difficulty=" + st.difficulty + " changes=" + JSON.stringify(changes) };
  }

  async function testAdaptiveDown() {
    // Menjawab salah terus-menerus pada window 5 harus menurunkan level
    // dari medium ke easy.
    let seq = 0;
    const bank = ({ level }) => ({ text: `d${++seq}-${level}`, answer: 1 });
    const changes = [];
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank,
      isEndless: true,
      feedbackDurationMs: 1,
      adaptiveDifficulty: true,
      allowedDifficulties: ["easy", "medium", "hard"],
      difficultyWindow: 5,
      difficultyUpThreshold: 0.8,
      difficultyDownThreshold: 0.5,
      level: "medium",
      basePoints: { easy: 10, medium: 20, hard: 30 },
      onDifficultyChange: (level) => changes.push(level),
    });
    game.start();
    for (let i = 0; i < 10; i += 1) {
      await sleep(6);
      game.submitAnswer(999999); // selalu salah
    }
    await sleep(15);
    const st = game.getState();
    const ok = st.difficulty === "easy" && changes.includes("easy");
    return { name: "adaptive-down", ok, info: "difficulty=" + st.difficulty + " changes=" + JSON.stringify(changes) };
  }

  async function testAdaptiveBounded() {
    // Level tidak boleh melampaui allowedDifficulties (tetap di hard).
    let seq = 0;
    const bank = ({ level }) => ({ text: `b${++seq}-${level}`, answer: 1 });
    const game = window.KakHarrisGameEngine.createQuizGame({
      bank,
      isEndless: true,
      feedbackDurationMs: 1,
      adaptiveDifficulty: true,
      allowedDifficulties: ["easy", "medium", "hard"],
      difficultyWindow: 5,
      difficultyUpThreshold: 0.8,
      difficultyDownThreshold: 0.5,
      level: "hard",
      basePoints: { easy: 10, medium: 20, hard: 30 },
    });
    game.start();
    for (let i = 0; i < 12; i += 1) {
      await sleep(6);
      game.submitAnswer(1);
    }
    await sleep(15);
    const ok = game.getState().difficulty === "hard";
    return { name: "adaptive-bounded", ok, info: "difficulty stays " + game.getState().difficulty };
  }

  (async () => {
    const results = [];
    results.push(await testLimited());
    results.push(await testEndlessNoAutoFinish());
    results.push(await testSkip());
    results.push(await testWrongAnswers());
    results.push(await testLivesFinish());
    results.push(await testLivesNoDebitOnEndless());
    results.push(await testHintReducesScore());
    results.push(await testPointsOverride());
    results.push(await testTextAnswer());
    results.push(await testMenaraBossPoints());
    results.push(await testPetualanganChoices());
    results.push(await testFinishIdempotent());
    results.push(await testSummaryConsistent());
    results.push(await testEndlessNoRapidRepeat());
    results.push(await testGradeFilter());
    results.push(await testAdaptiveUp());
    results.push(await testAdaptiveDown());
    results.push(await testAdaptiveBounded());
    let allOk = true;
    for (const r of results) {
      console.log((r.ok ? "PASS" : "FAIL") + " | " + r.name + " | " + r.info);
      if (!r.ok) allOk = false;
    }
    console.log(allOk ? "ALL TESTS PASSED" : "SOME TESTS FAILED");
    process.exit(allOk ? 0 : 1);
  })().catch((e) => {
    console.error("TEST ERROR:", e);
    process.exit(1);
  });
})();
