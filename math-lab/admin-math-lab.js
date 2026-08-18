// Admin My Learning adapter.
// Reuses the exact learner-facing Math Lab UI and Practice Engine.
// No admin-specific question generation or evaluation logic lives here.

(function (root) {
  "use strict";

  const DEFAULT_TARGET = Object.freeze({
    educationLevel: "SMP",
    grade: "7",
    topicId: "aljabar",
  });

  let initialized = false;

  function setDefaultTarget() {
    const level = document.getElementById("math-lab-level");
    const grade = document.getElementById("math-lab-grade");
    const topic = document.getElementById("math-lab-topic");

    if (level && [...level.options].some((option) => option.value === DEFAULT_TARGET.educationLevel)) {
      level.value = DEFAULT_TARGET.educationLevel;
    }
    if (grade && [...grade.options].some((option) => option.value.startsWith(`${DEFAULT_TARGET.grade}|`))) {
      grade.value = [...grade.options].find((option) => option.value.startsWith(`${DEFAULT_TARGET.grade}|`)).value;
    }
    if (topic && [...topic.options].some((option) => option.value === DEFAULT_TARGET.topicId)) {
      topic.value = DEFAULT_TARGET.topicId;
    }
  }

  async function loadAdminProfile() {
    const user = root.firebase?.auth?.()?.currentUser;
    if (!user?.uid) throw new Error("Sesi admin tidak aktif.");

    const snapshot = await root.firebase.firestore().collection("users").doc(user.uid).get();
    if (!snapshot.exists) throw new Error("Profil admin tidak ditemukan.");

    const profile = snapshot.data() || {};
    if (profile.aktif === false || profile.role !== "admin") {
      throw new Error("Akun tidak memiliki akses Admin Math Lab.");
    }

    return profile;
  }

  async function init() {
    if (initialized) return;
    initialized = true;

    if (document.body?.dataset.portalRole !== "admin") return;

    try {
      const questionSystem = await root.KakHarrisMathLab?.questionSystemReady;
      const profile = await loadAdminProfile();
      const studentUI = root.KakHarrisMathLab?.studentUI;

      if (!studentUI?.init) throw new Error("Shared Math Lab UI belum tersedia.");

      await studentUI.init({ profile, questionSystem });
      setDefaultTarget();
    } catch (error) {
      console.error("Admin Math Lab init:", error);
      const status = document.getElementById("math-lab-status");
      if (status) {
        status.textContent = error.message || "Math Lab gagal dimuat.";
        status.className = "math-lab-status error";
      }
    }
  }

  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.adminUI = Object.freeze({ init });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    void init();
  }
})(typeof globalThis !== "undefined" ? globalThis : this);
