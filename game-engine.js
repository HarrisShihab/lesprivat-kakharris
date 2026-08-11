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
  };
})(window);
