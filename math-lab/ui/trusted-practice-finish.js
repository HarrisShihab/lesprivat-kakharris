(function (root) {
  "use strict";
  const role = document?.body?.dataset?.portalRole;
  if (role !== "murid" && role !== "admin") return;

  const $ = (id) => document.getElementById(id);
  const RAILWAY_URL = "https://lesprivat-kakharris-production.up.railway.app";
  const setStatus = (message, type) => {
    const el = $("math-lab-status");
    if (!el) return;
    el.textContent = message || "";
    el.className = `math-lab-status${type ? ` ${type}` : ""}${message ? "" : " math-lab-hidden"}`;
  };
  const setPanel = (id, visible) => $(id)?.classList.toggle("math-lab-hidden", !visible);
  const debug = (level, message, detail) => root.KakHarrisMathLab?.debug?.log?.(level, message, detail);

  function toMillis(value) {
    if (!value) return Date.now();
    if (typeof value.toMillis === "function") return value.toMillis();
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : Date.now();
  }

  async function callTrusted(data) {
    const user = root.firebase?.auth?.().currentUser;
    if (!user?.uid) throw new Error("Sesi login tidak aktif.");
    const token = await user.getIdToken();
    const response = await fetch(`${RAILWAY_URL}/v1/math-lab/practice/complete`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data || {}),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload.error) {
      throw new Error(payload?.error?.message || `Trusted Math Lab request gagal (${response.status}).`);
    }
    return payload;
  }

  async function loadActiveSession(db, uid) {
    const snapshot = await db.collection("mathSessions").where("ownerUid", "==", uid).limit(10).get();
    const active = snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((session) => session.sessionType === "practice" && session.status === "active")
      .sort((a, b) => toMillis(b.updatedAt || b.startedAt) - toMillis(a.updatedAt || a.startedAt));
    return active[0] || null;
  }

  async function finishTrusted(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
    const button = $("math-lab-finish");
    if (!button || button.dataset.trustedFinishBusy === "1") return;
    button.dataset.trustedFinishBusy = "1";
    button.disabled = true;
    setStatus("Memverifikasi hasil latihan...", "info");
    try {
      const user = root.firebase?.auth?.().currentUser;
      if (!user?.uid) throw new Error("Sesi login tidak aktif.");
      const session = await loadActiveSession(root.firebase.firestore(), user.uid);
      if (!session) throw new Error("Sesi Practice aktif tidak ditemukan.");
      const totalQuestions = Number(session.questionRefs?.length || 0);
      const responses = Array.isArray(session.responses) ? session.responses.filter(Boolean) : [];
      if (!totalQuestions || responses.length !== totalQuestions) {
        throw new Error(`Belum semua jawaban tersimpan (${responses.length}/${totalQuestions}).`);
      }

      const resultData = await callTrusted({ sessionId: String(session.sessionId || session.id) });
      const result = resultData?.result;
      if (!result || result.trustStatus !== "trusted") throw new Error("Trusted Result tidak diterima dari backend.");

      const score = $("math-lab-result-score");
      const summary = $("math-lab-result-summary");
      const panel = $("math-lab-result");
      if (!score || !summary || !panel) throw new Error("DOM Result tidak lengkap.");
      score.textContent = String(result.score);
      summary.textContent = `${result.correctCount} benar dari ${result.totalQuestions} soal.`;
      setPanel("math-lab-practice", false);
      setPanel("math-lab-result", true);
      setStatus("Latihan selesai. Hasil berhasil diverifikasi dan disimpan.", "success");
      debug("INFO", "Trusted Practice Result diterima", {
        resultId: result.resultId,
        score: result.score,
        correctCount: result.correctCount,
        trustStatus: result.trustStatus,
      });
      $("math-lab-refresh-history")?.click();
    } catch (error) {
      debug("FINISH_ERROR", error?.message || "Trusted Result gagal.", error);
      console.error("Math Lab trusted finish:", error);
      setStatus(error?.message || "Hasil latihan belum dapat diverifikasi.", "error");
    } finally {
      button.dataset.trustedFinishBusy = "0";
      button.disabled = false;
    }
  }

  function bind() {
    const button = $("math-lab-finish");
    if (!button || button.dataset.trustedFinishBound === "1") return;
    button.dataset.trustedFinishBound = "1";
    button.addEventListener("click", finishTrusted, true);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind, { once: true });
  else bind();
  new MutationObserver(bind).observe(document.documentElement, { childList: true, subtree: true });
})(typeof globalThis !== "undefined" ? globalThis : this);
