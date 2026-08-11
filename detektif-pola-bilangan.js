(async function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    grade: "SD",
    mode: "limited",
    game: null,
  };
  let storageKey = "";

  function getGrade(student) {
    const text = `${student.jenjang || ""} KELAS ${student.kelas || ""}`.toUpperCase();
    return text.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(text) ? "SMP" : "SD";
  }

  function renderSequence(q) {
    const raw = q.raw;
    $("sequence").replaceChildren(
      ...raw.values.map((value, index) => {
        const element = document.createElement("span");
        element.className = `pattern-number${index === raw.missingIndex ? " missing" : ""}`;
        element.textContent = index === raw.missingIndex ? "?" : value;
        return element;
      }),
    );
  }

  function updateBoard() {
    const gs = state.game ? state.game.getState() : { number: 0, score: 0, streak: 0, lives: 3 };
    $("case-number").textContent = state.mode === "limited" ? `${gs.number}/${DetektifPolaConfig.questionLimit}` : gs.number;
    $("score").textContent = gs.score;
    $("lives").textContent = state.mode === "endless" ? "∞" : gs.lives ? "♥ ".repeat(gs.lives).trim() : "0";
    $("streak").textContent = gs.streak;
  }

  function renderQuestion(q) {
    $("answer").value = "";
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("hint-button").disabled = false;
    renderSequence(q);
    updateBoard();
  }

  function renderFeedback(message, ok) {
    $("feedback").textContent = message;
    $("feedback").className = `feedback ${ok ? "correct" : "wrong"}`;
  }

  function onAnswer(outcome) {
    if (outcome.correct) {
      renderFeedback(`Kasus terpecahkan! +${outcome.points} poin.`, true);
    } else {
      renderFeedback(`Belum tepat. Jawabannya ${outcome.answer}.`, false);
    }
    updateBoard();
  }

  function onHint(question) {
    $("feedback").textContent = question.hint;
    $("feedback").className = "feedback hint";
    $("hint-button").disabled = true;
    updateBoard();
  }

  function buildGame() {
    const mode = state.mode;
    return KakHarrisGameEngine.createQuizGame({
      bank: DetektifPolaConfig.bank,
      basePoints: DetektifPolaConfig.basePoints,
      questionLimit: DetektifPolaConfig.questionLimit,
      feedbackDurationMs: DetektifPolaConfig.feedbackDurationMs,
      isEndless: mode === "endless",
      lives: mode === "limited" ? DetektifPolaConfig.lives : null,
      hintCost: DetektifPolaConfig.hintCost,
      grade: state.grade,
      pointsFor: ({ streak }) => 10 + Math.min(streak - 1, 5) * 2,
      getHint: (question) => question.hint,
      onQuestion: renderQuestion,
      onHint,
      onAnswer,
      onFinish(result) {
        saveResult(result);
        renderSummary(result);
      },
    });
  }

  function loadStats() {
    return KakHarrisGameEngine.loadStats(storageKey);
  }

  function saveResult(result) {
    const answered = result.correct + result.wrong;
    KakHarrisGameEngine.saveGameResult(storageKey, DetektifPolaConfig.perGameKey, {
      score: result.score,
      bestStreak: result.bestStreak,
      answered: answered,
      lastMode: state.mode,
    });
  }

  function renderSummary(result) {
    $("game-panel").classList.add("hidden");
    $("summary-panel").classList.remove("hidden");
    $("summary-score").textContent = result.score;
    $("summary-correct").textContent = result.correct;
    $("summary-wrong").textContent = result.wrong;
    $("summary-streak").textContent = result.bestStreak;
    $("summary-message").textContent =
      state.mode === "limited" && result.lives <= 0
        ? "Nyawamu habis. Coba pecahkan lebih banyak kasus!"
        : state.mode === "limited"
          ? "Semua kasus selesai. Hasil tersimpan di perangkat ini."
          : `Penyelidikan diakhiri setelah ${result.number} kasus.`;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function start() {
    state.mode = document.querySelector('[name="mode"]:checked')?.value || "limited";
    $("setup-panel").classList.add("hidden");
    $("summary-panel").classList.add("hidden");
    $("game-panel").classList.remove("hidden");
    state.game = buildGame();
    state.game.start();
  }

  function checkAnswer() {
    const input = $("answer");
    if (!input.value) return;
    state.game.submitAnswer(input.value);
  }

  $("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button) return;
    const key = button.dataset.key;
    const input = $("answer");
    if (key === "backspace") input.value = input.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (input.value.length < 8) input.value += key;
  });
  $("hint-button").addEventListener("click", () => {
    state.game.useHint();
  });
  $("end-button").addEventListener("click", () => {
    state.game.finish();
  });
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
