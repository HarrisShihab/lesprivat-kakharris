(async function () {
  "use strict";

  await firebasePortal.guard(["murid"]);
  const student = await firebasePortal.getCurrentMurid();
  if (!student) {
    window.location.replace("login.html");
    return;
  }

  function detectGradeLevel(studentData) {
    const gradeLevel = String(studentData.jenjang || "").trim().toUpperCase();
    const classLevel = String(studentData.kelas || "").trim().toUpperCase();
    const combined = `${gradeLevel} KELAS ${classLevel}`;

    if (combined.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(combined)) return "SMP";
    if (combined.includes("SD") || /KELAS\s*([1-6])\b/.test(combined)) return "SD";
    return "";
  }

  const gradeLevel = detectGradeLevel(student);
  const catalogDescription = document.getElementById("game-catalog-description");
  document.querySelectorAll("[data-grade-levels]").forEach((card) => {
    const supportedLevels = card.dataset.gradeLevels.split(",").map((level) => level.trim());
    card.hidden = Boolean(gradeLevel) && !supportedLevels.includes(gradeLevel);
  });

  if (catalogDescription) {
    catalogDescription.textContent = gradeLevel
      ? `Menampilkan game untuk ${gradeLevel}, termasuk game SD–SMP.`
      : "Menampilkan seluruh game karena jenjang akun belum ditentukan.";
  }

  const storageKey = `kakHarrisGameStats:${student.id || student.username || "murid"}`;
  let stats = {};
  try {
    stats = JSON.parse(localStorage.getItem(storageKey) || "{}");
  } catch (error) {
    stats = {};
  }

  document.getElementById("best-score").textContent = stats.bestScore || 0;
  document.getElementById("best-streak").textContent = stats.bestStreak || 0;
  document.getElementById("total-answered").textContent = stats.totalAnswered || 0;
  document.getElementById("games-played").textContent = stats.gamesPlayed || 0;

  const shopBest = stats.perGame && stats.perGame.tokoMatematika
    ? stats.perGame.tokoMatematika.bestScore || 0
    : 0;
  const shopBestTag = document.getElementById("shop-best-tag");
  if (shopBestTag && shopBest > 0) {
    shopBestTag.textContent = `Rekor ${shopBest} poin`;
  }

  const patternBest = stats.perGame?.detektifPola?.bestScore || 0;
  const patternBestTag = document.getElementById("pattern-best-tag");
  if (patternBestTag && patternBest > 0) patternBestTag.textContent = `Rekor ${patternBest} poin`;

  const algebraBest = stats.perGame?.menaraAljabar?.bestScore || 0;
  const algebraBestTag = document.getElementById("algebra-best-tag");
  if (algebraBestTag && algebraBest > 0) algebraBestTag.textContent = `Rekor ${algebraBest} poin`;

  const fractionBest = stats.perGame?.petualanganPecahan?.bestScore || 0;
  const fractionBestTag = document.getElementById("fraction-best-tag");
  if (fractionBestTag && fractionBest > 0) fractionBestTag.textContent = `Rekor ${fractionBest} poin`;
})();
