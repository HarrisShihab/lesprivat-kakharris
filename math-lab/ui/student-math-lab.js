(function (root) {
  "use strict";

  const NS = root.KakHarrisMathLab || {};
  const $ = (id) => document.getElementById(id);
  const clone = (value) => value == null ? value : JSON.parse(JSON.stringify(value));

  const state = {
    profile: null,
    student: null,
    providerBundle: null,
    manager: null,
    persistence: null,
    sessionId: null,
    responses: [],
    selected: {},
    initialized: false,
    questionSystem: null,

  };

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function setStatus(message, type) {
    const el = $("math-lab-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = `math-lab-status${type ? ` ${type}` : ""}${message ? "" : " math-lab-hidden"}`;
  }

  function setPanel(panel, visible) {
    $(panel)?.classList.toggle("math-lab-hidden", !visible);
  }

  function formatDate(value) {
    if (!value) return "-";
    let date;
    if (typeof value.toDate === "function") date = value.toDate();
    else if (typeof value.toMillis === "function") date = new Date(value.toMillis());
    else date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(date);
  }

  function getTaxonomy() {
    if (state.questionSystem && typeof state.questionSystem.createPilotProvider === "function") {
      const bundle = state.providerBundle || state.questionSystem.createPilotProvider();
      return Array.isArray(bundle?.taxonomy) ? bundle.taxonomy : [];
    }
    return state.providerBundle?.taxonomy || [];
  }

  function populateSelectors() {
    const taxonomy = getTaxonomy();
    const levels = [...new Map(taxonomy.map((item) => [item.educationLevel, item])).values()];
    const grades = [...new Map(taxonomy.map((item) => [`${item.educationLevel}|${item.grade}|${item.phase}`, item])).values()];
    const topics = [...new Map(taxonomy.map((item) => [item.topicId, item])).values()];
    const subtopics = taxonomy;

    const level = $("math-lab-level");
    const grade = $("math-lab-grade");
    const topic = $("math-lab-topic");
    const subtopic = $("math-lab-subtopic");

    if (level) level.innerHTML = levels.map((item) => `<option value="${escapeHtml(item.educationLevel)}">${escapeHtml(item.educationLevel)}</option>`).join("");
    if (grade) grade.innerHTML = grades.map((item) => `<option value="${escapeHtml(`${item.grade}|${item.phase}`)}">Kelas ${escapeHtml(item.grade)}</option>`).join("");
    if (topic) topic.innerHTML = topics.map((item) => `<option value="${escapeHtml(item.topicId)}">${escapeHtml(topicTitle(item.topicId))}</option>`).join("");
    if (subtopic) subtopic.innerHTML = `<option value="">Semua submateri</option>${subtopics.map((item) => `<option value="${escapeHtml(item.subtopicId)}">${escapeHtml(item.title)}</option>`).join("")}`;

    const studentLevel = String(state.student?.jenjang || "").trim();
    const studentGrade = String(state.student?.kelas || "").trim();
    if (levels.some((item) => String(item.educationLevel) === studentLevel)) level.value = studentLevel;
    const matchingGrade = grades.find((item) => String(item.educationLevel) === level?.value && String(item.grade) === studentGrade);
    if (matchingGrade) grade.value = `${matchingGrade.grade}|${matchingGrade.phase}`;
    topic.value = topics.some((item) => item.topicId === "aljabar") ? "aljabar" : topics[0]?.topicId || "";
    if (subtopic) subtopic.value = "";
  }

  function topicTitle(topicId) {
    const labels = { aljabar: "Aljabar" };
    return labels[topicId] || String(topicId).replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  function selectedConfig() {
    const [grade, phase] = String($("math-lab-grade")?.value || "").split("|");
    return {
      educationLevel: $("math-lab-level")?.value || "SMP",
      grade: Number.isFinite(Number(grade)) ? Number(grade) : grade,
      phase: phase || "D",
      subject: "matematika",
      topicId: $("math-lab-topic")?.value || "aljabar",
      subtopicId: $("math-lab-subtopic")?.value || null,
      questionCount: 10,
      mix: { generated: 5, curated: 3, storyTemplate: 2 },
    };
  }

  function createManager() {
    const pilot = state.providerBundle;
    if (!pilot) throw new Error("Question System belum siap.");
    const renderer = NS.mathRenderer?.MathRenderer?.createRenderer ? NS.mathRenderer.MathRenderer.createRenderer() : null;
    return NS.practiceSession.createManager({
      provider: pilot.provider,
      evaluations: pilot.evaluations,
      evaluator: NS.answerEvaluator,
      renderer,
      questionPolicy: NS.content.algebraPractice,
    });
  }

  async function persistSession() {
    if (!state.persistence || !state.sessionId || !state.manager) return;
    const snapshot = state.manager.getSession(state.sessionId);
    await state.persistence.saveSession(snapshot, state.responses);
  }

  async function startPractice() {
    setStatus("Menyiapkan 10 soal...", "info");
    $("math-lab-start")?.setAttribute("disabled", "disabled");
    try {
      const config = selectedConfig();
      state.manager = createManager();
      const snapshot = state.manager.createSession({
        ownerUid: root.firebase?.auth()?.currentUser?.uid || null,
        ...config,
      });
      state.sessionId = snapshot.session.sessionId;
      state.responses = [];
      state.selected = {};
      // New sessions use the create path so Firestore can authorize from
      // request.resource.data without a resource-based pre-read.
      await state.persistence.saveSession(snapshot, state.responses, "create");
      setPanel("math-lab-setup", false);
      setPanel("math-lab-practice", true);
      setPanel("math-lab-result", false);
      setStatus("");
      await renderCurrent();
    } catch (error) {
      console.error("Math Lab start:", error);
      setStatus(error.message || "Sesi tidak dapat dibuat.", "error");
    } finally {
      $("math-lab-start")?.removeAttribute("disabled");
    }
  }

  function buildPrompt(container, prompt) {
    container.textContent = "";
    const source = String(prompt || "");
    const parts = source.split(/(\$[^$]+\$)/g);
    const renderer = NS.mathRenderer?.MathRenderer?.createRenderer ? NS.mathRenderer.MathRenderer.createRenderer() : null;
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
    state.selected = {};
    $("math-lab-question-number").textContent = `Soal ${item.index + 1} dari ${item.total}`;
    $("math-lab-progress-text").textContent = `${item.index + 1}/${item.total}`;
    $("math-lab-progress-bar").style.width = `${((item.index + 1) / item.total) * 100}%`;
    $("math-lab-subtopic-label").textContent = item.question.subtopicId ? topicTitle(item.question.subtopicId) : "Aljabar";
    buildPrompt($("math-lab-prompt"), item.question.content?.prompt || "");

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
    feedback.className = "math-lab-feedback math-lab-hidden";
    feedback.textContent = "";
    const question = item.question;
    const response = item.response;

    if (question.questionType === "single_choice" || question.questionType === "expression_choice") {
      const options = question.content?.options || [];
      options.forEach((option) => {
        const label = document.createElement("label");
        label.className = "math-lab-option";
        const input = document.createElement("input");
        input.type = "radio";
        input.name = "math-lab-answer";
        input.value = option.id;
        input.disabled = item.answered;
        if (response && response.answer === option.id) input.checked = true;
        const text = document.createElement("span");
        buildPrompt(text, option.label);
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
      const submission = state.manager.submitAnswer(state.sessionId, answer);
      if (!submission.accepted) {
        const feedback = $("math-lab-feedback");
        feedback.textContent = "Format jawaban tidak valid. Periksa kembali jawabanmu.";
        feedback.className = "math-lab-feedback error";
        return;
      }
      state.responses[item.index] = clone(submission.response);
      await persistSession();
      await renderCurrent();
      const finishButton = $("math-lab-finish");
      const nextButton = $("math-lab-next");

      if (finishButton && !finishButton.classList.contains("math-lab-hidden")) {
        finishButton.focus();
      } else {
        nextButton?.focus();
      }
    } catch (error) {
      setStatus(error.message || "Jawaban gagal diproses.", "error");
    }
  }

  function renderNavigation(item) {
    $("math-lab-prev").disabled = item.index === 0;
    $("math-lab-next").disabled = item.index >= item.total - 1 || !item.answered;
    $("math-lab-submit").disabled = item.answered;
    const allAnswered = state.manager.getSession(state.sessionId).progress.unansweredCount === 0;
    $("math-lab-finish").classList.toggle("math-lab-hidden", !allAnswered);
  }

  async function navigate(direction) {
    try {
      const item = state.manager.currentQuestion(state.sessionId);

      if (direction === "next" && !item.answered) {
        setStatus("Jawab soal ini terlebih dahulu.", "error");
        return;
      }

      if (direction === "next") state.manager.next(state.sessionId);
      else state.manager.previous(state.sessionId);
      await persistSession();
      await renderCurrent();
    } catch (error) {
      setStatus(error.message || "Navigasi gagal.", "error");
    }
  }

  async function finishPractice() {
    try {
      const result = state.manager.finalize(state.sessionId);
      await persistSession();
      await state.persistence.saveResult(result);
      renderResult(result);
      setPanel("math-lab-practice", false);
      setPanel("math-lab-result", true);
      await loadHistory();
    } catch (error) {
      setStatus(error.message || "Sesi belum dapat diselesaikan.", "error");
    }
  }

  function renderResult(result) {
    $("math-lab-result-score").textContent = `${result.score}`;
    $("math-lab-result-summary").textContent = `${result.correctCount} benar dari ${result.totalQuestions} soal.`;
    $("math-lab-result-trust").textContent = "Hasil latihan — client-untrusted";
  }

  async function loadHistory() {
    const container = $("math-lab-history-list");
    if (!container || !state.persistence) return;
    container.innerHTML = `<div class="math-lab-status">Memuat riwayat...</div>`;
    try {
      const history = await state.persistence.listHistory(20);
      if (!history.length) {
        container.innerHTML = `<div class="math-lab-status empty">Belum ada riwayat latihan.</div>`;
        return;
      }
      container.innerHTML = history.map((item) => `<article class="math-lab-history-item">
        <div><strong>${escapeHtml(topicTitle(item.topicId))}</strong><div class="math-lab-muted">${escapeHtml(formatDate(item.createdAt))} · ${escapeHtml(item.totalQuestions)} soal</div></div>
        <div><div class="math-lab-score">${escapeHtml(item.score)}/100</div><div class="math-lab-trust">${escapeHtml(item.trustStatus || "client-untrusted")}</div></div>
      </article>`).join("");
    } catch (error) {
      container.innerHTML = `<div class="math-lab-status error">Riwayat belum dapat dimuat. ${escapeHtml(error.message)}</div>`;
    }
  }

  function resetToSetup() {
    state.manager = null;
    state.persistence = state.persistence || NS.firestore?.practicePersistence?.createPersistence();
    state.sessionId = null;
    state.responses = [];
    setPanel("math-lab-result", false);
    setPanel("math-lab-practice", false);
    setPanel("math-lab-setup", true);
    setStatus("");
  }

  async function init(options) {
    if (state.initialized) return;
    state.initialized = true;
    state.profile = options?.profile || null;
    state.student = options?.student || null;
    state.questionSystem = options?.questionSystem || null;

    try {
      const questionSystem = state.questionSystem || NS.questionSystem;
      if (!questionSystem?.createPilotProvider) throw new Error("Question System belum tersedia di browser.");
      state.providerBundle = questionSystem.createPilotProvider();
      if (!Array.isArray(state.providerBundle?.taxonomy) || state.providerBundle.taxonomy.length === 0) {
        throw new Error("Question System tersedia, tetapi taxonomy tidak tersedia di browser.");
      }
      state.persistence = NS.firestore?.practicePersistence?.createPersistence();
      populateSelectors();
      await loadHistory();
      setStatus("");
    } catch (error) {
      console.error("Math Lab init:", error);
      setStatus(error.message || "Math Lab gagal dimuat.", "error");
    }
  }

  function bind() {
    $("math-lab-start")?.addEventListener("click", startPractice);
    $("math-lab-submit")?.addEventListener("click", submitAnswer);
    $("math-lab-prev")?.addEventListener("click", () => navigate("previous"));
    $("math-lab-next")?.addEventListener("click", () => navigate("next"));
    $("math-lab-finish")?.addEventListener("click", finishPractice);
    $("math-lab-new")?.addEventListener("click", resetToSetup);
    $("math-lab-refresh-history")?.addEventListener("click", loadHistory);

  }

  bind();
  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  function getDebugState() {
    const selectorIds = ["math-lab-level", "math-lab-grade", "math-lab-topic", "math-lab-subtopic"];
    return Object.freeze({
      initialized: state.initialized,
      questionSystemAvailable: Boolean(state.questionSystem?.createPilotProvider || NS.questionSystem?.createPilotProvider),
      taxonomyLength: getTaxonomy().length,
      selectorOptions: Object.freeze(Object.fromEntries(selectorIds.map((id) => {
        const element = $(id);
        return [id, element ? element.options?.length ?? 0 : null];
      }))),
    });
  }

  root.KakHarrisMathLab.studentUI = Object.freeze({ init, resetToSetup, getDebugState });
})(typeof globalThis !== "undefined" ? globalThis : this);
