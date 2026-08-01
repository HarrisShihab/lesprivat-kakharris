(async function () {
  "use strict";

  const TOTAL_FLOORS = 10;
  const state = { mode: "limited", floor: 0, score: 0, correct: 0, wrong: 0, lives: 3, streak: 0, bestStreak: 0, question: null, locked: false, hintUsed: false, recent: [] };
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[rand(0, items.length - 1)];
  let storageKey = "";

  function signed(minAbs, maxAbs) {
    const value = rand(minAbs, maxAbs);
    return Math.random() < 0.28 ? -value : value;
  }

  function isSmpStudent(student) {
    const data = `${student.jenjang || ""} KELAS ${student.kelas || ""}`.toUpperCase();
    return data.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(data);
  }

  function formatLinear(a, b) {
    const aText = a === 1 ? "x" : a === -1 ? "−x" : `${a}x`;
    if (b === 0) return aText;
    return `${aText} ${b > 0 ? "+" : "−"} ${Math.abs(b)}`;
  }

  function oneStepMultiply() {
    const x = signed(2, 12), a = rand(2, 9);
    return { answer: x, equation: `${a}x = ${a * x}`, hint: `Bagi kedua ruas dengan ${a}.` };
  }

  function oneStepAdd() {
    const x = signed(2, 15), b = signed(2, 12);
    return { answer: x, equation: `x ${b > 0 ? "+" : "−"} ${Math.abs(b)} = ${x + b}`, hint: `${b > 0 ? "Kurangi" : "Tambah"} kedua ruas dengan ${Math.abs(b)}.` };
  }

  function twoStep() {
    const x = signed(2, 12), a = rand(2, 9), b = signed(1, 15), c = a * x + b;
    return { answer: x, equation: `${formatLinear(a, b)} = ${c}`, hint: `Pindahkan ${b > 0 ? b : `−${Math.abs(b)}`} terlebih dahulu, lalu bagi dengan ${a}.` };
  }

  function bothSides() {
    const x = signed(2, 10), rightA = rand(1, 5), leftA = rand(rightA + 1, rightA + 6), leftB = signed(1, 12);
    const rightB = (leftA - rightA) * x + leftB;
    return { answer: x, equation: `${formatLinear(leftA, leftB)} = ${formatLinear(rightA, rightB)}`, hint: `Kumpulkan suku x di kiri dan konstanta di kanan.` };
  }

  function bracket() {
    const x = signed(2, 8), a = rand(2, 5), b = signed(1, 8), c = a * (x + b);
    return { answer: x, equation: `${a}(x ${b > 0 ? "+" : "−"} ${Math.abs(b)}) = ${c}`, hint: `Bagi kedua ruas dengan ${a}, lalu isolasi x.` };
  }

  function createQuestion() {
    const factories = state.floor <= 3 ? [oneStepMultiply, oneStepAdd] : state.floor <= 7 ? [twoStep, twoStep, bothSides] : [twoStep, bothSides, bracket];
    let question, key;
    do {
      question = pick(factories)();
      key = question.equation;
    } while (state.recent.includes(key));
    state.recent.push(key);
    if (state.recent.length > 7) state.recent.shift();
    return question;
  }

  function updateBoard() {
    $("floor-number").textContent = state.mode === "limited" ? `${state.floor}/${TOTAL_FLOORS}` : state.floor;
    $("score").textContent = state.score;
    $("lives").textContent = state.mode === "endless" ? "∞" : state.lives ? "♥ ".repeat(state.lives).trim() : "0";
    $("streak").textContent = state.streak;
    const towerFloor = ((state.floor - 1) % TOTAL_FLOORS) + 1;
    $("progress-fill").style.width = `${Math.max(10, towerFloor * 10)}%`;
  }

  function showFloor() {
    if ($("game-panel").classList.contains("hidden")) return;
    if (state.mode === "limited" && (state.floor >= TOTAL_FLOORS || state.lives <= 0)) return finish();
    state.floor += 1;
    state.question = createQuestion();
    state.locked = false;
    state.hintUsed = false;
    $("answer").value = "";
    $("equation").textContent = state.question.equation;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("hint-button").disabled = false;
    const bossFloor = state.floor % TOTAL_FLOORS === 0;
    $("floor-label").textContent = bossFloor ? `Lantai ${state.floor} · Penjaga Menara` : `Lantai ${state.floor}`;
    $("floor-label").className = `floor-label${bossFloor ? " boss" : ""}`;
    updateBoard();
  }

  function continueAfter(message, type) {
    $("feedback").textContent = message;
    $("feedback").className = `feedback ${type}`;
    window.setTimeout(showFloor, 1100);
  }

  function checkAnswer() {
    const input = $("answer");
    if (state.locked || input.value === "" || input.value === "-") return;
    state.locked = true;
    if (Number(input.value) === state.question.answer) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const bossFloor = state.floor % TOTAL_FLOORS === 0;
      const points = (bossFloor ? 25 : 10) + Math.min(state.streak - 1, 5) * 2;
      state.score += points;
      continueAfter(bossFloor ? `Penjaga tumbang! +${points} poin.` : `Gerbang terbuka! +${points} poin.`, "correct");
    } else {
      state.wrong += 1;
      if (state.mode === "limited") state.lives -= 1;
      state.streak = 0;
      continueAfter(`Gerbang menolak. Nilai x adalah ${state.question.answer}.`, "wrong");
    }
    updateBoard();
  }

  function useHint() {
    if (state.locked || state.hintUsed) return;
    state.hintUsed = true;
    state.score = Math.max(0, state.score - 5);
    $("feedback").textContent = state.question.hint;
    $("feedback").className = "feedback hint";
    $("hint-button").disabled = true;
    updateBoard();
  }

  function loadStats() {
    try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch (error) { return {}; }
  }

  function saveStats() {
    const stats = loadStats();
    const answered = state.correct + state.wrong;
    const old = stats.perGame?.menaraAljabar || {};
    const perGame = Object.assign({}, stats.perGame, { menaraAljabar: { bestScore: Math.max(old.bestScore || 0, state.score), bestStreak: Math.max(old.bestStreak || 0, state.bestStreak), totalAnswered: (old.totalAnswered || 0) + answered, gamesPlayed: (old.gamesPlayed || 0) + 1, lastMode: state.mode } });
    try {
      localStorage.setItem(storageKey, JSON.stringify(Object.assign({}, stats, { bestScore: Math.max(stats.bestScore || 0, state.score), bestStreak: Math.max(stats.bestStreak || 0, state.bestStreak), totalAnswered: (stats.totalAnswered || 0) + answered, gamesPlayed: (stats.gamesPlayed || 0) + 1, perGame })));
    } catch (error) { /* Statistik lokal bersifat opsional. */ }
  }

  function finish() {
    if ($("game-panel").classList.contains("hidden")) return;
    saveStats();
    $("game-panel").classList.add("hidden");
    $("summary-panel").classList.remove("hidden");
    const conquered = state.mode === "limited" && state.floor >= TOTAL_FLOORS && state.correct + state.wrong >= TOTAL_FLOORS && state.lives > 0;
    $("summary-title").textContent = conquered ? "Menara berhasil ditaklukkan!" : "Pendakian selesai";
    $("summary-mark").textContent = conquered ? "★" : "↟";
    $("summary-message").textContent = conquered ? "Kamu mencapai puncak dan mengalahkan Penjaga Menara." : state.mode === "endless" ? `Pendakian diakhiri di lantai ${state.floor}.` : `Kamu mencapai lantai ${state.floor}. Coba lagi untuk sampai ke puncak.`;
    $("summary-score").textContent = state.score;
    $("summary-correct").textContent = state.correct;
    $("summary-wrong").textContent = state.wrong;
    $("summary-streak").textContent = state.bestStreak;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function start() {
    state.mode = document.querySelector('[name="mode"]:checked')?.value || "limited";
    Object.assign(state, { floor: 0, score: 0, correct: 0, wrong: 0, lives: 3, streak: 0, bestStreak: 0, question: null, locked: false, hintUsed: false, recent: [] });
    $("setup-panel").classList.add("hidden");
    $("summary-panel").classList.add("hidden");
    $("game-panel").classList.remove("hidden");
    showFloor();
  }

  $("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button || state.locked) return;
    const key = button.dataset.key;
    const input = $("answer");
    if (key === "backspace") input.value = input.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (key === "minus") input.value = input.value.startsWith("-") ? input.value.slice(1) : `-${input.value}`;
    else if (input.value.replace("-", "").length < 4) input.value += key;
  });
  $("hint-button").addEventListener("click", useHint);
  $("end-button").addEventListener("click", finish);
  $("replay-button").addEventListener("click", () => {
    $("summary-panel").classList.add("hidden");
    $("setup-panel").classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  $("start-button").addEventListener("click", start);

  try {
    await firebasePortal.guard(["murid"]);
    const student = await firebasePortal.getCurrentMurid();
    if (!student) throw new Error("Akun belum terhubung ke data murid.");
    if (!isSmpStudent(student)) throw new Error("Game Menara Aljabar khusus untuk murid SMP.");
    storageKey = `kakHarrisGameStats:${student.id || student.username || "murid"}`;
    const lastMode = loadStats().perGame?.menaraAljabar?.lastMode;
    const modeInput = lastMode && document.querySelector(`[name="mode"][value="${lastMode}"]`);
    if (modeInput) modeInput.checked = true;
    $("setup-status").textContent = "Kesulitan meningkat hingga pertarungan Penjaga Menara.";
    $("start-button").disabled = false;
    $("start-button").textContent = "Masuk Menara →";
  } catch (error) {
    const setupStatus = $("setup-status");
    const startButton = $("start-button");
    const backLink = document.querySelector("#setup-panel .secondary-button");

    setupStatus.textContent = error.message || "Permainan gagal disiapkan.";
    setupStatus.classList.add("error");
    startButton.hidden = true;

    if (backLink) {
      backLink.textContent = "Kembali ke Daftar Game";
      backLink.classList.remove("secondary-button");
      backLink.classList.add("primary-button");
    }
  }
})();
