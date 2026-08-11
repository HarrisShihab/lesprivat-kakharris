(async function () {
  "use strict";

  const setupPanel = document.getElementById("setup-panel");
  const gamePanel = document.getElementById("game-panel");
  const summaryPanel = document.getElementById("summary-panel");
  const setupForm = document.getElementById("shop-setup-form");
  const startButton = document.getElementById("start-button");
  const setupStatus = document.getElementById("setup-status");
  const answerInput = document.getElementById("answer");
  const feedback = document.getElementById("feedback");
  const customer = document.getElementById("customer");

  const state = {
    level: "easy",
    mode: "limited",
    game: null,
    coins: 0,
    served: 0,
    transaction: null,
  };

  const coinPerLevel = { easy: 2, medium: 4, hard: 6 };
  let storageKey = "";
  let gameReady = false;

  function formatRupiah(value) {
    return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
  }

  function updateStatus() {
    const gs = state.game ? state.game.getState() : { score: 0, streak: 0 };
    document.getElementById("score").textContent = gs.score;
    document.getElementById("coins").textContent = state.coins;
    document.getElementById("served").textContent = state.served;
    document.getElementById("streak").textContent = gs.streak;
    document.getElementById("reputation-bar").style.width = `${Math.min(100, state.served * 10)}%`;
  }

  function renderProducts(items) {
    const list = document.getElementById("product-list");
    list.textContent = "";
    items.forEach((item) => {
      const card = document.createElement("div");
      card.className = "product";

      const icon = document.createElement("span");
      icon.className = "product-icon";
      icon.setAttribute("aria-hidden", "true");
      icon.textContent = item.icon;

      const name = document.createElement("span");
      name.className = "product-name";
      name.textContent = item.name;

      const price = document.createElement("span");
      price.className = "product-price";
      price.textContent = formatRupiah(item.price);

      card.append(icon, name, price);
      if (item.qty > 1) {
        const quantity = document.createElement("span");
        quantity.className = "product-qty";
        quantity.textContent = `×${item.qty}`;
        card.append(quantity);
      }
      list.append(card);
    });
  }

  function resetCustomer() {
    customer.classList.remove("is-happy", "is-wrong");
    void customer.offsetWidth;
    document.getElementById("customer-mouth").className = "customer-mouth";
  }

  function renderTransaction(q) {
    const tx = q.raw;
    resetCustomer();
    document.getElementById("transaction-number").textContent = q.total == null ? `Pelanggan ${q.number}` : `Pelanggan ${q.number}/${q.total}`;
    document.getElementById("task-label").textContent = tx.label;
    document.getElementById("question").textContent = tx.question;
    document.getElementById("question-note").textContent = tx.note;
    document.getElementById("register-total").textContent = tx.registerTotal;
    document.getElementById("speech-bubble").textContent = tx.speech;
    renderProducts(tx.items);
    answerInput.value = "";
    updateFormattedAnswer();
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.disabled = false;
    state.transaction = tx;
  }

  function renderFeedback(message, ok) {
    feedback.textContent = message;
    feedback.className = `feedback ${ok ? "correct" : "wrong"}`;
    answerInput.disabled = true;
  }

  function animateCoin(amount) {
    const coin = document.createElement("div");
    coin.className = "coin-pop";
    coin.textContent = `+${amount}`;
    document.body.append(coin);
    window.setTimeout(() => coin.remove(), 800);
  }

  function renderSummary(result) {
    gamePanel.classList.add("hidden");
    summaryPanel.classList.remove("hidden");
    document.getElementById("summary-score").textContent = result.score;
    document.getElementById("summary-coins").textContent = state.coins;
    document.getElementById("summary-served").textContent = state.served;
    document.getElementById("summary-streak").textContent = result.bestStreak;
    document.getElementById("summary-message").textContent =
      state.served >= 10 ? "Luar biasa, reputasi tokomu sedang naik!" : state.served >= 5 ? "Bagus! Kamu sudah menjadi kasir yang teliti." : "Coba lagi dan layani lebih banyak pelanggan.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onAnswer(outcome) {
    const tx = state.transaction;
    const unit = tx && tx.type === "quantity" ? " barang" : "";
    if (outcome.correct) {
      state.served += 1;
      const coins = coinPerLevel[outcome.level] || 2;
      state.coins += coins;
      const base = TokoMatematikaConfig.basePoints[outcome.level] || 20;
      const bonus = outcome.points - base;
      customer.classList.add("is-happy");
      animateCoin(coins);
      renderFeedback(bonus > 0 ? `Tepat! Bonus streak +${bonus} poin.` : "Tepat! Pelanggan puas.", true);
    } else {
      customer.classList.add("is-wrong");
      renderFeedback(`Belum tepat. Jawabannya ${Number(outcome.answer).toLocaleString("id-ID")}${unit}.`, false);
    }
    updateStatus();
  }

  function buildGame() {
    const mode = state.mode;
    return KakHarrisGameEngine.createQuizGame({
      bank: TokoMatematikaConfig.bank,
      basePoints: TokoMatematikaConfig.basePoints,
      questionLimit: TokoMatematikaConfig.questionLimit,
      feedbackDurationMs: TokoMatematikaConfig.feedbackDurationMs,
      isEndless: mode === "endless",
      level: state.level,
      // Kenaikan kesulitan adaptif aktif pada mode Endless.
      adaptiveDifficulty: mode === "endless",
      allowedDifficulties: ["easy", "medium", "hard"],
      difficultyWindow: 5,
      onQuestion: renderTransaction,
      onAnswer,
      onDifficultyChange(level) {
        renderFeedback(`Level toko naik ke ${levelText(level)}.`, true);
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
    KakHarrisGameEngine.saveGameResult(storageKey, TokoMatematikaConfig.perGameKey, {
      score: result.score,
      bestStreak: result.bestStreak,
      answered: answered,
      lastLevel: state.level,
      lastMode: state.mode,
    });
  }

  function startGame() {
    state.coins = 0;
    state.served = 0;
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
    state.level = new FormData(setupForm).get("level");
    state.mode = new FormData(setupForm).get("mode") || "limited";
    startGame();
  });

  document.getElementById("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button) return;
    const key = button.dataset.key;
    if (key === "backspace") answerInput.value = answerInput.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (answerInput.value.length < 9) answerInput.value += key;
    updateFormattedAnswer();
  });

  function updateFormattedAnswer() {
    const value = Number(answerInput.value || 0);
    const tx = state.transaction;
    document.getElementById("formatted-answer").textContent = tx && tx.type === "quantity" ? `${value.toLocaleString("id-ID")} barang` : formatRupiah(value);
  }

  function checkAnswer() {
    if (answerInput.value.trim() === "") return;
    state.game.submitAnswer(answerInput.value);
  }

  answerInput.addEventListener("input", () => {
    answerInput.value = answerInput.value.replace(/\D/g, "").slice(0, 9);
    updateFormattedAnswer();
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
      const lastLevel = saved.perGame && saved.perGame.tokoMatematika ? saved.perGame.tokoMatematika.lastLevel : null;
      if (lastLevel) {
        const levelInput = setupForm.querySelector(`[name="level"][value="${lastLevel}"]`);
        if (levelInput) levelInput.checked = true;
      }
      const lastMode = saved.perGame?.tokoMatematika?.lastMode;
      if (lastMode) {
        const modeInput = setupForm.querySelector(`[name="mode"][value="${lastMode}"]`);
        if (modeInput) modeInput.checked = true;
      }

      gameReady = true;
      startButton.disabled = false;
      startButton.innerHTML = 'Buka Toko <span aria-hidden="true">→</span>';
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
