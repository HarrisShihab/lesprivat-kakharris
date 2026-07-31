(async function () {
  "use strict";

  const products = [
    { name: "Pensil", icon: "✏️", easy: 2000, medium: 2500, hard: 3500 },
    { name: "Buku", icon: "📘", easy: 5000, medium: 7500, hard: 12500 },
    { name: "Penghapus", icon: "🧽", easy: 1000, medium: 2000, hard: 2500 },
    { name: "Susu", icon: "🥛", easy: 4000, medium: 6500, hard: 8500 },
    { name: "Roti", icon: "🍞", easy: 3000, medium: 5500, hard: 7500 },
    { name: "Apel", icon: "🍎", easy: 2000, medium: 4000, hard: 6500 },
    { name: "Jus", icon: "🧃", easy: 4000, medium: 7000, hard: 9500 },
    { name: "Mainan", icon: "🧸", easy: 8000, medium: 15000, hard: 27500 },
    { name: "Penggaris", icon: "📏", easy: 3000, medium: 4500, hard: 6000 },
    { name: "Cokelat", icon: "🍫", easy: 5000, medium: 8500, hard: 11500 },
  ];

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
    transaction: null,
    score: 0,
    coins: 0,
    served: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    number: 0,
    locked: false,
    recent: [],
  };

  const levelPoints = { easy: 20, medium: 35, hard: 50 };
  let storageKey = "";
  let gameReady = false;

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomItems(count) {
    const available = products.slice();
    const picked = [];
    while (picked.length < count && available.length) {
      picked.push(available.splice(randomInt(0, available.length - 1), 1)[0]);
    }
    return picked;
  }

  function nextRoundAmount(amount) {
    const denominations = [5000, 10000, 20000, 50000, 100000, 200000];
    return denominations.find((value) => value >= amount) || Math.ceil(amount / 100000) * 100000;
  }

  function transactionType() {
    const pool = state.level === "easy"
      ? ["total"]
      : state.level === "medium"
        ? ["total", "change", "quantity"]
        : ["total", "change", "discount", "quantity"];
    return pool[randomInt(0, pool.length - 1)];
  }

  function createTransaction() {
    const count = state.level === "easy" ? randomInt(1, 3) : randomInt(2, 4);
    const items = randomItems(count).map((product) => ({
      name: product.name,
      icon: product.icon,
      price: product[state.level],
      qty: state.level === "easy" ? 1 : randomInt(1, state.level === "medium" ? 3 : 5),
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    let type = transactionType();
    let answer = subtotal;
    let payment = 0;
    let discount = 0;
    let question = "Berapa total belanja pelanggan?";
    let note = "";
    let label = "Hitung total";
    let registerTotal = "?";
    let speech = "Tolong hitung total belanja saya.";

    if (type === "quantity") {
      answer = items.reduce((sum, item) => sum + item.qty, 0);
      question = "Berapa jumlah seluruh barang yang dibeli?";
      note = "Jawab jumlah barang, bukan jumlah jenis produk.";
      label = "Hitung barang";
      registerTotal = formatRupiah(subtotal);
      speech = "Ada berapa barang di belanjaan saya?";
    } else if (type === "change") {
      payment = nextRoundAmount(subtotal + 1);
      if (payment === subtotal) payment += state.level === "hard" ? 100000 : 50000;
      answer = payment - subtotal;
      question = "Berapa uang kembalian pelanggan?";
      note = `Pelanggan membayar ${formatRupiah(payment)}.`;
      label = "Hitung kembalian";
      registerTotal = formatRupiah(subtotal);
      speech = `Saya membayar ${formatRupiah(payment)}.`;
    } else if (type === "discount") {
      discount = [10, 20, 25][randomInt(0, 2)];
      const discountValue = (subtotal * discount) / 100;
      if (!Number.isInteger(discountValue)) {
        type = "total";
      } else {
        answer = subtotal - discountValue;
        question = "Berapa yang harus dibayar setelah diskon?";
        note = `Diskon ${discount}% dari total ${formatRupiah(subtotal)}.`;
        label = `Diskon ${discount}%`;
        registerTotal = formatRupiah(subtotal);
        speech = `Katanya hari ini diskon ${discount}%!`;
      }
    }

    const signature = `${type}:${items.map((item) => `${item.name}-${item.qty}`).join("|")}:${answer}`;
    if (state.recent.includes(signature)) return createTransaction();
    state.recent.push(signature);
    if (state.recent.length > 8) state.recent.shift();

    return { type, items, subtotal, payment, discount, answer, question, note, label, registerTotal, speech };
  }

  function formatRupiah(value) {
    return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
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

  function updateStatus() {
    document.getElementById("score").textContent = state.score;
    document.getElementById("coins").textContent = state.coins;
    document.getElementById("served").textContent = state.served;
    document.getElementById("streak").textContent = state.streak;
    document.getElementById("reputation-bar").style.width = `${Math.min(100, state.served * 10)}%`;
  }

  function resetCustomer() {
    customer.classList.remove("is-happy", "is-wrong");
    void customer.offsetWidth;
    document.getElementById("customer-mouth").className = "customer-mouth";
  }

  function showTransaction() {
    state.number += 1;
    state.transaction = createTransaction();
    state.locked = false;
    resetCustomer();
    document.getElementById("transaction-number").textContent = `Pelanggan ${state.number}`;
    document.getElementById("task-label").textContent = state.transaction.label;
    document.getElementById("question").textContent = state.transaction.question;
    document.getElementById("question-note").textContent = state.transaction.note;
    document.getElementById("register-total").textContent = state.transaction.registerTotal;
    document.getElementById("speech-bubble").textContent = state.transaction.speech;
    renderProducts(state.transaction.items);
    answerInput.value = "";
    document.getElementById("formatted-answer").textContent =
      state.transaction.type === "quantity" ? "0 barang" : "Rp0";
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.disabled = false;
  }

  function animateCoin(amount) {
    const coin = document.createElement("div");
    coin.className = "coin-pop";
    coin.textContent = `+${amount}`;
    document.body.append(coin);
    window.setTimeout(() => coin.remove(), 800);
  }

  function moveNext(message, className) {
    feedback.textContent = message;
    feedback.className = `feedback ${className}`;
    answerInput.disabled = true;
    window.setTimeout(showTransaction, 1200);
  }

  function checkAnswer() {
    if (state.locked || answerInput.value.trim() === "") return;
    state.locked = true;
    const submitted = Number(answerInput.value);

    if (submitted === state.transaction.answer) {
      state.served += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const bonus = state.streak > 0 && state.streak % 5 === 0 ? levelPoints[state.level] : 0;
      const earned = levelPoints[state.level] + bonus;
      state.score += earned;
      state.coins += state.level === "easy" ? 2 : state.level === "medium" ? 4 : 6;
      customer.classList.add("is-happy");
      animateCoin(state.level === "easy" ? 2 : state.level === "medium" ? 4 : 6);
      moveNext(
        bonus ? `Tepat! Bonus streak +${bonus} poin.` : "Tepat! Pelanggan puas.",
        "correct"
      );
    } else {
      state.wrong += 1;
      state.streak = 0;
      customer.classList.add("is-wrong");
      const unit = state.transaction.type === "quantity" ? " barang" : "";
      moveNext(`Belum tepat. Jawabannya ${state.transaction.answer.toLocaleString("id-ID")}${unit}.`, "wrong");
    }
    updateStatus();
  }

  function skipTransaction() {
    if (state.locked) return;
    state.locked = true;
    state.wrong += 1;
    state.streak = 0;
    customer.classList.add("is-wrong");
    updateStatus();
    const unit = state.transaction.type === "quantity" ? " barang" : "";
    moveNext(`Dilewati. Jawabannya ${state.transaction.answer.toLocaleString("id-ID")}${unit}.`, "wrong");
  }

  function resetState() {
    Object.assign(state, {
      transaction: null,
      score: 0,
      coins: 0,
      served: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      number: 0,
      locked: false,
      recent: [],
    });
    updateStatus();
  }

  function loadStats() {
    if (!storageKey) return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      return {};
    }
  }

  function saveResult() {
    const stats = loadStats();
    const answered = state.served + state.wrong;
    const history = Array.isArray(stats.history) ? stats.history : [];
    history.unshift({
      date: new Date().toISOString(),
      game: "tokoMatematika",
      level: state.level,
      score: state.score,
      correct: state.served,
      wrong: state.wrong,
      bestStreak: state.bestStreak,
      coins: state.coins,
    });
    const previousShop = stats.perGame && stats.perGame.tokoMatematika
      ? stats.perGame.tokoMatematika
      : {};
    const perGame = Object.assign({}, stats.perGame, {
      tokoMatematika: {
        bestScore: Math.max(previousShop.bestScore || 0, state.score),
        bestStreak: Math.max(previousShop.bestStreak || 0, state.bestStreak),
        totalServed: (previousShop.totalServed || 0) + state.served,
        totalCoins: (previousShop.totalCoins || 0) + state.coins,
        gamesPlayed: (previousShop.gamesPlayed || 0) + 1,
        lastLevel: state.level,
      },
    });
    const nextStats = Object.assign({}, stats, {
      bestScore: Math.max(stats.bestScore || 0, state.score),
      bestStreak: Math.max(stats.bestStreak || 0, state.bestStreak),
      totalAnswered: (stats.totalAnswered || 0) + answered,
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      history: history.slice(0, 8),
      perGame,
    });
    try {
      localStorage.setItem(storageKey, JSON.stringify(nextStats));
    } catch (error) {}
  }

  function endGame() {
    saveResult();
    gamePanel.classList.add("hidden");
    summaryPanel.classList.remove("hidden");
    document.getElementById("summary-score").textContent = state.score;
    document.getElementById("summary-coins").textContent = state.coins;
    document.getElementById("summary-served").textContent = state.served;
    document.getElementById("summary-streak").textContent = state.bestStreak;
    document.getElementById("summary-message").textContent =
      state.served >= 10
        ? "Luar biasa, reputasi tokomu sedang naik!"
        : state.served >= 5
          ? "Bagus! Kamu sudah menjadi kasir yang teliti."
          : "Coba lagi dan layani lebih banyak pelanggan.";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!gameReady) {
      setupStatus.textContent = "Permainan masih disiapkan. Tunggu sebentar.";
      return;
    }
    state.level = new FormData(setupForm).get("level");
    resetState();
    setupPanel.classList.add("hidden");
    summaryPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");
    showTransaction();
  });

  document.getElementById("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button || state.locked) return;
    const key = button.dataset.key;
    if (key === "backspace") answerInput.value = answerInput.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (answerInput.value.length < 9) answerInput.value += key;
    updateFormattedAnswer();
  });

  function updateFormattedAnswer() {
    const value = Number(answerInput.value || 0);
    document.getElementById("formatted-answer").textContent =
      state.transaction && state.transaction.type === "quantity"
        ? `${value.toLocaleString("id-ID")} barang`
        : formatRupiah(value);
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
  document.getElementById("skip-button").addEventListener("click", skipTransaction);
  document.getElementById("end-button").addEventListener("click", endGame);
  document.getElementById("replay-button").addEventListener("click", () => {
    summaryPanel.classList.add("hidden");
    setupPanel.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  async function initializeGame() {
    try {
      await firebasePortal.guard(["murid"]);
      const student = await firebasePortal.getCurrentMurid();
      if (!student) throw new Error("Akun belum terhubung ke data murid.");
      const studentKey = student.id || student.username || "murid";
      storageKey = `kakHarrisGameStats:${studentKey}`;

      const saved = loadStats();
      const lastLevel = saved.perGame && saved.perGame.tokoMatematika
        ? saved.perGame.tokoMatematika.lastLevel
        : null;
      if (lastLevel) {
        const levelInput = setupForm.querySelector(`[name="level"][value="${lastLevel}"]`);
        if (levelInput) levelInput.checked = true;
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
