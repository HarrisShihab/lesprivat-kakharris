// ==========================================
// NOTIFIKASI BELL - Shared Logic
// Dipakai oleh dashboard.html & ortu-dashboard.html
// ==========================================

let notifVisible = false;

document.addEventListener("click", function (e) {
  const panel = document.getElementById("notif-panel");
  const btn = document.querySelector(".notif-btn");
  if (panel && btn && !btn.contains(e.target) && !panel.contains(e.target)) {
    panel.classList.remove("active");
    notifVisible = false;
  }
});

function toggleNotifikasi() {
  const panel = document.getElementById("notif-panel");
  notifVisible = !notifVisible;
  panel.classList.toggle("active", notifVisible);
  if (notifVisible) muatNotifikasi();
}

// Dismiss notification helpers
function getDismissedNotif() {
  try {
    return JSON.parse(localStorage.getItem("notif_dismissed") || "[]");
  } catch {
    return [];
  }
}
function dismissNotif(key) {
  const list = getDismissedNotif();
  if (!list.includes(key)) {
    list.push(key);
    localStorage.setItem("notif_dismissed", JSON.stringify(list));
  }
  muatNotifikasi();
}
function dismissSemuaNotif() {
  const items = document.querySelectorAll("#notif-list .notif-item");
  const keys = [];
  items.forEach((item) => {
    const textEl = item.querySelector(".notif-item-text");
    if (textEl) keys.push(textEl.textContent.trim());
  });
  const list = getDismissedNotif();
  keys.forEach((k) => {
    if (!list.includes(k)) list.push(k);
  });
  localStorage.setItem("notif_dismissed", JSON.stringify(list));
  muatNotifikasi();
}
