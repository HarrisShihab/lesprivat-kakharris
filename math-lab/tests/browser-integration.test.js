"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const rootPath = path.resolve(__dirname, "..");

function loadUmd(context, relativePath) {
  const file = path.join(rootPath, relativePath);
  vm.runInContext(fs.readFileSync(file, "utf8"), context, { filename: relativePath });
}

function createHarness() {
  const root = { console, setTimeout, clearTimeout, Intl, JSON };
  root.globalThis = root;
  root.window = root;
  root.KakHarrisMathLab = undefined;
  const elements = {};
  class ClassList { toggle() {} add() {} remove() {} }
  class Element {
    constructor(id) {
      this.id = id;
      this.innerHTML = "";
      this.textContent = "";
      this.value = "";
      this.disabled = false;
      Object.defineProperty(this, "options", { get: () => ({ length: (this.innerHTML.match(/<option\b/g) || []).length }) });
      this.className = "";
      this.classList = new ClassList();
    }
    addEventListener() {}
    setAttribute() {}
    removeAttribute() {}
    focus() {}
  }
  root.document = {
    getElementById(id) {
      if (!elements[id]) elements[id] = new Element(id);
      return elements[id];
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
    createElement() { return new Element(""); },
  };
  ["math-lab-level", "math-lab-grade", "math-lab-topic", "math-lab-subtopic", "math-lab-status", "math-lab-history-list",
    "math-lab-start", "math-lab-submit", "math-lab-prev", "math-lab-next", "math-lab-finish", "math-lab-new", "math-lab-refresh-history"]
    .forEach((id) => root.document.getElementById(id));
  root.CustomEvent = class CustomEvent { constructor(type, init) { this.type = type; this.detail = init?.detail; } };
  root.addEventListener = () => {};
  root.removeEventListener = () => {};
  root.dispatchEvent = () => {};
  return { root, elements };
}

function loadQuestionSystemIntoBrowserLikeContext(context) {
  const files = [
    "core/contracts/question.js",
    "core/contracts/taxonomy.js",
    "core/contracts/math-renderer.js",
    "core/contracts/evaluation.js",
    "core/contracts/session.js",
    "core/contracts/result.js",
    "core/question-system/fingerprint.js",
    "core/question-system/versioning.js",
    "core/question-system/question-factory.js",
    "core/question-system/validator.js",
    "content/pilot/algebra-curated.js",
    "content/pilot/algebra-taxonomy.js",
    "core/question-system/generators.js",
    "core/question-system/story-templates.js",
    "core/question-system/provider.js",
    "core/question-system/index.js",
  ];
  files.forEach((file) => loadUmd(context, file));
}

async function testBrowserDependencyLifecycle() {
  const { root } = createHarness();
  const context = vm.createContext(root);
  loadQuestionSystemIntoBrowserLikeContext(context);

  const questionSystem = root.KakHarrisMathLab.questionSystem;
  assert.ok(questionSystem?.createPilotProvider, "browser global must expose createPilotProvider");
  assert.deepStrictEqual(questionSystem.getTaxonomy().length, 6);

  root.KakHarrisMathLab.firestore = {
    practicePersistence: { createPersistence: () => ({ listHistory: async () => [] }) },
  };
  loadUmd(context, "ui/student-math-lab.js");
  await root.KakHarrisMathLab.studentUI.init({
    profile: { uid: "browser-test" },
    student: { jenjang: "SMP", kelas: "7" },
    questionSystem,
  });

  const debug = root.KakHarrisMathLab.studentUI.getDebugState();
  assert.strictEqual(debug.questionSystemAvailable, true);
  assert.strictEqual(debug.taxonomyLength, 6);
  assert.strictEqual(debug.selectorOptions["math-lab-level"], 1);
  assert.strictEqual(debug.selectorOptions["math-lab-grade"], 1);
  assert.strictEqual(debug.selectorOptions["math-lab-topic"], 1);
  assert.strictEqual(debug.selectorOptions["math-lab-subtopic"], 7);
}

function testHtmlUsesSingleBrowserEntry() {
  const html = fs.readFileSync(path.join(rootPath, "..", "murid-dashboard.html"), "utf8");
  assert.match(html, /<script type="module" src="math-lab\/core\/question-system\/browser\.js"><\/script>/);
}

(async () => {
  try {
    await testBrowserDependencyLifecycle();
    console.log("PASS browser-dependency-lifecycle");
    testHtmlUsesSingleBrowserEntry();
    console.log("PASS browser-entry-script");
    console.log("2/2 browser integration tests passed");
  } catch (error) {
    console.error("FAIL browser integration");
    console.error(error.stack || error);
    process.exitCode = 1;
  }
})();
