/**
 * Shared Game Engine untuk Website Les Privat Kak Harris.
 * Menyediakan fondasi bersama untuk manajemen autentikasi murid,
 * pengolahan statistik lokal (localStorage), sistem poin & streak,
 * timer permainan, serta pembacaan/penyimpanan hasil game.
 */
(function (window) {
  "use strict";

  const ENGINE_VERSION = "1.0.0";

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffleArray(array) {
    const copy = array.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function formatRupiah(amount) {
    return "Rp " + Number(amount || 0).toLocaleString("id-ID");
  }

  /**
   * Mengautentikasi murid dan mengembalikan data profil murid serta storageKey lokal.
   */
  async function initStudentAuth(allowedRoles) {
    const roles = allowedRoles || ["murid"];
    await firebasePortal.guard(roles);
    const student = await firebasePortal.getCurrentMurid();
    if (!student) {
      window.location.replace("login.html");
      return null;
    }
    const studentId = student.id || student.username || "murid";
    const storageKey = `kakHarrisGameStats:${studentId}`;
    return { student, studentId, storageKey };
  }

  /**
   * Membaca data statistik dari localStorage.
   */
  function loadStats(storageKey) {
    if (!storageKey) return {};
    try {
      return JSON.parse(localStorage.getItem(storageKey) || "{}");
    } catch (error) {
      console.warn("Gagal membaca stats dari localStorage:", error);
      return {};
    }
  }

  /**
   * Menyimpan statistik game ke localStorage dengan struktur data yang seragam dan kompatibel.
   */
  function saveGameResult(storageKey, perGameKey, result) {
    if (!storageKey || !perGameKey) return {};
    const stats = loadStats(storageKey);

    const perGame = Object.assign({}, stats.perGame || {});
    const existingGameStats = perGame[perGameKey] || {};

    const newScore = Math.max(0, Number(result.score) || 0);
    const newStreak = Math.max(0, Number(result.bestStreak) || 0);
    const answeredCount = Math.max(0, Number(result.answered) || 0);

    const updatedGameStats = {
      bestScore: Math.max(existingGameStats.bestScore || 0, newScore),
      bestStreak: Math.max(existingGameStats.bestStreak || 0, newStreak),
      gamesPlayed: (existingGameStats.gamesPlayed || 0) + 1,
      totalAnswered: (existingGameStats.totalAnswered || 0) + answeredCount,
      lastPlayed: new Date().toISOString(),
    };

    // Simpan preferensi pengaturan permainan agar dapat dipulihkan pada
    // sesi berikutnya (opsional; tidak mengubah format statistik inti).
    if (result.lastOperation) updatedGameStats.lastOperation = result.lastOperation;
    if (result.lastLevel) updatedGameStats.lastLevel = result.lastLevel;
    if (result.lastMode) updatedGameStats.lastMode = result.lastMode;

    perGame[perGameKey] = updatedGameStats;

    const globalStats = {
      bestScore: Math.max(stats.bestScore || 0, newScore),
      bestStreak: Math.max(stats.bestStreak || 0, newStreak),
      totalAnswered: (stats.totalAnswered || 0) + answeredCount,
      gamesPlayed: (stats.gamesPlayed || 0) + 1,
      perGame: perGame,
    };

    try {
      localStorage.setItem(storageKey, JSON.stringify(globalStats));
    } catch (error) {
      console.warn("Gagal menyimpan statistik game lokal:", error);
    }

    return globalStats;
  }

  /**
   * Menghitung poin tambahan berdasarkan tingkat kesulitan dan bonus streak.
   */
  function calculatePoints(level, basePointsMap, streak) {
    const base = (basePointsMap && basePointsMap[level]) || 10;
    const currentStreak = Math.max(0, Number(streak) || 0);
    const streakBonus = Math.min(Math.floor(currentStreak / 3) * 5, 25);
    return base + streakBonus;
  }

  /**
   * Pengelola Timer sederhana untuk game berbasis waktu.
   */
  function createTimer(durationSeconds, onTick, onEnd) {
    let timeLeft = durationSeconds;
    let timerId = null;

    function start() {
      stop();
      if (typeof onTick === "function") onTick(timeLeft);
      timerId = setInterval(() => {
        timeLeft -= 1;
        if (typeof onTick === "function") onTick(timeLeft);
        if (timeLeft <= 0) {
          stop();
          if (typeof onEnd === "function") onEnd();
        }
      }, 1000);
    }

    function stop() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
    }

    function getTimeLeft() {
      return timeLeft;
    }

    return { start, stop, getTimeLeft };
  }

  /* ------------------------------------------------------------------ *
   *  MODUL ENGINE QUIZ
   *  Menjalankan satu putaran soal dengan umpan balik langsung, cocok
   *  untuk jawaban angka maupun pilihan. Mengikuti kontrak arsitektur
   *  di docs/Games/03-Engine-Quiz.md dan 14-Mode-Permainan.md.
   *
   *  Alur: loading_question -> awaiting_answer -> showing_feedback ->
   *  round_complete | finished. State skor/streak/mode dikelola
   *  pengguna melalui hooks; engine ini fokus pada mekanik putaran.
   * ------------------------------------------------------------------ */

  /**
   * Membuat sesi kuis interaktif. `config` berisi konfigurasi game,
   * `config.bank` (bank soal) menyediakan item, dan `config.on*`
   * menghubungkan engine ke antarmuka serta penyimpanan hasil.
   *
   * Config:
   *   questionLimit       - jumlah soal untuk mode terbatas
   *   basePoints          - {easy, medium, hard} poin dasar per level
   *   feedbackDurationMs  - durasi umpan balik sebelum soal berikutnya
   *   onQuestion          - function(q) : tampilkan soal
   *   onFeedback          - function(msg, ok) : tampilkan umpan balik
   *   onScoreboard        - function(state) : perbarui papan skor
   *   onFinish            - function(result) : saat sesi selesai
   *   isEndless           - apakah mode endless
   *
   * Opsi lanjutan (opsional, backward compatible):
   *   lives               - jumlah nyawa; salah/skip menguranginya dan
   *                         habis membuat sesi berakhir (null = tanpa nyawa)
   *   pointsFor           - function({level, streak}) -> poin (override)
   *   hintCost            - pengurang skor saat hint digunakan (default 5)
   *   getHint             - function(question) -> string petunjuk
   *   onAnswer            - function(outcome) -> state tambahan game
   *                         ({correct, points, streak, level, answered})
   *   onHint              - function(hint) -> tampilkan petunjuk
   *   onLivesChange       - function(lives) -> perbarui tampilan nyawa
   */
  function createQuizGame(config) {
    const bank = config.bank || [];
    const basePoints = config.basePoints || { easy: 10, medium: 20, hard: 30 };
    const questionLimit = Number(config.questionLimit) || 10;
    const feedbackDurationMs = config.feedbackDurationMs || 850;
    const isEndless = Boolean(config.isEndless);
    const initialLives = config.lives !== null && config.lives !== undefined && Number.isFinite(Number(config.lives)) && Number(config.lives) > 0 ? Number(config.lives) : null;
    const hintCost = Number(config.hintCost) || 5;

    // --- Difficulty Controller (adaptif, default mati) ---
    const adaptive = Boolean(config.adaptiveDifficulty);
    const allowedDifficulties = Array.isArray(config.allowedDifficulties) && config.allowedDifficulties.length ? config.allowedDifficulties : Object.keys(basePoints);
    const difficultyWindow = Math.max(2, Number(config.difficultyWindow) || 5);
    const difficultyUpThreshold = typeof config.difficultyUpThreshold === "number" ? config.difficultyUpThreshold : 0.8;
    const difficultyDownThreshold = typeof config.difficultyDownThreshold === "number" ? config.difficultyDownThreshold : 0.5;

    const state = {
      score: 0,
      correct: 0,
      wrong: 0,
      streak: 0,
      bestStreak: 0,
      number: 0,
      lives: initialLives,
      hintUsed: false,
      question: null,
      locked: false,
      recent: [],
      finished: false,
      // State Difficulty Controller
      difficulty: config.level || allowedDifficulties[0] || "medium",
      accuracyWindow: [],
    };

    /**
     * Meminta sebuah soal dari bank. Jika bankModel adalah fungsi
     * generator, hasilnya dikonversi ke bentuk item terstruktur.
     */
    function nextItem(safeDepth) {
      const depth = safeDepth || 0;
      const raw =
        typeof bank === "function"
          ? bank({
              level: state.difficulty,
              operation: config.operation,
              grade: config.grade,
              floor: state.number,
              round: state.number,
            })
          : bank[randomInt(0, bank.length - 1)];

      // Item sudah dalam bentuk {text, answer} milik engine lama, atau
      // bentuk terstruktur {questionId, prompt, answerSpecRef, metadata}.
      if (raw && raw.questionId) {
        return { ...raw, difficulty: state.difficulty };
      }
      // Hindari mengulang soal yang baru saja tampil, dengan batas usaha
      // agar bank yang tanpa variasi tidak menyebabkan rekursi tak hingga.
      if (state.recent.includes(raw.text)) {
        if (depth > 200) {
          // Lepas dari pengulangan: kembalikan apa adanya.
          return { ...raw, difficulty: state.difficulty };
        }
        return nextItem(depth + 1);
      }
      state.recent.push(raw.text);
      if (state.recent.length > 10) state.recent.shift();
      return {
        ...raw,
        difficulty: state.difficulty,
      };
    }

    function updateScoreboard() {
      if (typeof config.onScoreboard === "function") {
        config.onScoreboard({
          score: state.score,
          correct: state.correct,
          wrong: state.wrong,
          streak: state.streak,
        });
      }
    }

    function notifyLives() {
      if (typeof config.onLivesChange === "function") {
        config.onLivesChange(state.lives);
      }
    }

    function finish() {
      if (state.finished) return;
      state.finished = true;
      const result = {
        score: state.score,
        correct: state.correct,
        wrong: state.wrong,
        bestStreak: state.bestStreak,
        number: state.number,
        lives: state.lives,
      };
      if (typeof config.onFinish === "function") config.onFinish(result);
    }

    function showQuestion() {
      if (state.finished) return;
      if (!isEndless && state.number >= questionLimit) {
        finish();
        return;
      }
      if (initialLives !== null && state.lives <= 0) {
        finish();
        return;
      }
      state.number += 1;
      state.question = nextItem();
      state.locked = false;
      state.hintUsed = false;

      if (typeof config.onQuestion === "function") {
        config.onQuestion({
          number: state.number,
          total: isEndless ? null : questionLimit,
          text: state.question.text,
          difficulty: state.question.difficulty,
          raw: state.question,
        });
      }
    }

    function emitFeedback(message, ok) {
      if (typeof config.onFeedback === "function") {
        config.onFeedback(message, ok);
      }
    }

    function advance() {
      setTimeout(showQuestion, feedbackDurationMs);
    }

    function awardPoints(level) {
      if (typeof config.pointsFor === "function") {
        return config.pointsFor({ level, streak: state.streak, number: state.number });
      }
      const bonus = state.streak > 0 && state.streak % 5 === 0 ? basePoints[level] : 0;
      return (basePoints[level] || 10) + bonus;
    }

    function registerWrong() {
      state.wrong += 1;
      state.streak = 0;
      if (initialLives !== null) {
        state.lives = Math.max(0, state.lives - 1);
        notifyLives();
      }
    }

    /**
     * Difficulty Controller (adaptif). Mencatat hasil jawaban (benar/salah)
     * pada jendela akurasi dan, setiap `difficultyWindow` jawaban,
     * menyesuaikan tingkat kesulitan sesuai kinerja murid.
     */
    function recordAnswer(correct) {
      if (!adaptive) return;
      state.accuracyWindow.push(Boolean(correct));
      if (state.accuracyWindow.length >= difficultyWindow) {
        maybeAdjustDifficulty();
        state.accuracyWindow = [];
      }
    }

    function maybeAdjustDifficulty() {
      if (state.accuracyWindow.length === 0) return;
      const accuracy = state.accuracyWindow.filter(Boolean).length / state.accuracyWindow.length;
      const currentIndex = allowedDifficulties.indexOf(state.difficulty);
      let next = state.difficulty;

      if (accuracy >= difficultyUpThreshold && currentIndex < allowedDifficulties.length - 1) {
        next = allowedDifficulties[currentIndex + 1];
      } else if (accuracy < difficultyDownThreshold && currentIndex > 0) {
        next = allowedDifficulties[currentIndex - 1];
      }

      if (next !== state.difficulty) {
        state.difficulty = next;
        if (typeof config.onDifficultyChange === "function") {
          config.onDifficultyChange(next, accuracy);
        }
      }
    }

    /**
     * Menentukan apakah sebuah nilai dianggap jawaban angka (numerik).
     * Nilai angka murni dievaluasi secara numerik; nilai lain (pecahan,
     * tanda, teks) dievaluasi sebagai string.
     */
    function isNumericAnswer(value) {
      if (typeof value === "number") return true;
      if (typeof value !== "string") return false;
      const trimmed = value.trim();
      if (trimmed === "") return false;
      return Number.isFinite(Number(trimmed));
    }

    /**
     * Mengirim jawaban murid. Mengembalikan hasil penilaian sehingga
     * antarmuka tetap fleksibel (ada yang menyimpan angka, ada yang
     * memakai pilihan/navigasi).
     */
    function submitAnswer(rawValue) {
      if (state.finished || state.locked) return null;
      state.locked = true;

      let submitted = rawValue;
      let submittedText = String(rawValue == null ? "" : rawValue).trim();

      const answerIsNumeric = isNumericAnswer(state.question.answer);
      if (answerIsNumeric) {
        if (typeof rawValue === "string" && rawValue.trim() !== "") {
          submitted = Number(rawValue.replace(/[^\d.,-]/g, "").replace(",", "."));
        }
        if (submitted === null || submitted === undefined || Number.isNaN(Number(submitted))) {
          state.locked = false;
          return null;
        }
      } else if (submittedText === "") {
        state.locked = false;
        return null;
      }

      const level = state.question.difficulty || "medium";
      const correct = answerIsNumeric ? Number(submitted) === Number(state.question.answer) : submittedText.toLowerCase() === String(state.question.answer).trim().toLowerCase();
      const outcome = { correct, answer: state.question.answer, level, submitted: submittedText };

      if (correct) {
        state.correct += 1;
        state.streak += 1;
        state.bestStreak = Math.max(state.bestStreak, state.streak);
        const points = awardPoints(level);
        state.score += points;
        outcome.points = points;
        emitFeedback(points > basePoints[level] ? `Benar! Bonus streak +${points - basePoints[level]}.` : "Benar! Lanjutkan.", true);
      } else {
        registerWrong();
        emitFeedback(`Belum tepat. Jawabannya ${state.question.answer}.`, false);
      }

      recordAnswer(correct);

      outcome.answered = state.correct + state.wrong;
      outcome.streak = state.streak;
      if (typeof config.onAnswer === "function") config.onAnswer(outcome);

      updateScoreboard();
      advance();
      return outcome;
    }

    /**
     * Melewati soal tanpa menjawab (opsional, sesuai konfigurasi).
     */
    function skipQuestion() {
      if (state.finished || state.locked) return;
      state.locked = true;
      registerWrong();
      emitFeedback(`Soal dilewati. Jawabannya ${state.question.answer}.`, false);
      recordAnswer(false);
      updateScoreboard();
      advance();
    }

    /**
     * Menggunakan petunjuk jika tersedia. Mengurangi skor sebesar hintCost
     * dan menandai hint telah dipakai untuk soal aktif.
     */
    function useHint() {
      if (state.finished || state.locked || state.hintUsed || typeof config.getHint !== "function") {
        return false;
      }
      state.hintUsed = true;
      state.score = Math.max(0, state.score - hintCost);
      if (typeof config.onHint === "function") {
        config.onHint(state.question);
      }
      updateScoreboard();
      return true;
    }

    function start() {
      state.score = 0;
      state.correct = 0;
      state.wrong = 0;
      state.streak = 0;
      state.bestStreak = 0;
      state.number = 0;
      state.lives = initialLives;
      state.hintUsed = false;
      state.locked = false;
      state.recent = [];
      state.finished = false;
      state.difficulty = config.level || allowedDifficulties[0] || "medium";
      state.accuracyWindow = [];
      updateScoreboard();
      notifyLives();
      showQuestion();
    }

    function getState() {
      return state;
    }

    return {
      start,
      submitAnswer,
      skipQuestion,
      useHint,
      getState,
      finish,
    };
  }

  window.KakHarrisGameEngine = {
    version: ENGINE_VERSION,
    randomInt,
    shuffleArray,
    formatRupiah,
    initStudentAuth,
    loadStats,
    saveGameResult,
    calculatePoints,
    createTimer,
    createQuizGame,
  };
})(window);
