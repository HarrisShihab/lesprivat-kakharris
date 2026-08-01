(async function () {
  "use strict";

  const TOTAL = 10;
  const state = { mode: "limited", mission: 0, score: 0, correct: 0, wrong: 0, lives: 3, streak: 0, bestStreak: 0, question: null, locked: false, hintUsed: false, recent: [] };
  const $ = (id) => document.getElementById(id);
  const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (items) => items[rand(0, items.length - 1)];
  let storageKey = "";

  function isSdStudent(student) {
    const data = `${student.jenjang || ""} KELAS ${student.kelas || ""}`.toUpperCase();
    if (data.includes("SMP") || /KELAS\s*(7|8|9)\b/.test(data)) return false;
    return data.includes("SD") || /KELAS\s*([1-6])\b/.test(data);
  }

  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);
  const fraction = (n, d) => `${n}/${d}`;
  function shuffle(items) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i -= 1) { const j = rand(0, i); [result[i], result[j]] = [result[j], result[i]]; }
    return result;
  }
  function choices(answer, distractors) {
    return shuffle([answer, ...distractors.filter((x) => x !== answer)]).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
  }
  function visualQuestion() {
    const d = pick([3, 4, 5, 6, 8]), n = rand(1, d - 1), answer = fraction(n, d);
    return { type: "visual", n, d, text: "Berapa bagian yang berwarna kuning?", answer, choices: choices(answer, [fraction(d - n, d), fraction(n, Math.max(2, d - 1)), fraction(n + 1, d)]), hint: `Hitung ${d} bagian seluruhnya, lalu hitung ${n} bagian berwarna.`, label: "Pantai Pecahan" };
  }
  function equivalentQuestion() {
    const d = pick([2, 3, 4, 5]), n = rand(1, d - 1), k = rand(2, 4), answer = fraction(n * k, d * k);
    return { type: "symbol", symbol: fraction(n, d), text: `Pecahan mana yang senilai dengan ${fraction(n, d)}?`, answer, choices: choices(answer, [fraction(n + k, d + k), fraction(n * k, d + k), fraction(n + k, d * k)]), hint: `Kalikan pembilang dan penyebut dengan bilangan yang sama, yaitu ${k}.`, label: "Hutan Pecahan Senilai" };
  }
  function compareQuestion() {
    const d = pick([4, 5, 6, 8]), a = rand(1, d - 2), b = rand(a + 1, d - 1), leftFirst = Math.random() < .5;
    const left = leftFirst ? a : b, right = leftFirst ? b : a, answer = left > right ? ">" : "<";
    return { type: "symbol", symbol: `${fraction(left, d)}  ?  ${fraction(right, d)}`, text: "Pilih tanda perbandingan yang benar.", answer, choices: ["<", ">", "="], hint: "Penyebutnya sama. Pecahan dengan pembilang lebih besar memiliki nilai lebih besar.", label: "Jembatan Perbandingan" };
  }
  function simplifyQuestion() {
    const baseD = pick([3, 4, 5, 6]), baseN = rand(1, baseD - 1), k = rand(2, 4), divisor = gcd(baseN, baseD), n = (baseN / divisor) * k, d = (baseD / divisor) * k, answer = fraction(n / k, d / k);
    return { type: "symbol", symbol: fraction(n, d), text: `Bentuk paling sederhana dari ${fraction(n, d)} adalah ...`, answer, choices: choices(answer, [fraction(n - 1, d - 1), fraction(n / k, d), fraction(n, d / k)]), hint: `Pembilang dan penyebut sama-sama bisa dibagi ${k}.`, label: "Gua Penyederhanaan" };
  }
  function operationQuestion() {
    const d = pick([4, 5, 6, 8]), subtract = Math.random() < .4;
    let a, b, result;
    if (subtract) { a = rand(2, d - 1); b = rand(1, a - 1); result = a - b; } else { a = rand(1, d - 2); b = rand(1, d - a - 1); result = a + b; }
    const op = subtract ? "−" : "+", common = gcd(result, d), answer = fraction(result / common, d / common);
    return { type: "symbol", symbol: `${fraction(a, d)} ${op} ${fraction(b, d)}`, text: "Hitung hasil operasi pecahan berikut.", answer, choices: choices(answer, [fraction(result, d + d), fraction(Math.abs(a - b) || 1, d), fraction(result + 1, d)]), hint: "Karena penyebutnya sama, hitung pembilangnya lalu sederhanakan jika bisa.", label: "Puncak Operasi Pecahan" };
  }
  function createQuestion() {
    const factories = state.mission <= 3 ? [visualQuestion, visualQuestion, equivalentQuestion] : state.mission <= 6 ? [equivalentQuestion, compareQuestion, simplifyQuestion] : [compareQuestion, simplifyQuestion, operationQuestion, operationQuestion];
    let question, key;
    do { question = pick(factories)(); key = `${question.text}:${question.symbol || `${question.n}/${question.d}`}:${question.answer}`; } while (state.recent.includes(key));
    state.recent.push(key); if (state.recent.length > 7) state.recent.shift();
    return question;
  }
  function updateBoard() {
    $("mission-number").textContent = state.mode === "limited" ? `${state.mission}/${TOTAL}` : state.mission; $("score").textContent = state.score; $("lives").textContent = state.mode === "endless" ? "∞" : state.lives ? "♥ ".repeat(state.lives).trim() : "0"; $("streak").textContent = state.streak; const islandMission = ((state.mission - 1) % TOTAL) + 1; $("progress-fill").style.width = `${Math.max(10, islandMission * 10)}%`;
  }
  function renderVisual(question) {
    const container = $("fraction-visual"); container.replaceChildren();
    if (question.type === "visual") {
      for (let i = 0; i < question.d; i += 1) { const piece = document.createElement("span"); piece.className = `fraction-piece${i < question.n ? " filled" : ""}`; container.appendChild(piece); }
    } else { const symbol = document.createElement("span"); symbol.className = "fraction-symbol"; symbol.textContent = question.symbol; container.appendChild(symbol); }
  }
  function showMission() {
    if ($("game-panel").classList.contains("hidden")) return;
    if (state.mode === "limited" && (state.mission >= TOTAL || state.lives <= 0)) return finish();
    state.mission += 1; state.question = createQuestion(); state.locked = false; state.hintUsed = false;
    $("mission-label").textContent = state.question.label; $("question-text").textContent = state.question.text; $("feedback").textContent = ""; $("feedback").className = "feedback"; $("hint-button").disabled = false;
    renderVisual(state.question);
    $("choices").replaceChildren(...state.question.choices.map((choice) => { const button = document.createElement("button"); button.className = "fraction-choice"; button.type = "button"; button.textContent = choice; button.dataset.answer = choice; return button; }));
    updateBoard();
  }
  function chooseAnswer(button) {
    if (state.locked) return; state.locked = true;
    const isCorrect = button.dataset.answer === state.question.answer;
    $("choices").querySelectorAll("button").forEach((item) => { item.disabled = true; if (item.dataset.answer === state.question.answer) item.classList.add("correct"); });
    if (isCorrect) { state.correct += 1; state.streak += 1; state.bestStreak = Math.max(state.bestStreak, state.streak); const points = 10 + Math.min(state.streak - 1, 5) * 2; state.score += points; $("feedback").textContent = `Misi berhasil! +${points} poin.`; $("feedback").className = "feedback correct"; }
    else { button.classList.add("wrong"); state.wrong += 1; if (state.mode === "limited") state.lives -= 1; state.streak = 0; $("feedback").textContent = `Belum tepat. Jawabannya ${state.question.answer}.`; $("feedback").className = "feedback wrong"; }
    updateBoard(); window.setTimeout(showMission, 1250);
  }
  function useHint() { if (state.locked || state.hintUsed) return; state.hintUsed = true; state.score = Math.max(0, state.score - 5); $("feedback").textContent = state.question.hint; $("feedback").className = "feedback hint"; $("hint-button").disabled = true; updateBoard(); }
  function loadStats() { try { return JSON.parse(localStorage.getItem(storageKey) || "{}"); } catch (error) { return {}; } }
  function saveStats() {
    const stats = loadStats(), answered = state.correct + state.wrong, old = stats.perGame?.petualanganPecahan || {};
    const perGame = Object.assign({}, stats.perGame, { petualanganPecahan: { bestScore: Math.max(old.bestScore || 0, state.score), bestStreak: Math.max(old.bestStreak || 0, state.bestStreak), totalAnswered: (old.totalAnswered || 0) + answered, gamesPlayed: (old.gamesPlayed || 0) + 1, lastMode: state.mode } });
    try { localStorage.setItem(storageKey, JSON.stringify(Object.assign({}, stats, { bestScore: Math.max(stats.bestScore || 0, state.score), bestStreak: Math.max(stats.bestStreak || 0, state.bestStreak), totalAnswered: (stats.totalAnswered || 0) + answered, gamesPlayed: (stats.gamesPlayed || 0) + 1, perGame }))); } catch (error) { /* Statistik lokal bersifat opsional. */ }
  }
  function finish() {
    if ($("game-panel").classList.contains("hidden")) return; saveStats(); $("game-panel").classList.add("hidden"); $("summary-panel").classList.remove("hidden");
    const won = state.mode === "limited" && state.mission >= TOTAL && state.correct + state.wrong >= TOTAL && state.lives > 0; $("summary-title").textContent = won ? "Kristal Pecahan ditemukan!" : "Petualangan selesai"; $("summary-mark").textContent = won ? "◆" : "🏝"; $("summary-message").textContent = won ? "Kamu berhasil menuntaskan seluruh misi di Pulau Pecahan." : state.mode === "endless" ? `Petualangan diakhiri setelah ${state.mission} misi.` : `Kamu mencapai misi ${state.mission}. Coba lagi untuk menemukan kristal.`; $("summary-score").textContent = state.score; $("summary-correct").textContent = state.correct; $("summary-wrong").textContent = state.wrong; $("summary-streak").textContent = state.bestStreak; window.scrollTo({ top: 0, behavior: "smooth" });
  }
  function start() { state.mode = document.querySelector('[name="mode"]:checked')?.value || "limited"; Object.assign(state, { mission: 0, score: 0, correct: 0, wrong: 0, lives: 3, streak: 0, bestStreak: 0, question: null, locked: false, hintUsed: false, recent: [] }); $("setup-panel").classList.add("hidden"); $("summary-panel").classList.add("hidden"); $("game-panel").classList.remove("hidden"); showMission(); }

  $("choices").addEventListener("click", (event) => { const button = event.target.closest("[data-answer]"); if (button) chooseAnswer(button); }); $("hint-button").addEventListener("click", useHint); $("end-button").addEventListener("click", finish); $("replay-button").addEventListener("click", () => { $("summary-panel").classList.add("hidden"); $("setup-panel").classList.remove("hidden"); window.scrollTo({ top: 0, behavior: "smooth" }); }); $("start-button").addEventListener("click", start);
  try { await firebasePortal.guard(["murid"]); const student = await firebasePortal.getCurrentMurid(); if (!student) throw new Error("Akun belum terhubung ke data murid."); if (!isSdStudent(student)) throw new Error("Game Petualangan Pecahan khusus untuk murid SD."); storageKey = `kakHarrisGameStats:${student.id || student.username || "murid"}`; const lastMode = loadStats().perGame?.petualanganPecahan?.lastMode; const modeInput = lastMode && document.querySelector(`[name="mode"][value="${lastMode}"]`); if (modeInput) modeInput.checked = true; $("setup-status").textContent = "Misi visual, pecahan senilai, perbandingan, dan operasi sederhana siap."; $("start-button").disabled = false; $("start-button").textContent = "Buka Peta →"; } catch (error) { $("setup-status").textContent = error.message || "Permainan gagal disiapkan."; }
})();
