window.FIREBASE_CONFIG = {
  apiKey: "AIzaSyA2BVsutEZOJmh3-aBUoPBjJeVmJ2YO7cQ",
  authDomain: "les-privat-kak-harris.firebaseapp.com",
  projectId: "les-privat-kak-harris",
  storageBucket: "lesprivat-kakharris.firebasestorage.app",
  messagingSenderId: "204257135435",
  appId: "1:204257135435:web:8b36821ba9a8bc1127f6ce",
  measurementId: "G-4F2C2VGSTT",
};

window.FIREBASE_USERNAME_DOMAIN = "akun.lesprivat-kakharris.id";

if (document?.body?.dataset?.portalRole === "murid") {
  const script = document.createElement("script");
  script.src = "math-lab/ui/diagnostic-student-presentation.js?v=64c0c94";
  script.defer = true;
  document.head.appendChild(script);

  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") {
    const debugScript = document.createElement("script");
    debugScript.src = "math-lab/ui/debug-console.js?v=fdc82f27";
    debugScript.defer = true;
    document.head.appendChild(debugScript);
  }

  // Final Practice Result is now verified and persisted by the trusted backend.
  const trustedFinish = document.createElement("script");
  trustedFinish.src = "math-lab/ui/trusted-practice-finish.js?v=1";
  trustedFinish.defer = true;
  document.head.appendChild(trustedFinish);

  const practiceHistory = document.createElement("script");
  practiceHistory.src = "math-lab/ui/practice-history-presentation.js?v=2578ee91";
  practiceHistory.defer = true;
  document.head.appendChild(practiceHistory);
}

if (document?.body?.dataset?.portalRole === "admin") {
  const params = new URLSearchParams(window.location.search);
  if (params.get("debug") === "1") {
    const debugScript = document.createElement("script");
    debugScript.src = "math-lab/ui/debug-console.js?v=fdc82f27";
    debugScript.defer = true;
    document.head.appendChild(debugScript);
  }

  // Admin My Learning uses the same trusted Practice finalization path.
  const trustedFinish = document.createElement("script");
  trustedFinish.src = "math-lab/ui/trusted-practice-finish.js?v=1";
  trustedFinish.defer = true;
  document.head.appendChild(trustedFinish);

  const practiceHistory = document.createElement("script");
  practiceHistory.src = "math-lab/ui/practice-history-presentation.js?v=2578ee91";
  practiceHistory.defer = true;
  document.head.appendChild(practiceHistory);
}
