window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA2BVsutEZOJmh3-aBUoPBjJeVmJ2YO7cQ",
  authDomain: "les-privat-kak-harris.firebaseapp.com",
  projectId: "les-privat-kak-harris",
  storageBucket: "les-privat-kak-harris.firebasestorage.app",
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
if (document?.body?.dataset?.portalRole === "murid") {
  const script = document.createElement("script");
  script.src = "math-lab/ui/diagnostic-student-presentation.js?v=64c0c94";
  script.defer = true;
  document.head.appendChild(script);

  const finishFix = document.createElement("script");
  finishFix.src = "math-lab/ui/practice-finish-fix.js?v=597b44e";
  finishFix.defer = true;
  document.head.appendChild(finishFix);

  // Diagnostic console is opt-in only: /murid-dashboard.html?debug=1
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") {
    const debugScript = document.createElement("script");
    debugScript.src = "math-lab/ui/debug-console.js?v=54ef1ab";
    debugScript.defer = true;
    document.head.appendChild(debugScript);
  }
}
