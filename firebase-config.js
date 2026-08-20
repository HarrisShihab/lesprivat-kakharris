window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA2BVsutEZOJmh3-aBUoPBjJeVmJ2YO7cQ",
  authDomain: "les-privat-kak-harris.firebaseapp.com",
  projectId: "les-privat-kak-harris",
  storageBucket: "lesprivat-kakharris.firebasestorage.app",
  messagingSenderId: "204257135435",
  appId: "1:204257135435:web:8b36821ba9a8bc1127f6ce",
  measurementId: "G-4F2C2VGSTT",
};

// Username tanpa tanda @ akan diubah menjadi alamat internal berikut.
// Nilai ini harus sama dengan tools/migration-config.json.
window.FIREBASE_USERNAME_DOMAIN = "akun.lesprivat-kakharris.id";

// P3 student-facing presentation layer. Trust metadata remains in persistence,
// but architecture-only labels are removed from the student's UI.
// Query version memaksa browser mengambil implementation terbaru setelah fix.
// Deployment trigger: redeploy main after Math Lab P4 finish-handler fix.
if (document?.body?.dataset?.portalRole === "murid") {
  const script = document.createElement("script");
  script.src = "math-lab/ui/diagnostic-student-presentation.js?v=64c0c94";
  script.defer = true;
  document.head.appendChild(script);

  // Diagnostic console is opt-in only: /murid-dashboard.html?debug=1
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") {
    const debugScript = document.createElement("script");
    debugScript.src = "math-lab/ui/debug-console.js?v=fdc82f27";
    debugScript.defer = true;
    document.head.appendChild(debugScript);
  }

  const finishFix = document.createElement("script");
  finishFix.src = "math-lab/ui/practice-finish-fix.js?v=0ddad03";
  finishFix.defer = true;
  document.head.appendChild(finishFix);

  // Practice history presentation: preserve and display Firestore createdAt
  // even when the shared persistence layer returns a JSON-cloned Timestamp.
  const practiceHistory = document.createElement("script");
  practiceHistory.src = "math-lab/ui/practice-history-presentation.js?v=597f3d69";
  practiceHistory.defer = true;
  document.head.appendChild(practiceHistory);
}

// Admin My Learning uses the same shared Practice UI/engine. Debug is opt-in only.
if (document?.body?.dataset?.portalRole === "admin") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") {
    const debugScript = document.createElement("script");
    debugScript.src = "math-lab/ui/debug-console.js?v=fdc82f27";
    debugScript.defer = true;
    document.head.appendChild(debugScript);
  }
}
