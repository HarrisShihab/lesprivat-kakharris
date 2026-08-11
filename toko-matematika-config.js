/**
 * Konfigurasi & Bank Soal untuk game "Toko Matematika".
 *
 * Sesuai prinsip arsitektur "konten terpisah dari mekanik" (docs/Games/
 * 02-Arsitektur-Game.md), definisi game, produk, tingkat kesulitan, dan
 * generator transaksi hidup di sini — bukan di dalam engine.
 *
 * Item transaksi yang dihasilkan membawa:
 *   { text, answer, difficulty, type, items, subtotal, payment, discount,
 *     question, note, label, registerTotal, speech, unit }
 * sehingga game (lapisan presentasi) hanya perlu merender data ini.
 */
(function () {
  "use strict";

  const products = [
    { name: "Pensil", icon: "✏️", easy: 2000, medium: 2500, hard: 3500 },
    { name: "Buku", icon: "📘", easy: 5000, medium: 7500, hard: 12500 },
    { name: "Penghapus", icon: "🧽", easy: 1000, medium: 2000, hard: 2500 },
    { name: "Susu", icon: "🥛", easy: 4000, medium: 6500, hard: 8500 },
    { name: "Roti", icon: "🍞", easy: 3000, medium: 5500, hard: 7500 },
    { name: "Apel", icon: "🍎", easy: 2000, medium: 4000, hard: 6500 },
    { name: "Jus", icon: "🧃", easy: 4000, medium: 7000, hard: 9500 },
    { name: "Mainan", icon: "🧸", easy: 8000, medium: 15000, hard: 27500 },
    { name: "Penggaris", icon: "📏", easy: 3000, medium: 4500, hard: 6000 },
    { name: "Cokelat", icon: "🍫", easy: 5000, medium: 8500, hard: 11500 },
  ];

  function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function randomItems(count) {
    const available = products.slice();
    const picked = [];
    while (picked.length < count && available.length) {
      picked.push(available.splice(randomInt(0, available.length - 1), 1)[0]);
    }
    return picked;
  }

  function nextRoundAmount(amount) {
    const denominations = [5000, 10000, 20000, 50000, 100000, 200000];
    return denominations.find((value) => value >= amount) || Math.ceil(amount / 100000) * 100000;
  }

  function transactionType(level) {
    const pool = level === "easy" ? ["total"] : level === "medium" ? ["total", "change", "quantity"] : ["total", "change", "discount", "quantity"];
    return pool[randomInt(0, pool.length - 1)];
  }

  function formatRupiah(value) {
    return `Rp${Number(value || 0).toLocaleString("id-ID")}`;
  }

  function createItem(ctx) {
    const level = ctx.level || "easy";
    const count = level === "easy" ? randomInt(1, 3) : randomInt(2, 4);
    const items = randomItems(count).map((product) => ({
      name: product.name,
      icon: product.icon,
      price: product[level],
      qty: level === "easy" ? 1 : randomInt(1, level === "medium" ? 3 : 5),
    }));
    const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    let type = transactionType(level);
    let answer = subtotal;
    let payment = 0;
    let discount = 0;
    let question = "Berapa total belanja pelanggan?";
    let note = "";
    let label = "Hitung total";
    let registerTotal = "?";
    let speech = "Tolong hitung total belanja saya.";
    let unit = "";

    if (type === "quantity") {
      answer = items.reduce((sum, item) => sum + item.qty, 0);
      question = "Berapa jumlah seluruh barang yang dibeli?";
      note = "Jawab jumlah barang, bukan jumlah jenis produk.";
      label = "Hitung barang";
      registerTotal = formatRupiah(subtotal);
      speech = "Ada berapa barang di belanjaan saya?";
      unit = " barang";
    } else if (type === "change") {
      payment = nextRoundAmount(subtotal + 1);
      if (payment === subtotal) payment += level === "hard" ? 100000 : 50000;
      answer = payment - subtotal;
      question = "Berapa uang kembalian pelanggan?";
      note = `Pelanggan membayar ${formatRupiah(payment)}.`;
      label = "Hitung kembalian";
      registerTotal = formatRupiah(subtotal);
      speech = `Saya membayar ${formatRupiah(payment)}.`;
    } else if (type === "discount") {
      discount = [10, 20, 25][randomInt(0, 2)];
      const discountValue = (subtotal * discount) / 100;
      if (!Number.isInteger(discountValue)) {
        type = "total";
        discount = 0;
      } else {
        answer = subtotal - discountValue;
        question = "Berapa yang harus dibayar setelah diskon?";
        note = `Diskon ${discount}% dari total ${formatRupiah(subtotal)}.`;
        label = `Diskon ${discount}%`;
        registerTotal = formatRupiah(subtotal);
        speech = `Katanya hari ini diskon ${discount}%!`;
      }
    }

    return {
      text: String(answer),
      answer,
      difficulty: level,
      type,
      items,
      subtotal,
      payment,
      discount,
      question,
      note,
      label,
      registerTotal,
      speech,
      unit,
      // Format jawaban untuk tampilan (Rp untuk uang, "barang" untuk jumlah).
      display: type === "quantity" ? (value) => `${value.toLocaleString("id-ID")} barang` : (value) => formatRupiah(value),
    };
  }

  window.TokoMatematikaConfig = {
    perGameKey: "tokoMatematika",
    questionLimit: 10,
    basePoints: { easy: 20, medium: 35, hard: 50 },
    feedbackDurationMs: 1200,
    bank: createItem,
  };
})();
