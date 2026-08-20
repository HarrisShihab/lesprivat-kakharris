(function (root) {
  "use strict";

  const portalRole = document?.body?.dataset?.portalRole;
  if (typeof document === "undefined" || !["murid", "admin"].includes(portalRole)) return;

  const $ = (id) => document.getElementById(id);

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function toDate(value) {
    if (!value) return null;
    if (typeof value.toDate === "function") return value.toDate();
    if (typeof value.toMillis === "function") return new Date(value.toMillis());

    // Firestore Timestamp may have been JSON-cloned by the persistence layer.
    if (typeof value === "object" && Number.isFinite(Number(value.seconds))) {
      return new Date(Number(value.seconds) * 1000 + Math.floor(Number(value.nanoseconds || 0) / 1000000));
    }
    if (typeof value === "object" && Number.isFinite(Number(value._seconds))) {
      return new Date(Number(value._seconds) * 1000 + Math.floor(Number(value._nanoseconds || 0) / 1000000));
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function formatDate(value) {
    const date = toDate(value);
    if (!date) return "-";
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  }

  function topicTitle(id) {
    return id === "aljabar"
      ? "Aljabar"
      : String(id || "Materi")
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  async function getContext() {
    const fb = root.firebase;
    if (!fb || typeof fb.auth !== "function" || typeof fb.firestore !== "function") return null;
    const auth = fb.auth();
    const user = auth.currentUser;
    if (!user?.uid) return null;
    return { user, db: fb.firestore() };
  }

  async function renderHistory() {
    const container = $("math-lab-history-list");
    if (!container) return;

    const context = await getContext();
    if (!context) return;

    try {
      const snap = await context.db
        .collection("mathResults")
        .where("ownerUid", "==", context.user.uid)
        .orderBy("createdAt", "desc")
        .limit(5)
        .get();

      if (!snap.docs.length) {
        container.innerHTML = '<div class="math-lab-status empty">Belum ada riwayat latihan.</div>';
        return;
      }

      container.innerHTML = snap.docs.map((doc) => {
        const item = doc.data() || {};
        return `<article class="math-lab-history-item"><div><strong>${escapeHtml(topicTitle(item.topicId))}</strong><div class="math-lab-muted">${escapeHtml(formatDate(item.createdAt))} · ${escapeHtml(item.totalQuestions ?? 0)} soal</div></div><div><div class="math-lab-score">${escapeHtml(item.score ?? 0)}/100</div></div></article>`;
      }).join("");
    } catch (error) {
      console.warn("Practice history presentation failed:", error);
    }
  }

  function init() {
    const container = $("math-lab-history-list");
    if (!container) return;

    $("math-lab-refresh-history")?.addEventListener("click", () => {
      window.setTimeout(() => void renderHistory(), 0);
    });

    let rendering = false;
    const observer = new MutationObserver(() => {
      if (rendering) return;
      window.clearTimeout(observer.timer);
      observer.timer = window.setTimeout(async () => {
        rendering = true;
        try { await renderHistory(); } finally { rendering = false; }
      }, 50);
    });
    observer.observe(container, { childList: true, subtree: true });

    window.setTimeout(() => void renderHistory(), 300);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();

  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.practiceHistoryPresentation = Object.freeze({ renderHistory, formatDate });
})(typeof globalThis !== "undefined" ? globalThis : this);
