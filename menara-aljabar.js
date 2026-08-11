(async function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    mode: "limited",
    game: null,
  };
  let storageKey = "";

  function isSmpStudent(student) {
    const data = `${student.jenjang || ""} KELAS ${student.kelas || ""}`.toUpperCase();
    return data.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(data);
  }

  function updateBoard() {
    const gs = state.game ? state.game.getState() : { number: 0, score: 0, streak: 0, lives: 3 };
    $("floor-number").textContent = state.mode === "limited" ? `${gs.number}/${MenaraAljabarConfig.questionLimit}` : gs.number;
    $("score").textContent = gs.score;
    $("lives").textContent = state.mode === "endless" ? "∞" : gs.lives ? "♥ ".repeat(gs.lives).trim() : "0";
    $("streak").textContent = gs.streak;
    const towerFloor = ((gs.number - 1) % MenaraAljabarConfig.questionLimit) + 1;
    $("progress-fill").style.width = `${Math.max(10, towerFloor * 10)}%`;
  }

  function renderFloor(q) {
    const raw = q.raw;
    $("answer").value = "";
    $("equation").textContent = raw.equation;
    $("feedback").textContent = "";
    $("feedback").className = "feedback";
    $("hint-button").disabled = false;
    const bossFloor = raw.boss;
    $("floor-label").textContent = bossFloor ? `Lantai ${q.number} · Penjaga Menara` : `Lantai ${q.number}`;
    $("floor-label").className = `floor-label${bossFloor ? " boss" : ""}`;
    updateBoard();
  }

  function renderFeedback(message, ok) {
    $("feedback").textContent = message;
    $("feedback").className = `feedback ${ok ? "correct" : "wrong"}`;
  }

  function onAnswer(outcome) {
    const raw = gameQuestion();
    const isBoss = raw && raw.boss;
    if (outcome.correct) {
      renderFeedback(isBoss ? `Penjaga tumbang! +${outcome.points} poin.` : `Gerbang terbuka! +${outcome.points} poin.`, true);
    } else {
      renderFeedback(`Gerbang menolak. Nilai x adalah ${outcome.answer}.`, false);
    }
    updateBoard();
  }

  function gameQuestion() {
    return state.game ? state.game.getState().question : null;
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
      bank: MenaraAljabarConfig.bank,
      basePoints: MenaraAljabarConfig.basePoints,
      questionLimit: MenaraAljabarConfig.questionLimit,
      feedbackDurationMs: MenaraAljabarConfig.feedbackDurationMs,
      isEndless: mode === "endless",
      lives: mode === "limited" ? MenaraAljabarConfig.lives : null,
      hintCost: MenaraAljabarConfig.hintCost,
      pointsFor: ({ number, streak }) => {
        const isBoss = number % MenaraAljabarConfig.questionLimit === 0;
        return (isBoss ? 25 : 10) + Math.min(streak - 1, 5) * 2;
      },
      getHint: (question) => question.hint,
      onQuestion: renderFloor,
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
    KakHarrisGameEngine.saveGameResult(storageKey, MenaraAljabarConfig.perGameKey, {
      score: result.score,
      bestStreak: result.bestStreak,
      answered: answered,
      lastMode: state.mode,
    });
  }

  function renderSummary(result) {
    const conquered = state.mode === "limited" && result.number >= MenaraAljabarConfig.questionLimit && result.correct + result.wrong >= MenaraAljabarConfig.questionLimit && result.lives > 0;
    $("game-panel").classList.add("hidden");
    $("summary-panel").classList.remove("hidden");
    $("summary-title").textContent = conquered ? "Menara berhasil ditaklukkan!" : "Pendakian selesai";
    $("summary-mark").textContent = conquered ? "★" : "↟";
    $("summary-message").textContent = conquered
      ? "Kamu mencapai puncak dan mengalahkan Penjaga Menara."
      : state.mode === "endless"
        ? `Pendakian diakhiri di lantai ${result.number}.`
        : `Kamu mencapai lantai ${result.number}. Coba lagi untuk sampai ke puncak.`;
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

  function checkAnswer() {
    const input = $("answer");
    if (input.value === "" || input.value === "-") return;
    state.game.submitAnswer(input.value);
  }

  $("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button) return;
    const key = button.dataset.key;
    const input = $("answer");
    if (key === "backspace") input.value = input.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (key === "minus") input.value = input.value.startsWith("-") ? input.value.slice(1) : `-${input.value}`;
    else if (input.value.replace("-", "").length < 4) input.value += key;
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
    if (!isSmpStudent(auth.student)) throw new Error("Game Menara Aljabar khusus untuk murid SMP.");
    storageKey = auth.storageKey;
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
