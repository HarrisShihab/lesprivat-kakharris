(async function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    mode: "limited",
    game: null,
  };
  let storageKey = "";

  function isSdStudent(student) {
    const data = `${student.jenjang || ""} KELAS ${student.kelas || ""}`.toUpperCase();
    if (data.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(data)) return false;
    return data.includes("SD") || /KELAS\s*([1-6])\b/.test(data);
  }

  function updateBoard() {
    const gs = state.game ? state.game.getState() : { number: 0, score: 0, streak: 0, lives: 3 };
    $("mission-number").textContent = state.mode === "limited" ? `${gs.number}/${PetualanganPecahanConfig.questionLimit}` : gs.number;
    $("score").textContent = gs.score;
    $("lives").textContent = state.mode === "endless" ? "∞" : gs.lives ? "♥ ".repeat(gs.lives).trim() : "0";
    $("streak").textContent = gs.streak;
    const islandMission = ((gs.number - 1) % PetualanganPecahanConfig.questionLimit) + 1;
    $("progress-fill").style.width = `${Math.max(10, islandMission * 10)}%`;
  }

  function renderVisual(question) {
    const container = $("fraction-visual");
    container.replaceChildren();
    if (question.type === "visual") {
      for (let i = 0; i < question.d; i += 1) {
        const piece = document.createElement("span");
        piece.className = `fraction-piece${i < question.n ? " filled" : ""}`;
        container.appendChild(piece);
      }
    } else {
      const symbol = document.createElement("span");
      symbol.className = "fraction-symbol";
      symbol.textContent = question.symbol;
      container.appendChild(symbol);
    }
  }

  function renderMission(q) {
    const raw = q.raw;
    $("mission-label").textContent = raw.label;
    $("question-text").textContent = raw.text;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("hint-button").disabled = false;
    renderVisual(raw);
    $("choices").replaceChildren(
      ...raw.choices.map((choice) => {
        const button = document.createElement("button");
        button.className = "fraction-choice";
        button.type = "button";
        button.textContent = choice;
        button.dataset.answer = choice;
        return button;
      }),
    );
    updateBoard();
  }

  function renderFeedback(message, ok) {
    $("feedback").textContent = message;
    $("feedback").className = `feedback ${ok ? "correct" : "wrong"}`;
  }

  function onAnswer(outcome) {
    // Sorot pilihan benar dan kunci semua tombol setelah satu jawaban.
    $("choices")
      .querySelectorAll("button")
      .forEach((item) => {
        item.disabled = true;
        if (item.dataset.answer === String(outcome.answer)) item.classList.add("correct");
      });
    if (outcome.correct) {
      renderFeedback(`Misi berhasil! +${outcome.points} poin.`, true);
    } else {
      const selected = $("choices").querySelector(`[data-answer="${CSS.escape(outcome.submitted)}"]`);
      if (selected) selected.classList.add("wrong");
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
      bank: PetualanganPecahanConfig.bank,
      basePoints: PetualanganPecahanConfig.basePoints,
      questionLimit: PetualanganPecahanConfig.questionLimit,
      feedbackDurationMs: PetualanganPecahanConfig.feedbackDurationMs,
      isEndless: mode === "endless",
      lives: mode === "limited" ? PetualanganPecahanConfig.lives : null,
      hintCost: PetualanganPecahanConfig.hintCost,
      pointsFor: ({ streak }) => 10 + Math.min(streak - 1, 5) * 2,
      getHint: (question) => question.hint,
      onQuestion: renderMission,
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
    KakHarrisGameEngine.saveGameResult(storageKey, PetualanganPecahanConfig.perGameKey, {
      score: result.score,
      bestStreak: result.bestStreak,
      answered: answered,
      lastMode: state.mode,
    });
  }

  function renderSummary(result) {
    const won = state.mode === "limited" && result.number >= PetualanganPecahanConfig.questionLimit && result.correct + result.wrong >= PetualanganPecahanConfig.questionLimit && result.lives > 0;
    $("game-panel").classList.add("hidden");
    $("summary-panel").classList.remove("hidden");
    $("summary-title").textContent = won ? "Kristal Pecahan ditemukan!" : "Petualangan selesai";
    $("summary-mark").textContent = won ? "◆" : "🏝";
    $("summary-message").textContent = won
      ? "Kamu berhasil menuntaskan seluruh misi di Pulau Pecahan."
      : state.mode === "endless"
        ? `Petualangan diakhiri setelah ${result.number} misi.`
        : `Kamu mencapai misi ${result.number}. Coba lagi untuk menemukan kristal.`;
    $("summary-score").textContent = result.score;
    $("summary-correct").textContent = result.correct;
    $("summary-wrong").textContent = result.wrong;
    $("summary-streak").textContent = result.bestStreak;
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

  function chooseAnswer(button) {
    if (!button || button.disabled) return;
    state.game.submitAnswer(button.dataset.answer);
  }

  $("choices").addEventListener("click", (event) => {
    const button = event.target.closest("[data-answer]");
    if (button) chooseAnswer(button);
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
    if (!isSdStudent(auth.student)) throw new Error("Game Petualangan Pecahan khusus untuk murid SD.");
    storageKey = auth.storageKey;
    const lastMode = loadStats().perGame?.petualanganPecahan?.lastMode;
    const modeInput = lastMode && document.querySelector(`[name="mode"][value="${lastMode}"]`);
    if (modeInput) modeInput.checked = true;
    $("setup-status").textContent = "Misi visual, pecahan senilai, perbandingan, dan operasi sederhana siap.";
    $("start-button").disabled = false;
    $("start-button").textContent = "Buka Peta →";
  } catch (error) {
    $("setup-status").textContent = error.message || "Permainan gagal disiapkan.";
  }
})();
