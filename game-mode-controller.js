/**
 * Shared Mode Controller untuk game.
 *
 * Menambahkan dukungan mode limited_time tanpa mengubah perilaku
 * createQuizGame() yang sudah dipakai lima game existing.
 *
 * Load setelah game-engine.js.
 */
(function (window) {
  "use strict";

  const engine = window.KakHarrisGameEngine;
  if (!engine) {
    throw new Error("KakHarrisGameEngine harus dimuat sebelum game-mode-controller.js");
  }

  const MODE_TYPES = Object.freeze({
    ENDLESS: "endless",
    LIMITED_QUESTIONS: "limited_questions",
    LIMITED_TIME: "limited_time",
    LIMITED_LIVES: "limited_lives",
  });

  function normalizeMode(config) {
    if (config && config.mode && typeof config.mode === "string") return config.mode;
    if (config && config.mode && typeof config.mode.type === "string") return config.mode.type;
    if (config && config.isEndless) return MODE_TYPES.ENDLESS;
    return MODE_TYPES.LIMITED_QUESTIONS;
  }

  function validateTimeLimit(seconds) {
    const value = Number(seconds);
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error("timeLimitSeconds harus berupa bilangan bulat positif.");
    }
    return value;
  }

  /**
   * Timer berbasis performance.now() agar durasi aktif tidak bergantung
   * pada jumlah tick setInterval. Tampilan diperbarui maksimum sekali/detik.
   */
  function createMonotonicTimer(durationSeconds, onTick, onEnd) {
    const durationMs = durationSeconds * 1000;
    let deadline = 0;
    let timerId = null;
    let running = false;
    let ended = false;

    function now() {
      return typeof performance !== "undefined" && typeof performance.now === "function"
        ? performance.now()
        : Date.now();
    }

    function remainingSeconds() {
      return Math.max(0, Math.ceil((deadline - now()) / 1000));
    }

    function stop() {
      if (timerId !== null) {
        clearInterval(timerId);
        timerId = null;
      }
      running = false;
    }

    function finish() {
      if (ended) return;
      ended = true;
      stop();
      if (typeof onTick === "function") onTick(0);
      if (typeof onEnd === "function") onEnd();
    }

    function tick() {
      if (!running || ended) return;
      const remaining = remainingSeconds();
      if (typeof onTick === "function") onTick(remaining);
      if (remaining <= 0) finish();
    }

    function start() {
      stop();
      ended = false;
      running = true;
      deadline = now() + durationMs;
      tick();
      timerId = setInterval(tick, 250);
    }

    function getTimeLeft() {
      return running && !ended ? remainingSeconds() : 0;
    }

    return { start, stop, getTimeLeft, isRunning: () => running };
  }

  /**
   * Membuat game dengan kontrak mode.
   *
   * limited_time memakai createQuizGame sebagai mekanik inti, lalu controller
   * ini menambahkan batas waktu dan finishReason="time_expired".
   * Mode existing tetap memakai engine tanpa perubahan perilaku.
   */
  function createQuizModeGame(config) {
    const source = Object.assign({}, config || {});
    const mode = normalizeMode(source);

    if (mode !== MODE_TYPES.LIMITED_TIME) {
      return engine.createQuizGame(source);
    }

    const timeLimitSeconds = validateTimeLimit(
      source.timeLimitSeconds != null ? source.timeLimitSeconds : source.mode && source.mode.timeLimitSeconds
    );

    let timedOut = false;
    let timer = null;
    const originalOnQuestion = source.onQuestion;
    const originalOnFinish = source.onFinish;
    const originalOnScoreboard = source.onScoreboard;

    const wrappedConfig = Object.assign({}, source, {
      // limited_time tetap membutuhkan soal berkelanjutan sampai timer habis.
      // Engine quiz melihatnya sebagai endless secara internal, tetapi hasil
      // final tetap ditandai sebagai limited_time oleh controller.
      isEndless: true,
      onQuestion(question) {
        if (typeof originalOnQuestion === "function") originalOnQuestion(question);
        if (typeof source.onModeTick === "function" && timer) {
          source.onModeTick(timer.getTimeLeft());
        }
      },
      onScoreboard(state) {
        if (typeof originalOnScoreboard === "function") originalOnScoreboard(state);
        if (typeof source.onModeTick === "function" && timer) {
          source.onModeTick(timer.getTimeLeft());
        }
      },
      onFinish(result) {
        if (timer) timer.stop();
        const enriched = Object.assign({}, result, {
          mode: MODE_TYPES.LIMITED_TIME,
          timeLimitSeconds,
          finishReason: timedOut ? "time_expired" : "manual_finish",
          timeRemainingSeconds: timedOut ? 0 : timer ? timer.getTimeLeft() : 0,
        });
        if (typeof originalOnFinish === "function") originalOnFinish(enriched);
      },
    });

    const game = engine.createQuizGame(wrappedConfig);
    const originalStart = game.start;
    const originalFinish = game.finish;

    game.start = function () {
      timedOut = false;
      originalStart();
      if (game.getState().finished) return;
      timer = createMonotonicTimer(
        timeLimitSeconds,
        (remaining) => {
          if (typeof source.onModeTick === "function") source.onModeTick(remaining);
        },
        () => {
          timedOut = true;
          originalFinish();
        }
      );
      timer.start();
    };

    game.finish = function () {
      if (timer) timer.stop();
      originalFinish();
    };

    game.getTimeLeft = function () {
      return timer ? timer.getTimeLeft() : 0;
    };

    game.getMode = function () {
      return {
        type: MODE_TYPES.LIMITED_TIME,
        timeLimitSeconds,
        finishReason: timedOut ? "time_expired" : null,
      };
    };

    return game;
  }

  /**
   * Self-test ringan yang bisa dijalankan di browser/devtools.
   * Tidak memulai game atau mengubah data murid.
   */
  function selfTestLimitedTime() {
    const errors = [];
    try {
      validateTimeLimit(1);
      [0, -1, 1.5, "abc", null].forEach((value) => {
        let rejected = false;
        try {
          validateTimeLimit(value);
        } catch (error) {
          rejected = true;
        }
        if (!rejected) errors.push(`timeLimitSeconds invalid tidak ditolak: ${value}`);
      });

      const originalFactory = engine.createQuizGame;
      if (typeof originalFactory !== "function") errors.push("createQuizGame tidak tersedia.");
    } catch (error) {
      errors.push(error.message || String(error));
    }

    return {
      ok: errors.length === 0,
      errors,
    };
  }

  window.KakHarrisGameModes = {
    version: "1.0.0",
    MODE_TYPES,
    createMonotonicTimer,
    createQuizModeGame,
    selfTestLimitedTime,
  };
})(window);
