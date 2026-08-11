(async function () {
  "use strict";

  const CASE_LIMIT = 10;
  const state = { grade: "SD", mode: "limited", number: 0, score: 0, correct: 0, wrong: 0, lives: 3, streak: 0, bestStreak: 0, question: null, locked: false, hintUsed: false, recent: [] };
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[rand(0, items.length - 1)];
  let storageKey = "";

  function getGrade(student) {
    const text = `${student.jenjang || ""} KELAS ${student.kelas || ""}`.toUpperCase();
    return text.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(text) ? "SMP" : "SD";
  }

  function arithmetic(max, stepMax) {
    const first = rand(1, max), step = rand(2, stepMax);
    return { values: Array.from({ length: 6 }, (_, index) => first + index * step), hint: `Setiap angka bertambah ${step}.` };
  }

  function alternating(max, stepMax) {
    const first = rand(1, max), firstStep = rand(2, stepMax), secondStep = rand(1, stepMax - 1), values = [first];
    for (let index = 1; index < 6; index += 1) values.push(values[index - 1] + (index % 2 ? firstStep : secondStep));
    return { values, hint: `Kenaikannya bergantian: +${firstStep}, lalu +${secondStep}.` };
  }

  function multiples() {
    const factor = rand(2, 9);
    return { values: Array.from({ length: 6 }, (_, index) => factor * (index + 1)), hint: `Ini adalah kelipatan ${factor}.` };
  }

  function geometric() {
    const first = rand(1, 4), ratio = rand(2, 3);
    return { values: Array.from({ length: 6 }, (_, index) => first * ratio ** index), hint: `Setiap angka dikali ${ratio}.` };
  }

  function squares() {
    const first = rand(1, 5);
    return { values: Array.from({ length: 6 }, (_, index) => (first + index) ** 2), hint: "Ini adalah hasil kuadrat berurutan." };
  }

  function growingDifference() {
    const first = rand(1, 12), step = rand(1, 4), values = [first];
    for (let index = 1; index < 6; index += 1) values.push(values[index - 1] + step + index - 1);
    return { values, hint: `Selisihnya naik satu-satu, mulai dari +${step}.` };
  }

  function createQuestion() {
    const factories = state.grade === "SMP"
      ? [() => arithmetic(30, 15), () => alternating(20, 12), geometric, squares, growingDifference]
      : [() => arithmetic(20, 10), () => alternating(15, 8), multiples];
    let question, key;
    do {
      question = pick(factories)();
      question.missingIndex = rand(1, 4);
      question.answer = question.values[question.missingIndex];
      key = `${question.values}:${question.missingIndex}`;
    } while (state.recent.includes(key));
    state.recent.push(key);
    if (state.recent.length > 8) state.recent.shift();
    return question;
  }

  function updateBoard() {
    $("case-number").textContent = state.mode === "limited" ? `${state.number}/${CASE_LIMIT}` : state.number;
    $("score").textContent = state.score;
    $("lives").textContent = state.mode === "endless" ? "∞" : state.lives ? "♥ ".repeat(state.lives).trim() : "0";
    $("streak").textContent = state.streak;
  }

  function showQuestion() {
    if ($("game-panel").classList.contains("hidden")) return;
    if ((state.mode === "limited" && (state.number >= CASE_LIMIT || state.lives <= 0))) return finish();
    state.number += 1;
    state.question = createQuestion();
    state.locked = false;
    state.hintUsed = false;
    $("answer").value = "";
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("hint-button").disabled = false;
    $("sequence").replaceChildren(...state.question.values.map((value, index) => {
      const element = document.createElement("span");
      element.className = `pattern-number${index === state.question.missingIndex ? " missing" : ""}`;
      element.textContent = index === state.question.missingIndex ? "?" : value;
      return element;
    }));
    updateBoard();
  }

  function next(message, type) {
    $("feedback").textContent = message;
    $("feedback").className = `feedback ${type}`;
    window.setTimeout(showQuestion, 1050);
  }

  function checkAnswer() {
    const input = $("answer");
    if (state.locked || !input.value) return;
    state.locked = true;
    if (Number(input.value) === state.question.answer) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const points = 10 + Math.min(state.streak - 1, 5) * 2;
      state.score += points;
      next(`Kasus terpecahkan! +${points} poin.`, "correct");
    } else {
      state.wrong += 1;
      if (state.mode === "limited") state.lives -= 1;
      state.streak = 0;
      next(`Belum tepat. Jawabannya ${state.question.answer}.`, "wrong");
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
    return KakHarrisGameEngine.loadStats(storageKey);
  }

  function saveStats() {
    const answered = state.correct + state.wrong;
    KakHarrisGameEngine.saveGameResult(storageKey, "detektifPola", {
      score: state.score,
      bestStreak: state.bestStreak,
      answered: answered,
    });
  }

  function finish() {
    if ($("game-panel").classList.contains("hidden")) return;
    saveStats();
    $("game-panel").classList.add("hidden");
    $("summary-panel").classList.remove("hidden");
    $("summary-score").textContent = state.score;
    $("summary-correct").textContent = state.correct;
    $("summary-wrong").textContent = state.wrong;
    $("summary-streak").textContent = state.bestStreak;
    $("summary-message").textContent = state.mode === "limited" && state.lives <= 0
      ? "Nyawamu habis. Coba pecahkan lebih banyak kasus!"
      : state.mode === "limited" ? "Semua kasus selesai. Hasil tersimpan di perangkat ini." : `Penyelidikan diakhiri setelah ${state.number} kasus.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function start() {
    state.mode = document.querySelector('[name="mode"]:checked')?.value || "limited";
    Object.assign(state, { number: 0, score: 0, correct: 0, wrong: 0, lives: 3, streak: 0, bestStreak: 0, question: null, locked: false, hintUsed: false, recent: [] });
    $("setup-panel").classList.add("hidden");
    $("summary-panel").classList.add("hidden");
    $("game-panel").classList.remove("hidden");
    showQuestion();
  }

  $("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button || state.locked) return;
    const key = button.dataset.key, input = $("answer");
    if (key === "backspace") input.value = input.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (input.value.length < 8) input.value += key;
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
    const auth = await KakHarrisGameEngine.initStudentAuth(["murid"]);
    if (!auth) return;
    state.grade = getGrade(auth.student);
    storageKey = auth.storageKey;
    const lastMode = loadStats().perGame?.detektifPola?.lastMode;
    const modeInput = lastMode && document.querySelector(`[name="mode"][value="${lastMode}"]`);
    if (modeInput) modeInput.checked = true;
    $("setup-status").textContent = `Kesulitan disiapkan untuk jenjang ${state.grade}.`;
    $("start-button").disabled = false;
    $("start-button").textContent = "Mulai Penyelidikan →";
  } catch (error) {
    $("setup-status").textContent = error.message || "Permainan gagal disiapkan.";
  }
})();
