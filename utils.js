// ==========================================
// UTILS.JS — Fungsi bantu shared
// Dipakai oleh: index.html, dashboard.html, ortu-dashboard.html
// ==========================================

// ---------- CACHE localStorage dengan expiry ----------
function cacheGet(key) {
  try {
    const item = JSON.parse(localStorage.getItem("cache_" + key));
    if (item && Date.now() < item.expiry) return item.data;
  } catch (e) {
    /* ignore */
  }
  return null;
}

function cacheSet(key, data, ttlMs) {
  try {
    localStorage.setItem("cache_" + key, JSON.stringify({ data: data, expiry: Date.now() + ttlMs }));
  } catch (e) {
    /* ignore quota */
  }
}

function cacheRemove(key) {
  try {
    localStorage.removeItem("cache_" + key);
  } catch (e) {
    /* ignore */
  }
}

// ---------- OUTPUT SAFETY ----------
function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ---------- TOAST NOTIFICATION ----------
function showToast(message, type) {
  let container = document.querySelector(".toast-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "toast-container";
    container.style.cssText = "position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:8px;max-width:400px";
    document.body.appendChild(container);
  }
  const toast = document.createElement("div");
  const colors = {
    success: "bg-emerald-600",
    error: "bg-red-600",
    info: "bg-blue-600",
    warning: "bg-amber-500",
  };
  const icons = {
    success: "fa-circle-check",
    error: "fa-circle-xmark",
    info: "fa-circle-info",
    warning: "fa-triangle-exclamation",
  };
  toast.className = `${colors[type] || "bg-slate-700"} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3 animate-in slide-in-from-right`;
  const icon = document.createElement("i");
  icon.className = `fa-solid ${icons[type] || "fa-circle-info"}`;
  const text = document.createElement("span");
  text.textContent = String(message ?? "");
  toast.append(icon, text);
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.transition = "opacity 0.3s, transform 0.3s";
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// ---------- FORMAT RUPIAH ----------
function formatRupiah(angka) {
  return "Rp " + Number(angka).toLocaleString("id-ID");
}

// ---------- FORMAT TANGGAL ----------
function formatTanggal(dateStr) {
  if (!dateStr) return "-";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { year: "numeric", month: "long", day: "numeric" });
  } catch (e) {
    return dateStr;
  }
}

// ---------- LOADING SPINNER UTILITY ----------
function setLoading(btn, isLoading, text) {
  if (!btn) return;
  if (isLoading) {
    btn.disabled = true;
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> ${text || "Memproses..."}`;
  } else {
    btn.disabled = false;
    btn.innerHTML = btn.dataset.originalText || text || "Simpan";
  }
}
