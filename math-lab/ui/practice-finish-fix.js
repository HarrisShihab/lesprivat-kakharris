(function (root) {
  "use strict";
  if (document?.body?.dataset?.portalRole !== "murid") return;

  const $ = (id) => document.getElementById(id);
  const debug = (level, message, detail) => root.KakHarrisMathLab?.debug?.log?.(level, message, detail);

  function setStatus(message, type) {
    const el = $("math-lab-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = `math-lab-status${type ? ` ${type}` : ""}${message ? "" : " math-lab-hidden"}`;
  }

  function setPanel(id, visible) {
    $(id)?.classList.toggle("math-lab-hidden", !visible);
  }

  function makeResultId() {
    if (root.crypto?.randomUUID) return `math-result-${root.crypto.randomUUID()}`;
    return `math-result-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function toMillis(value) {
    if (!value) return Date.now();
    if (typeof value.toMillis === "function") return value.toMillis();
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : Date.now();
  }

  async function finishFromPersistedSession(event) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = $("math-lab-finish");
    if (!button || button.dataset.finishFixBusy === "1") return;

    button.dataset.finishFixBusy = "1";
    button.disabled = true;
    setStatus("Menyelesaikan latihan...", "info");
    debug("INFO", "Finish handler dimulai", {
      buttonFound: !!button,
      resultElements: {
        score: !!$("math-lab-result-score"),
        summary: !!$("math-lab-result-summary"),
        trust: !!$("math-lab-result-trust"),
        resultPanel: !!$("math-lab-result"),
      },
    });

    try {
      const firebase = root.firebase;
      const user = firebase?.auth?.().currentUser;
      if (!user?.uid) throw new Error("Sesi login tidak aktif.");

      const db = firebase.firestore();
      const snapshot = await db.collection("mathSessions").where("ownerUid", "==", user.uid).limit(10).get();
      const activeDocs = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((session) => session.sessionType === "practice" && session.status === "active")
        .sort((a, b) => toMillis(b.updatedAt || b.startedAt) - toMillis(a.updatedAt || a.startedAt));

      const session = activeDocs[0];
      if (!session) throw new Error("Sesi Practice aktif tidak ditemukan.");

      const responses = Array.isArray(session.responses) ? session.responses.filter(Boolean) : [];
      const totalQuestions = Number(session.questionRefs?.length || Object.keys(session.questionVersions || {}).length || responses.length);
      if (!totalQuestions || responses.length < totalQuestions) {
        throw new Error("Belum semua jawaban tersimpan. Tunggu sebentar lalu coba Selesaikan lagi.");
      }

      const correct = responses.filter((response) => response.isCorrect === true).length;
      const wrong = totalQuestions - correct;
      const finishedAt = Date.now();
      const result = {
        contractVersion: "1.0",
        resultId: makeResultId(),
        sessionId: String(session.sessionId || session.id),
        ownerUid: user.uid,
        sessionType: "practice",
        educationLevel: String(session.educationLevel || "SMP"),
        grade: session.grade,
        phase: String(session.phase || "D"),
        subject: String(session.subject || "matematika"),
        topicId: String(session.topicId || "aljabar"),
        score: Number(((correct / totalQuestions) * 100).toFixed(2)),
        accuracy: correct / totalQuestions,
        correctCount: correct,
        wrongCount: wrong,
        totalQuestions,
        duration: Math.max(0, finishedAt - toMillis(session.startedAt)),
        questionVersions: session.questionVersions || {},
        responses,
        diagnosticSummary: null,
        mastery: null,
        recommendations: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        trustStatus: "client-untrusted",
      };

      await db.collection("mathSessions").doc(session.id).update({
        status: "completed",
        finishedAt: firebase.firestore.FieldValue.serverTimestamp(),
        currentIndex: Math.max(0, totalQuestions - 1),
        responses,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        trustStatus: "client-untrusted",
      });
      debug("INFO", "mathSessions berhasil ditandai completed", { sessionId: session.id, totalQuestions, correct, wrong });

      await db.collection("mathResults").doc(result.resultId).set(result);
      debug("INFO", "mathResults berhasil disimpan", { resultId: result.resultId, score: result.score });

      const resultScore = $("math-lab-result-score");
      const resultSummary = $("math-lab-result-summary");
      const resultTrust = $("math-lab-result-trust");
      const resultPanel = $("math-lab-result");
      debug("DOM_CHECK", "Elemen Result sebelum render", {
        score: !!resultScore,
        summary: !!resultSummary,
        trust: !!resultTrust,
        panel: !!resultPanel,
      });

      if (!resultScore || !resultSummary || !resultTrust || !resultPanel) {
        const missing = [
          !resultScore && "math-lab-result-score",
          !resultSummary && "math-lab-result-summary",
          !resultTrust && "math-lab-result-trust",
          !resultPanel && "math-lab-result",
        ].filter(Boolean);
        throw new Error(`DOM Result tidak lengkap: ${missing.join(", ")}`);
      }

      resultScore.textContent = String(result.score);
      resultSummary.textContent = `${correct} benar dari ${totalQuestions} soal.`;
      resultTrust.textContent = "Hasil latihan — client-untrusted";
      setPanel("math-lab-practice", false);
      setPanel("math-lab-result", true);
      setStatus("Latihan selesai. Hasil berhasil disimpan.", "success");
      $("math-lab-refresh-history")?.click();
    } catch (error) {
      debug("FINISH_ERROR", error?.message || "Latihan belum dapat diselesaikan.", error);
      console.error("Math Lab finish fix:", error);
      setStatus(error?.message || "Latihan belum dapat diselesaikan.", "error");
    } finally {
      button.dataset.finishFixBusy = "0";
      button.disabled = false;
    }
  }

  function bind() {
    const button = $("math-lab-finish");
    if (!button || button.dataset.finishFixBound === "1") return;
    button.dataset.finishFixBound = "1";
    button.addEventListener("click", finishFromPersistedSession, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();

  const observer = new MutationObserver(bind);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})(typeof globalThis !== "undefined" ? globalThis : this);
