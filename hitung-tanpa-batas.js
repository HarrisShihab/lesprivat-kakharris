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
    question: null,
    score: 0,
    correct: 0,
    wrong: 0,
    streak: 0,
    bestStreak: 0,
    number: 0,
    locked: false,
    recent: [],
  };

  const points = { easy: 10, medium: 20, hard: 30 };
  let storageKey = "";
  let gameReady = false;

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function binaryQuestion(symbol, min, max) {
    let a = randomInt(min, max);
    let b = randomInt(min, max);
    if (symbol === "-" && b > a) [a, b] = [b, a];
    return { text: `${a} ${symbol} ${b}`, answer: symbol === "+" ? a + b : a - b };
  }

  function multiplicationQuestion(maxFactor) {
    const a = randomInt(1, maxFactor);
    const b = randomInt(1, maxFactor);
    return { text: `${a} × ${b}`, answer: a * b };
  }

  function divisionQuestion(maxFactor) {
    const divisor = randomInt(1, maxFactor);
    const answer = randomInt(1, maxFactor);
    return { text: `${divisor * answer} ÷ ${divisor}`, answer };
  }

  function evaluateTokens(numbers, operators) {
    const values = numbers.slice();
    const ops = operators.slice();
    for (let i = 0; i < ops.length; ) {
      if (ops[i] === "×" || ops[i] === "÷") {
        const result = ops[i] === "×" ? values[i] * values[i + 1] : values[i] / values[i + 1];
        values.splice(i, 2, result);
        ops.splice(i, 1);
      } else {
        i += 1;
      }
    }
    let result = values[0];
    ops.forEach((operator, index) => {
      result = operator === "+" ? result + values[index + 1] : result - values[index + 1];
    });
    return result;
  }

  function mixedQuestion(level) {
    if (level === "easy") return binaryQuestion(Math.random() < 0.5 ? "+" : "-", 0, 20);

    const count = level === "medium" ? 3 : 4;
    const max = level === "medium" ? 12 : 25;
    const pool = level === "medium" ? ["+", "-", "×"] : ["+", "-", "×", "÷"];

    for (let attempt = 0; attempt < 200; attempt += 1) {
      const numbers = Array.from({ length: count }, () => randomInt(1, max));
      const operators = Array.from({ length: count - 1 }, () => pool[randomInt(0, pool.length - 1)]);
      const answer = evaluateTokens(numbers, operators);
      if (Number.isInteger(answer) && answer >= 0 && answer <= 2000) {
        const text = numbers.map((number, index) => (index < operators.length ? `${number} ${operators[index]}` : `${number}`)).join(" ");
        return { text, answer };
      }
    }
    return binaryQuestion("+", 10, level === "medium" ? 100 : 1000);
  }

  function createQuestion() {
    let question;
    if (state.operation === "addition" || state.operation === "subtraction") {
      const maximum = state.level === "easy" ? 20 : state.level === "medium" ? 100 : 1000;
      question = binaryQuestion(state.operation === "addition" ? "+" : "-", 0, maximum);
    } else if (state.operation === "multiplication") {
      question = multiplicationQuestion(state.level === "easy" ? 5 : state.level === "medium" ? 10 : 12);
    } else if (state.operation === "division") {
      question = divisionQuestion(state.level === "easy" ? 5 : state.level === "medium" ? 10 : 20);
    } else {
      question = mixedQuestion(state.level);
    }

    if (state.recent.includes(question.text)) return createQuestion();
    state.recent.push(question.text);
    if (state.recent.length > 10) state.recent.shift();
    return question;
  }

  function updateScoreboard() {
    document.getElementById("score").textContent = state.score;
    document.getElementById("correct-count").textContent = state.correct;
    document.getElementById("wrong-count").textContent = state.wrong;
    document.getElementById("streak").textContent = state.streak;
  }

  function showQuestion() {
    state.number += 1;
    state.question = createQuestion();
    state.locked = false;
    document.getElementById("question-number").textContent = `Soal ${state.number}`;
    document.getElementById("question").textContent = state.question.text;
    answerInput.value = "";
    feedback.textContent = "";
    feedback.className = "feedback";
    answerInput.disabled = false;
  }

  function moveNext(message, className) {
    feedback.textContent = message;
    feedback.className = `feedback ${className}`;
    answerInput.disabled = true;
    window.setTimeout(showQuestion, 850);
  }

  function checkAnswer() {
    if (state.locked || answerInput.value.trim() === "") return;
    state.locked = true;
    const submitted = Number(answerInput.value);

    if (submitted === state.question.answer) {
      state.correct += 1;
      state.streak += 1;
      state.bestStreak = Math.max(state.bestStreak, state.streak);
      const bonus = state.streak > 0 && state.streak % 5 === 0 ? points[state.level] : 0;
      state.score += points[state.level] + bonus;
      moveNext(bonus ? `Benar! Bonus streak +${bonus}.` : "Benar! Lanjutkan.", "correct");
    } else {
      state.wrong += 1;
      state.streak = 0;
      moveNext(`Belum tepat. Jawabannya ${state.question.answer}.`, "wrong");
    }
    updateScoreboard();
  }

  function skipQuestion() {
    if (state.locked) return;
    state.locked = true;
    state.wrong += 1;
    state.streak = 0;
    updateScoreboard();
    moveNext(`Soal dilewati. Jawabannya ${state.question.answer}.`, "wrong");
  }

  function resetState() {
    Object.assign(state, {
      question: null,
      score: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      number: 0,
      locked: false,
      recent: [],
    });
    updateScoreboard();
  }

  function startGame() {
    resetState();
    setupPanel.classList.add("hidden");
    summaryPanel.classList.add("hidden");
    gamePanel.classList.remove("hidden");
    showQuestion();
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
    const answered = state.correct + state.wrong;
    const history = Array.isArray(stats.history) ? stats.history : [];
    history.unshift({
      date: new Date().toISOString(),
      operation: state.operation,
      level: state.level,
      score: state.score,
      correct: state.correct,
      wrong: state.wrong,
      bestStreak: state.bestStreak,
    });

    const previousGame = stats.perGame && stats.perGame.hitungTanpaBatas
      ? stats.perGame.hitungTanpaBatas
      : {};
    const perGame = Object.assign({}, stats.perGame, {
      hitungTanpaBatas: {
        bestScore: Math.max(previousGame.bestScore || 0, state.score),
        bestStreak: Math.max(previousGame.bestStreak || 0, state.bestStreak),
        totalAnswered: (previousGame.totalAnswered || 0) + answered,
        gamesPlayed: (previousGame.gamesPlayed || 0) + 1,
        lastOperation: state.operation,
        lastLevel: state.level,
      },
    });

    const nextStats = Object.assign({}, stats, {
      bestScore: Math.max(stats.bestScore || 0, state.score),
      bestStreak: Math.max(stats.bestStreak || 0, state.bestStreak),
      totalAnswered: (stats.totalAnswered || 0) + answered,
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      lastOperation: state.operation,
      lastLevel: state.level,
      history: history.slice(0, 5),
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
    document.getElementById("summary-correct").textContent = state.correct;
    document.getElementById("summary-wrong").textContent = state.wrong;
    document.getElementById("summary-streak").textContent = state.bestStreak;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  setupForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!gameReady) {
      setupStatus.textContent = "Permainan masih disiapkan. Tunggu sebentar.";
      return;
    }
    state.operation = new FormData(setupForm).get("operation");
    state.level = new FormData(setupForm).get("level");
    startGame();
  });

  document.getElementById("keypad").addEventListener("click", (event) => {
    const button = event.target.closest("[data-key]");
    if (!button || state.locked) return;
    const key = button.dataset.key;
    if (key === "backspace") answerInput.value = answerInput.value.slice(0, -1);
    else if (key === "check") checkAnswer();
    else if (answerInput.value.length < 8) answerInput.value += key;
  });

  answerInput.addEventListener("input", () => {
    answerInput.value = answerInput.value.replace(/\D/g, "").slice(0, 8);
  });
  answerInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      checkAnswer();
    }
  });
  document.getElementById("skip-button").addEventListener("click", skipQuestion);
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
      storageKey = `kakHarrisGameStats:${student.id || student.username || "murid"}`;

      const saved = loadStats();
      if (saved.lastOperation) {
        const operation = setupForm.querySelector(`[name="operation"][value="${saved.lastOperation}"]`);
        if (operation) operation.checked = true;
      }
      if (saved.lastLevel) {
        const level = setupForm.querySelector(`[name="level"][value="${saved.lastLevel}"]`);
        if (level) level.checked = true;
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
