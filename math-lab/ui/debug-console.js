(function (root) {
  "use strict";
  if (typeof document === "undefined" || document.body?.dataset?.portalRole !== "murid") return;
  const params = new URLSearchParams(root.location?.search || "");
  if (params.get("debug") !== "1") return;

  const MAX = 120;
  const logs = [];
  let copied = false;

  function safe(value) {
    try {
      if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack };
      if (typeof value === "string") return value;
      return JSON.parse(JSON.stringify(value));
    } catch (_) { return String(value); }
  }

  function add(level, message, detail) {
    logs.push({
      time: new Date().toISOString(),
      level,
      message: String(message || ""),
      detail: detail === undefined ? undefined : safe(detail),
    });
    if (logs.length > MAX) logs.shift();
    render();
  }

  function snapshot() {
    const ids = [
      "math-lab-status", "math-lab-setup", "math-lab-practice", "math-lab-result",
      "math-lab-result-score", "math-lab-result-summary", "math-lab-result-trust",
      "math-lab-finish", "math-lab-history-list", "math-lab-refresh-history"
    ];
    const elements = {};
    ids.forEach((id) => {
      const el = document.getElementById(id);
      elements[id] = el ? { found: true, text: (el.textContent || "").trim().slice(0, 160), hidden: el.classList.contains("math-lab-hidden") } : { found: false };
    });
    return {
      url: root.location?.href || "",
      readyState: document.readyState,
      online: navigator.onLine,
      userAgent: navigator.userAgent,
      portalRole: document.body?.dataset?.portalRole || null,
      firebase: {
        loaded: !!root.firebase,
        apps: Array.isArray(root.firebase?.apps) ? root.firebase.apps.length : null,
        uid: root.firebase?.auth?.().currentUser?.uid || null,
      },
      elements,
    };
  }

  function exportText() {
    return [
      "KAK HARRIS MATH LAB DEBUG",
      `Captured: ${new Date().toISOString()}`,
      "",
      JSON.stringify(snapshot(), null, 2),
      "",
      "EVENTS:",
      ...logs.map((item) => JSON.stringify(item)),
    ].join("\n");
  }

  async function copyLogs() {
    const text = exportText();
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch (_) {
      const area = document.createElement("textarea");
      area.value = text;
      area.style.position = "fixed";
      area.style.left = "-9999px";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      area.remove();
      copied = true;
    }
    render();
  }

  function render() {
    const box = document.getElementById("kh-debug-console");
    if (!box) return;
    const out = box.querySelector("pre");
    if (out) out.textContent = exportText();
    const count = box.querySelector("[data-count]");
    if (count) count.textContent = `${logs.length} event${logs.length === 1 ? "" : "s"}${copied ? " · copied" : ""}`;
  }

  function mount() {
    if (document.getElementById("kh-debug-console")) return;
    const box = document.createElement("section");
    box.id = "kh-debug-console";
    box.style.cssText = "position:fixed;z-index:2147483647;left:10px;right:10px;bottom:10px;background:#0f172a;color:#e2e8f0;border:1px solid #334155;border-radius:12px;padding:12px;box-shadow:0 10px 30px rgba(0,0,0,.35);font:12px/1.45 monospace;max-height:45vh;display:flex;flex-direction:column;gap:8px;";
    box.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><strong>Math Lab Debug</strong><span data-count>0 events</span></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button type="button" data-copy style="border:0;border-radius:8px;padding:7px 10px;background:#2563eb;color:#fff;font-weight:700">Salin Debug</button><button type="button" data-refresh style="border:0;border-radius:8px;padding:7px 10px;background:#334155;color:#fff">Refresh Snapshot</button><button type="button" data-clear style="border:0;border-radius:8px;padding:7px 10px;background:#475569;color:#fff">Clear</button></div><pre style="margin:0;white-space:pre-wrap;overflow:auto;max-height:30vh"></pre>';
    document.body.appendChild(box);
    box.querySelector("[data-copy]")?.addEventListener("click", copyLogs);
    box.querySelector("[data-refresh]")?.addEventListener("click", () => { add("INFO", "Manual snapshot", snapshot()); });
    box.querySelector("[data-clear]")?.addEventListener("click", () => { logs.length = 0; copied = false; render(); });
    add("INFO", "Debug console aktif", snapshot());
  }

  const originalError = root.console?.error?.bind(root.console);
  if (root.console?.error) root.console.error = function (...args) { add("CONSOLE_ERROR", args.map((x) => typeof x === "string" ? x : safe(x)).join(" ")); originalError?.(...args); };
  root.addEventListener?.("error", (event) => add("WINDOW_ERROR", event.message || "Script error", { source: event.filename, line: event.lineno, column: event.colno, error: event.error }));
  root.addEventListener?.("unhandledrejection", (event) => add("UNHANDLED_REJECTION", event.reason?.message || String(event.reason || "Promise rejection"), event.reason));

  root.KakHarrisMathLab = root.KakHarrisMathLab || {};
  root.KakHarrisMathLab.debug = Object.freeze({ log: add, snapshot, exportText });

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", mount, { once: true });
  else mount();
})(typeof globalThis !== "undefined" ? globalThis : this);
