"use strict";

if (!process.env.FIRESTORE_EMULATOR_HOST) {
  console.log("SKIP Firestore Emulator security test: emulator is not running.");
  process.exit(0);
}

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { initializeTestEnvironment, assertSucceeds, assertFails } = require("@firebase/rules-unit-testing");
const { doc, setDoc, getDoc, updateDoc, deleteDoc } = require("firebase/firestore");

const root = path.resolve(__dirname, "../..");

(async () => {
  const env = await initializeTestEnvironment({
    projectId: "demo-math-lab",
    firestore: { rules: fs.readFileSync(path.join(root, "firestore.rules"), "utf8") },
  });

  try {
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      await setDoc(doc(db, "users/alice"), { aktif: true, role: "murid", muridIds: ["alice"] });
      await setDoc(doc(db, "users/bob"), { aktif: true, role: "murid", muridIds: ["bob"] });
      await setDoc(doc(db, "mathSessions/session-alice"), {
        contractVersion:"1.0",sessionId:"session-alice",ownerUid:"alice",sessionType:"practice",educationLevel:"SMP",grade:7,phase:"D",subject:"matematika",topicId:"aljabar",subtopicId:null,questionRefs:["alg-cur-001"],questionVersions:{"alg-cur-001":"1.0"},currentIndex:0,status:"active",trustStatus:"client-untrusted",responses:[]
      });
      await setDoc(doc(db, "mathResults/result-alice"), {
        contractVersion:"1.0",resultId:"result-alice",sessionId:"session-alice",ownerUid:"alice",sessionType:"practice",educationLevel:"SMP",grade:7,phase:"D",subject:"matematika",topicId:"aljabar",score:50,accuracy:0.5,correctCount:1,wrongCount:1,totalQuestions:2,responses:[],trustStatus:"client-untrusted"
      });
      await setDoc(doc(db, "mathDiagnosticResults/diagnostic-alice"), {
        contractVersion:"1.0",resultId:"diagnostic-alice",sessionId:"diag-alice",ownerUid:"alice",sessionType:"diagnostic",diagnosticSummary:{score:50},mastery:[],recommendations:[],responses:[],trustStatus:"client-untrusted"
      });
      await setDoc(doc(db, "mathEvaluations/eval-private"), { specification:{correctOptionId:"opt-1"} });
    });

    const alice=env.authenticatedContext("alice").firestore();
    const bob=env.authenticatedContext("bob").firestore();
    const anonymous=env.unauthenticatedContext().firestore();

    assert.ok((await assertSucceeds(getDoc(doc(alice,"mathSessions/session-alice")))).exists());
    assert.ok((await assertSucceeds(getDoc(doc(alice,"mathDiagnosticResults/diagnostic-alice")))).exists());
    await assertFails(getDoc(doc(bob,"mathSessions/session-alice")));
    await assertFails(updateDoc(doc(bob,"mathSessions/session-alice"),{status:"completed"}));
    await assertFails(getDoc(doc(bob,"mathDiagnosticResults/diagnostic-alice")));
    await assertFails(updateDoc(doc(alice,"mathDiagnosticResults/diagnostic-alice"),{diagnosticSummary:{score:100}}));
    await assertFails(deleteDoc(doc(alice,"mathResults/result-alice")));
    await assertFails(deleteDoc(doc(alice,"mathDiagnosticResults/diagnostic-alice")));
    await assertFails(getDoc(doc(alice,"mathEvaluations/eval-private")));
    await assertFails(getDoc(doc(anonymous,"mathSessions/session-alice")));
    await assertFails(setDoc(doc(anonymous,"mathDiagnosticResults/anonymous-write"),{ownerUid:null,sessionType:"diagnostic",diagnosticSummary:{},mastery:[],recommendations:[],trustStatus:"client-untrusted"}));

    console.log("PASS Firestore Emulator security boundary");
    console.log("PASS owner isolation");
    console.log("PASS result immutability");
    console.log("PASS diagnostic result isolation");
    console.log("PASS private evaluation collection denial");
    console.log("PASS anonymous persistence denial");
  } finally { await env.cleanup(); }
})().catch((error)=>{console.error(error);process.exitCode=1;});
