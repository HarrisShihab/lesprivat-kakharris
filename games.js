(async function () {
  "use strict";

  const catalogDescription = document.getElementById("game-catalog-description");
  const catalogStatus = document.getElementById("game-catalog-status");
  const gameGrid = document.getElementById("game-grid");
  const gameTemplate = document.getElementById("game-card-template");

  function detectGradeLevel(studentData) {
    const gradeLevel = String(studentData.jenjang || "").trim().toUpperCase();
    const classLevel = String(studentData.kelas || "").trim().toUpperCase();
    const combined = `${gradeLevel} KELAS ${classLevel}`;

    if (combined.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(combined)) return "SMP";
    if (combined.includes("SD") || /KELAS\s*([1-6])\b/.test(combined)) return "SD";
    return "";
  }

  function showCatalogMessage(message) {
    catalogStatus.textContent = message;
    catalogStatus.hidden = false;
    gameGrid.setAttribute("aria-busy", "false");
  }

  let student;
  try {
    await firebasePortal.guard(["murid"]);
    student = await firebasePortal.getCurrentMurid();
  } catch (error) {
    console.error("Gagal memuat katalog game:", error);
    catalogDescription.textContent = "Katalog belum dapat dimuat.";
    showCatalogMessage("Data akun gagal dimuat. Muat ulang halaman untuk mencoba lagi.");
    return;
  }

  if (!student) {
    window.location.replace("login.html");
    return;
  }

  const gradeLevel = detectGradeLevel(student);
  if (!gradeLevel) {
    catalogDescription.textContent = "Jenjang akun belum ditentukan.";
    showCatalogMessage("Hubungi admin untuk melengkapi jenjang akunmu agar game yang sesuai dapat ditampilkan.");
    return;
  }

  const matchingCards = Array.from(gameTemplate.content.querySelectorAll("[data-grade-levels]"))
    .filter((card) => card.dataset.gradeLevels.split(",").map((level) => level.trim()).includes(gradeLevel));

  const fragment = document.createDocumentFragment();
  matchingCards.forEach((card) => fragment.appendChild(card.cloneNode(true)));
  gameGrid.appendChild(fragment);
  gameGrid.setAttribute("aria-busy", "false");
  catalogStatus.hidden = true;
  catalogDescription.textContent = `Menampilkan game untuk ${gradeLevel}, termasuk game SD–SMP.`;

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
