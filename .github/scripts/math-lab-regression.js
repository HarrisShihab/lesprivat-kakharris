"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../..");
const mathLabDir = path.join(repoRoot, "math-lab");
const testsDir = path.join(mathLabDir, "tests");

const requiredTests = [
  "admin-math-lab.test.js",
  "admin-practice-flow.test.js",
  "admin-result-history.test.js",
  "admin-security-boundary.test.js",
];

const tests = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => path.join(testsDir, "tests", name));

if (tests.length === 0) {
  console.error("No Math Lab test files found.");
  process.exit(1);
}

const missingRequired = requiredTests.filter((name) => !fs.existsSync(path.join(testsDir, name)));
if (missingRequired.length > 0) {
  console.error(`Missing required Phase 9 tests: ${missingRequired.join(", ")}`);
  process.exit(1);
}

const sourceFiles = [];
function collectJavaScriptFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectJavaScriptFiles(fullPath);
    else if (entry.isFile() && fullPath.endsWith(".js")) sourceFiles.push(fullPath);
  }
}
collectJavaScriptFiles(mathLabDir);

let failed = 0;

for (const source of sourceFiles.sort()) {
  const relative = path.relative(repoRoot, source);
  const result = spawnSync(process.execPath, ["--check", source], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
  });

  if (result.error || result.status !== 0) {
    failed += 1;
    console.error(`SYNTAX FAILED: ${relative}`);
  }
}

for (const test of tests) {
  const relative = path.relative(repoRoot, test);
  console.log(`\n=== ${relative} ===`);

  const result = spawnSync(process.execPath, [test], {
    cwd: repoRoot,
    stdio: "inherit",
    shell: false,
  });

  if (result.error) {
    console.error(`Runner error: ${result.error.message}`);
    failed += 1;
    continue;
  }

  if (result.status !== 0) {
    failed += 1;
    console.error(`FAILED: ${relative} (exit ${result.status})`);
  }
}

console.log(`\nMath Lab regression: ${tests.length - failed}/${tests.length} test files passed.`);
console.log(`Math Lab syntax check: ${sourceFiles.length} JavaScript files checked.`);
console.log(`Phase 9 required tests: ${requiredTests.length}/${requiredTests.length} present.`);

if (failed > 0) process.exit(1);
