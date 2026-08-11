(async function () {
  "use strict";

  const setupPanel = document.getElementById("setup-panel");
  const gamePanel = document.getElementById("game-panel");
  const summaryPanel = document.getElementById("summary-panel");
  const setupForm = document.getElementById("game-setup");
  const startButton = document.getElementById("start-button");
  const setupStatus = document.getElementById("setup-status");
  const answerInput = document.getElementById("answer");
  const feedback = document.getElementById("feedback");

  const state = {
    operation: "addition",
    level: "easy",
    mode: "limited",
    game: null,
  };

  let storageKey = "";
  let gameReady = false;

  function scoreboardView(engineState) {
    document.getElementById("score").textContent = engineState.score;
    document.getElementById("correct-count").textContent = engineState.correct;
    document.getElementById("wrong-count").textContent = engineState.wrong;
    document.getElementById("streak").textContent = engineState.streak;
  }

  function renderQuestion(q) {
    document.getElementById("question-number").textContent = q.total == null ? `Soal ${q.number}` : `Soal ${q.number}/${q.total}`;
    document.getElementById("question").textContent = q.text;
    answerInput.value = "";
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.disabled = false;
  }

  function renderFeedback(message, ok) {
    feedback.textContent = message;
    feedback.className = `feedback ${ok ? "correct" : "wrong"}`;
    answerInput.disabled = true;
  }

  function renderSummary(result) {
    gamePanel.classList.add("hidden");
    summaryPanel.classList.remove("hidden");
    document.getElementById("summary-score").textContent = result.score;
    document.getElementById("summary-correct").textContent = result.correct;
    document.getElementById("summary-wrong").textContent = result.wrong;
    document.getElementById("summary-streak").textContent = result.bestStreak;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildGame() {
    const mode = state.mode;
    return KakHarrisGameEngine.createQuizGame({
      bank: HitungTanpaBatasConfig.bank,
      basePoints: HitungTanpaBatasConfig.basePoints,
      questionLimit: HitungTanpaBatasConfig.questionLimit,
      feedbackDurationMs: HitungTanpaBatasConfig.feedbackDurationMs,
      isEndless: mode === "endless",
      level: state.level,
      operation: state.operation,
      // Kenaikan kesulitan adaptif aktif pada mode Endless.
      adaptiveDifficulty: mode === "endless",
      allowedDifficulties: ["easy", "medium", "hard"],
      difficultyWindow: 5,
      onQuestion: renderQuestion,
      onFeedback: renderFeedback,
      onScoreboard: scoreboardView,
      onDifficultyChange(level) {
        renderFeedback(`Level naik ke ${levelText(level)}.`, true);
      },
      onFinish(result) {
        saveResult(result);
        renderSummary(result);
      },
    });
  }

  function levelText(level) {
    return { easy: "Mudah", medium: "Sedang", hard: "Sulit" }[level] || level;
  }

  function loadStats() {
    return KakHarrisGameEngine.loadStats(storageKey);
  }

  function saveResult(result) {
    const answered = result.correct + result.wrong;
    KakHarrisGameEngine.saveGameResult(storageKey, HitungTanpaBatasConfig.perGameKey, {
      score: result.score,
      bestStreak: result.bestStreak,
      answered: answered,
      lastOperation: state.operation,
      lastLevel: state.level,
      lastMode: state.mode,
    });
  }

  function startGame() {
    setupPanel.classList.add("hidden");
    summaryPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");
    state.game = buildGame();
    state.game.start();
  }

  setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!gameReady) {
      setupStatus.textContent = "Permainan masih disiapkan. Tunggu sebentar.";
      return;
    }
    const formData = new FormData(setupForm);
    state.operation = formData.get("operation");
    state.level = formData.get("level");
    state.mode = formData.get("mode") || "limited";
    startGame();
  });

  document.getElementById("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button) return;
    const key = button.dataset.key;
    if (key === "backspace") answerInput.value = answerInput.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (answerInput.value.length < 8) answerInput.value += key;
  });

  function checkAnswer() {
    if (answerInput.value.trim() === "") return;
    state.game.submitAnswer(answerInput.value);
  }

  answerInput.addEventListener("input", () => {
    answerInput.value = answerInput.value.replace(/\D/g, "").slice(0, 8);
  });
  answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
  document.getElementById("skip-button").addEventListener("click", () => {
    state.game.skipQuestion();
  });
  document.getElementById("end-button").addEventListener("click", () => {
    state.game.finish();
  });
  document.getElementById("replay-button").addEventListener("click", () => {
    summaryPanel.classList.add("hidden");
    setupPanel.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  async function initializeGame() {
    try {
      const auth = await KakHarrisGameEngine.initStudentAuth(["murid"]);
      if (!auth) return;
      storageKey = auth.storageKey;

      const saved = loadStats();
      if (saved.lastOperation) {
        const operation = setupForm.querySelector(`[name="operation"][value="${saved.lastOperation}"]`);
        if (operation) operation.checked = true;
      }
      if (saved.lastLevel) {
        const level = setupForm.querySelector(`[name="level"][value="${saved.lastLevel}"]`);
        if (level) level.checked = true;
      }
      const savedMode = saved.lastMode || saved.perGame?.hitungTanpaBatas?.lastMode;
      if (savedMode) {
        const mode = setupForm.querySelector(`[name="mode"][value="${savedMode}"]`);
        if (mode) mode.checked = true;
      }

      gameReady = true;
      startButton.disabled = false;
      startButton.innerHTML = 'Mulai Bermain <span aria-hidden="true">→</span>';
      setupStatus.textContent = "";
    } catch (error) {
      console.error("Game:", error);
      startButton.disabled = true;
      startButton.textContent = "Tidak dapat dimulai";
      setupStatus.textContent = error.message || "Permainan gagal disiapkan. Muat ulang halaman.";
      setupStatus.classList.add("error");
    }
  }

  initializeGame();
})();
