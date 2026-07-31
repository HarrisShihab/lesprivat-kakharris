(async function () {
  "use strict";

  await firebasePortal.guard(["murid"]);
  const student = await firebasePortal.getCurrentMurid();
  if (!student) {
    window.location.replace("login.html");
    return;
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
})();
