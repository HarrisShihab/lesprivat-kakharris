(function (root) {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const state = {
    initialized: false,
    providerBundle: null,
    manager: null,
    sessionId: null,
  };

  function setStatus(message, type) {
    const el = $("math-lab-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = `math-lab-status${type ? ` ${type}` : ""}`;
  }

  function show(panel, visible) {
    $(panel)?.classList.toggle("math-lab-hidden", !visible);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function topicTitle(value) {
    const labels = { aljabar: "Aljabar", "suku-sejenis": "Suku Sejenis" };
    return labels[value] || String(value || "Aljabar").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function renderPrompt(container, prompt) {
    container.textContent = "";
    const renderer = root.KakHarrisMathLab?.mathRenderer?.MathRenderer?.createRenderer
      ? root.KakHarrisMathLab.mathRenderer.MathRenderer.createRenderer()
      : null;
    const parts = String(prompt || "").split(/(\$[^$]+\$)/g);
    parts.forEach((part) => {
      if (/^\$[^$]+\$$/.test(part) && renderer) {
        const span = document.createElement("span");
        container.appendChild(span);
        renderer.renderToElement(span, part.slice(1, -1), { displayMode: false, fallbackText: part.slice(1, -1) });
      } else {
        container.appendChild(document.createTextNode(part));
      }
    });
  }

  async function renderCurrent() {
    const item = state.manager.currentQuestion(state.sessionId);
    $("math-lab-question-number").textContent = `Soal ${item.index + 1} dari ${item.total}`;
    $("math-lab-progress-text").textContent = `${item.index + 1}/${item.total}`;
    $("math-lab-progress-bar").style.width = `${((item.index + 1) / item.total) * 100}%`;
    $("math-lab-subtopic-label").textContent = topicTitle(item.question.subtopicId);
    renderPrompt($("math-lab-prompt"), item.question.content?.prompt || "");

    const math = $("math-lab-math");
    math.textContent = "";
    try {
      await state.manager.renderCurrent(state.sessionId, math, { displayMode: true });
    } catch (error) {
      math.textContent = "Ekspresi matematika tidak dapat dirender.";
      console.error(error);
    }

    renderAnswer(item);
    renderNavigation(item);
  }

  function renderAnswer(item) {
    const container = $("math-lab-answer");
    const feedback = $("math-lab-feedback");
    container.innerHTML = "";
    feedback.textContent = "";
    feedback.className = "math-lab-feedback math-lab-hidden";

    const question = item.question;
    const response = item.response;
    if (question.questionType === "single_choice" || question.questionType === "expression_choice") {
      (question.content?.options || []).forEach((option) => {
        const label = document.createElement("label");
        label.className = "math-lab-option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "math-lab-answer";
        input.value = option.id;
        input.disabled = item.answered;
        input.checked = Boolean(response && response.answer === option.id);
        const text = document.createElement("span");
        renderPrompt(text, option.label);
        label.append(input, text);
        container.appendChild(label);
      });
    } else if (question.questionType === "numeric_input" || question.questionType === "expression_input") {
      const input = document.createElement("input");
      input.id = "math-lab-answer-input";
      input.className = "math-lab-input";
      input.autocomplete = "off";
      input.inputMode = question.questionType === "numeric_input" ? "decimal" : "text";
      input.placeholder = question.questionType === "numeric_input" ? "Masukkan jawaban angka" : "Masukkan ekspresi matematika";
      input.disabled = item.answered;
      input.value = response?.answer ?? "";
      container.appendChild(input);
    }

    if (item.answered && response) {
      feedback.textContent = response.isCorrect ? "Jawaban benar." : "Jawaban belum tepat.";
      feedback.className = `math-lab-feedback ${response.isCorrect ? "success" : "error"}`;
    }
  }

  function getAnswer() {
    const question = state.manager.currentQuestion(state.sessionId).question;
    if (question.questionType === "single_choice" || question.questionType === "expression_choice") {
      return document.querySelector('input[name="math-lab-answer"]:checked')?.value || null;
    }
    return $("math-lab-answer-input")?.value ?? null;
  }

  function renderNavigation(item) {
    const session = state.manager.getSession(state.sessionId);
    const allAnswered = session.progress.unansweredCount === 0;
    $("math-lab-submit").disabled = item.answered;
    $("math-lab-next").disabled = item.index >= item.total - 1 || !item.answered;
    $("math-lab-finish").classList.toggle("math-lab-hidden", !allAnswered);
  }

  async function submitAnswer() {
    const item = state.manager.currentQuestion(state.sessionId);
    if (item.answered) return;
    const answer = getAnswer();
    if (answer === null || String(answer).trim() === "") {
      const feedback = $("math-lab-feedback");
      feedback.textContent = "Pilih atau masukkan jawaban terlebih dahulu.";
      feedback.className = "math-lab-feedback error";
      return;
    }

    try {
      const result = state.manager.submitAnswer(state.sessionId, answer);
      if (!result.accepted) {
        throw new Error("Format jawaban tidak valid. Periksa kembali jawabanmu.");
      }
      await renderCurrent();
    } catch (error) {
      setStatus(error.message || "Jawaban gagal diproses.", "error");
    }
  }

  async function nextQuestion() {
    try {
      const item = state.manager.currentQuestion(state.sessionId);
      if (!item.answered) {
        setStatus("Jawab soal ini terlebih dahulu.", "error");
        return;
      }
      state.manager.next(state.sessionId);
      await renderCurrent();
      setStatus("Latihan gratis — hasil tidak disimpan.", "info");
    } catch (error) {
      setStatus(error.message || "Tidak dapat membuka soal berikutnya.", "error");
    }
  }

  function finish() {
    try {
      const result = state.manager.finalize(state.sessionId);
      $("math-lab-result-score").textContent = String(result.score);
      $("math-lab-result-summary").textContent = `${result.correctCount} benar dari ${result.totalQuestions} soal.`;
      show("math-lab-practice", false);
      show("math-lab-result", true);
      setStatus("Selesai. Hasil ini hanya sementara dan tidak disimpan.", "info");
    } catch (error) {
      setStatus(error.message || "Latihan belum dapat diselesaikan.", "error");
    }
  }

  function reset() {
    state.manager = null;
    state.sessionId = null;
    show("math-lab-result", false);
    show("math-lab-practice", false);
    show("math-lab-setup", true);
    const button = $("math-lab-start");
    button.disabled = false;
    button.textContent = "Mulai 5 Soal Gratis";
    setStatus("Latihan gratis siap dimulai.", "info");
  }

  function createManager() {
    const pilot = state.providerBundle;
    const NS = root.KakHarrisMathLab || {};
    if (!pilot || !NS.practiceSession || !NS.answerEvaluator) throw new Error("Engine Math Lab belum siap.");
    const renderer = NS.mathRenderer?.MathRenderer?.createRenderer ? NS.mathRenderer.MathRenderer.createRenderer() : null;
    return NS.practiceSession.createManager({
      provider: pilot.provider,
      evaluations: pilot.evaluations,
      evaluator: NS.answerEvaluator,
      renderer,
      questionPolicy: NS.content?.algebraPractice,
    });
  }

  async function start() {
    const button = $("math-lab-start");
    button.disabled = true;
    setStatus("Menyiapkan 5 soal...", "info");
    try {
      state.manager = createManager();
      const snapshot = state.manager.createSession({
        ownerUid: null,
        educationLevel: "SMP",
        grade: 7,
        phase: "D",
        subject: "matematika",
        topicId: "aljabar",
        subtopicId: null,
        questionCount: 5,
        mix: { generated: 2, curated: 2, storyTemplate: 1 },
      });
      state.sessionId = snapshot.session.sessionId;
      show("math-lab-setup", false);
      show("math-lab-result", false);
      show("math-lab-practice", true);
      await renderCurrent();
      setStatus("Latihan gratis — 5 soal. Tidak ada data yang disimpan.", "info");
    } catch (error) {
      state.manager = null;
      state.sessionId = null;
      setStatus(error.message || "Math Lab gagal memulai latihan.", "error");
      button.disabled = false;
    }
  }

  async function init() {
    if (state.initialized) return;
    state.initialized = true;
    try {
      const questionSystem = await root.KakHarrisMathLab?.questionSystemReady;
      if (!questionSystem?.createPilotProvider) throw new Error("Question System belum tersedia.");
      state.providerBundle = questionSystem.createPilotProvider();
      if (!state.providerBundle?.provider) throw new Error("Question Provider belum tersedia.");
      $("math-lab-start").disabled = false;
      $("math-lab-start").textContent = "Mulai 5 Soal Gratis";
      setStatus("Latihan gratis siap dimulai.", "info");
    } catch (error) {
      console.error("Public Math Lab init:", error);
      setStatus(error.message || "Math Lab gagal dimuat.", "error");
    }
  }

  function bind() {
    $("math-lab-start")?.addEventListener("click", start);
    $("math-lab-submit")?.addEventListener("click", submitAnswer);
    $("math-lab-next")?.addEventListener("click", nextQuestion);
    $("math-lab-finish")?.addEventListener("click", finish);
    $("math-lab-new")?.addEventListener("click", reset);
  }

  bind();
  init();
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.publicPractice = Object.freeze({ init, reset });
})(typeof globalThis !== "undefined" ? globalThis : this);
