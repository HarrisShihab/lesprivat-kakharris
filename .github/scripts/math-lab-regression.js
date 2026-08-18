"use strict";

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const repoRoot = path.resolve(__dirname, "../..");
const testsDir = path.join(repoRoot, "math-lab", "tests");

const tests = fs.readdirSync(testsDir)
  .filter((name) => name.endsWith(".test.js"))
  .sort()
  .map((name) => path.join(testsDir, name));

if (tests.length === 0) {
  console.error("No Math Lab test files found.");
  process.exit(1);
}

let failed = 0;

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

if (failed > 0) process.exit(1);
