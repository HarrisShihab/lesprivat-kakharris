// Math Lab admin entry point.
// This file only adds the dashboard navigation entry; My Learning is implemented separately.

(function registerMathLabAdminEntry() {
  function mount() {
    const body = document.body;
    if (!body || !body.classList.contains("dashboard-admin")) return;

    const nav = body.querySelector("aside nav");
    if (!nav || document.getElementById("btn-math-lab")) return;

    const logoutButton = nav.querySelector('button[onclick="keluarAdmin()"]');
    const entry = document.createElement("a");
    entry.id = "btn-math-lab";
    entry.href = "math-lab-my-learning.html";
    entry.className = "flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-xl transition w-full text-left";
    entry.innerHTML = '<i class="fa-solid fa-calculator text-lg"></i> Belajar Saya';
    entry.setAttribute("aria-label", "Math Lab — Belajar Saya");

    if (logoutButton) {
      nav.insertBefore(entry, logoutButton);
    } else {
      nav.appendChild(entry);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount, { once: true });
  } else {
    mount();
  }
})();
