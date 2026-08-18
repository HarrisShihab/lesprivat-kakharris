"use strict";

const assert = require("assert");
const rendererModule = require("../core/math-renderer/math-renderer.js");
const loader = require("../core/math-renderer/katex-loader.js");

const fakeKatex = {
  renderToString(source, options) {
    assert.strictEqual(options.throwOnError, true);
    assert.strictEqual(options.trust, false);
    assert.strictEqual(options.strict, "warn");
    assert.strictEqual(options.maxExpand, 1000);
    return `<span class="katex-mock">${source}</span>`;
  },
};

function testSupportedPilotExpressions() {
  const expressions = [
    "x",
    "3x + 5",
    "x^2 + 2x + 1",
    "\\frac{3}{4}",
    "\\sqrt{x + 2}",
    "2x + 3 = 9",
    "2x - 3 \\le 7",
    "\\begin{aligned}2x+y &= 7\\\\x-y &= 1\\end{aligned}",
  ];

  expressions.forEach((source) => {
    const validation = rendererModule.validateSource(source);
    assert.strictEqual(validation.valid, true, `Expected valid source: ${source}`);
  });
}

function testBlockedCommands() {
  const blocked = [
    "\\htmlClass{danger}{x}",
    "\\href{https://example.com}{x}",
    "\\includegraphics{image.png}",
    "\\color{red}{x}",
    "\\def\\foo{x}\\foo",
  ];

  blocked.forEach((source) => {
    const validation = rendererModule.validateSource(source);
    assert.strictEqual(validation.valid, false, `Expected blocked source: ${source}`);
  });
}

function testUnknownCommand() {
  const validation = rendererModule.validateSource("\\unknowncommand{x}");
  assert.strictEqual(validation.valid, false);
  assert.match(validation.reason, /Unsupported TeX command/);
}

function testUnbalancedSource() {
  assert.strictEqual(rendererModule.validateSource("\\frac{1}{2").valid, false);
  assert.strictEqual(rendererModule.validateSource("\\begin{aligned}x=1").valid, false);
  assert.strictEqual(rendererModule.validateSource("\\begin{matrix}x\\end{matrix}").valid, false);
}

function testLengthAndControlCharacters() {
  const longSource = "x".repeat(rendererModule.MAX_SOURCE_LENGTH + 1);
  assert.strictEqual(rendererModule.validateSource(longSource).valid, false);
  assert.strictEqual(rendererModule.validateSource("x\u0000+1").valid, false);
  assert.strictEqual(rendererModule.validateSource("<img src=x>").valid, false);
}

function testRenderSuccess() {
  const renderer = rendererModule.createRenderer({ katex: fakeKatex });
  const result = renderer.renderSync("\\frac{3}{4}");
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.fallback, false);
  assert.match(result.html, /katex-mock/);
}

async function testAsyncRenderSuccess() {
  const renderer = rendererModule.createRenderer({ katex: fakeKatex });
  const result = await renderer.render("x^2 + 1");
  assert.strictEqual(result.ok, true);
  assert.strictEqual(result.fallback, false);
}

async function testFallbackOnValidationFailure() {
  const renderer = rendererModule.createRenderer({ katex: fakeKatex });
  const result = await renderer.render("\\href{https://example.com}{x}", {
    fallbackText: "Persamaan tidak dapat ditampilkan.",
  });
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.fallback, true);
  assert.strictEqual(result.text, "Persamaan tidak dapat ditampilkan.");
}

async function testFallbackOnKatexFailure() {
  const brokenKatex = {
    renderToString() {
      throw new Error("parse failure");
    },
  };
  const renderer = rendererModule.createRenderer({ katex: brokenKatex });
  const result = await renderer.render("x + 1");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(result.fallback, true);
  assert.match(result.error, /parse failure/);
  assert.strictEqual(result.text, "x + 1");
}

async function testRenderToElementFallback() {
  const renderer = rendererModule.createRenderer({ katex: fakeKatex });
  const element = {};
  const result = await renderer.renderToElement(element, "\\unknown{x}");
  assert.strictEqual(result.ok, false);
  assert.strictEqual(element.innerHTML, undefined);
  assert.strictEqual(element.textContent, "\\unknown{x}");
}

function testLoaderConfiguration() {
  assert.strictEqual(loader.KATEX_VERSION, "0.18.1");
  assert.match(loader.KATEX_SCRIPT_URL, /katex@0\.18\.1\/dist\/katex\.min\.js$/);
  assert.match(loader.KATEX_CSS_URL, /katex@0\.18\.1\/dist\/katex\.min\.css$/);
}

async function testLoaderUsesExistingKatex() {
  const links = [];
  const documentObject = {
    head: { appendChild(node) { links.push(node); } },
    getElementById() { return null; },
    createElement() { return {}; },
  };
  const globalObject = { katex: fakeKatex };
  const katex = await loader.load({ globalObject, documentObject });
  assert.strictEqual(katex, fakeKatex);
  assert.strictEqual(links.length, 1);
  assert.strictEqual(links[0].rel, "stylesheet");
  assert.match(links[0].href, /katex@0\.18\.1\/dist\/katex\.min\.css$/);
}

async function main() {
  const tests = [
    ["supported-pilot-expressions", testSupportedPilotExpressions],
    ["blocked-commands", testBlockedCommands],
    ["unknown-command", testUnknownCommand],
    ["unbalanced-source", testUnbalancedSource],
    ["length-and-control-characters", testLengthAndControlCharacters],
    ["render-success", testRenderSuccess],
    ["async-render-success", testAsyncRenderSuccess],
    ["fallback-validation", testFallbackOnValidationFailure],
    ["fallback-katex-error", testFallbackOnKatexFailure],
    ["render-to-element-fallback", testRenderToElementFallback],
    ["loader-configuration", testLoaderConfiguration],
    ["loader-existing-katex", testLoaderUsesExistingKatex],
  ];

  let passed = 0;
  for (const [name, test] of tests) {
    try {
      await test();
      console.log(`PASS ${name}`);
      passed += 1;
    } catch (error) {
      console.error(`FAIL ${name}`);
      console.error(error.stack || error);
      process.exitCode = 1;
    }
  }

  console.log(`${passed}/${tests.length} MathRenderer tests passed`);
  if (passed !== tests.length) process.exitCode = 1;
}

main();
