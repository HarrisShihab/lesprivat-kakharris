"use strict";

const assert = require("assert");
const path = require("path");
const root = path.resolve(__dirname, "..");

const system = require(path.join(root, "core/question-system/index.js"));
const validator = system.validator;
const fingerprint = system.fingerprint;
const versioning = system.versioning;

const pilot = system.createPilotProvider();
const provider = pilot.provider;

function assertValidBundle(bundle) {
  const result = validator.validateQuestion(bundle.question, { evaluationSpec: bundle.evaluation });
  assert.strictEqual(result.valid, true, JSON.stringify(result.issues));
  assert.strictEqual(bundle.question.fingerprint, result.fingerprint);
  assert.ok(bundle.evaluation.evaluationId);
  assert.strictEqual(bundle.evaluation.questionId, bundle.question.questionId);
  assert.strictEqual(bundle.evaluation.questionVersion, bundle.question.version.contentVersion);
}

function testTaxonomy() {
  assert.strictEqual(pilot.taxonomy.length, 6);
  assert.ok(pilot.taxonomy.every((item) => item.educationLevel === "SMP" && item.grade === 7));
  assert.ok(pilot.taxonomy.some((item) => item.subtopicId === "plsv"));
  assert.ok(pilot.taxonomy.some((item) => item.subtopicId === "soal-cerita-aljabar"));
}

function testCurated() {
  assert.strictEqual(system.curated.records.length, 15);
  assert.strictEqual(system.curated.records.filter((entry) => entry.question.contentKind === "curated").length, 15);
  system.curated.records.forEach((entry) => {
    const q = entry.question;
    assert.ok(!Object.prototype.hasOwnProperty.call(q, "evaluation"));
    assert.ok(q.content.mathExpressions.every((expression) => typeof expression.source === "string"));
    assertValidBundle(entry);
  });
}

function testCuratedFiltering() {
  const plsv = provider.list({ topicId: "aljabar", subtopicId: "plsv" });
  assert.strictEqual(plsv.length, 2);
  assert.ok(plsv.every((q) => q.subtopicId === "plsv"));
  const published = provider.list({ status: "published" });
  assert.strictEqual(published.length, 15);
}

function testGeneratorInventory() {
  const ids = Object.values(system.generators).map((generator) => generator.id);
  assert.strictEqual(ids.length, 9);
  assert.strictEqual(new Set(ids).size, 9);
  assert.ok(ids.includes("algebra.distributive"));
  assert.ok(ids.includes("algebra.plsv-multiplication"));
  const templateIds = Object.values(system.storyTemplates).map((template) => template.id);
  assert.strictEqual(templateIds.length, 6);
  assert.strictEqual(new Set(templateIds).size, 6);
}

function testGenerators() {
  const cases = [
    ["algebra.variable-value", { x: 9, add: 4 }],
    ["algebra.coefficient-identification", { coefficient: 11, constant: 6 }],
    ["algebra.like-terms", { a: 7, b: 3 }],
    ["algebra.linear-combination", { a: 2, b: 6, c: 5, d: 1 }],
    ["algebra.plsv-addition", { x: 12, add: 8 }],
    ["algebra.linear-subtraction", { a: 8, b: 6, c: 2 }],
    ["algebra.distributive", { k: 3, a: 2, b: 4 }],
    ["algebra.plsv-multiplication", { coefficient: 4, x: 6 }],
    ["algebra.variable-difference", { x: 12, subtract: 5 }],
  ];
  for (const [id, params] of cases) {
    const bundle = provider.generate(id, params);
    assertValidBundle(bundle);
    assert.strictEqual(bundle.question.contentKind, "generated");
    assert.strictEqual(bundle.question.generation.generatorId, id);
    assert.ok(bundle.question.fingerprint.startsWith("qf_"));
    const correctId = bundle.evaluation.specification.correctOptionId;
    const correctOption = bundle.question.content.options.find((option) => option.id === correctId);
    assert.ok(correctOption, `Missing generated correct option for ${id}`);
    assert.ok(String(correctOption.label).length > 0, `Generated correct answer is empty for ${id}`);
  }
}

function testGeneratorParameterVariation() {
  const first = provider.generate("algebra.like-terms", { a: 2, b: 5 });
  const second = provider.generate("algebra.like-terms", { a: 3, b: 6 });
  assert.notStrictEqual(first.question.fingerprint, second.question.fingerprint);
  assert.notStrictEqual(first.question.content.prompt, second.question.content.prompt);
}

function testStoryTemplates() {
  const plsv = provider.generateStory("algebra.story-plsv-addition", { start: 9, difference: 6 });
  const quantity = provider.generateStory("algebra.story-multiplication", { bags: 5, perBag: 4 });
  const age = provider.generateStory("algebra.story-age", { younger: 11, difference: 4 });
  const books = provider.generateStory("algebra.story-books", { initial: 7, added: 5 });
  const price = provider.generateStory("algebra.story-price", { quantity: 3, unit: 4000 });
  const perimeter = provider.generateStory("algebra.story-perimeter", { length: 8, width: 5 });
  [plsv, quantity, age, books, price, perimeter].forEach(assertValidBundle);
  assert.strictEqual(plsv.question.contentKind, "story-template");
  assert.strictEqual(quantity.question.contentKind, "story-template");
  assert.ok(plsv.question.content.mathExpressions[0].source.includes("x + 6 = 15"));
  assert.ok(quantity.question.content.mathExpressions[0].source.includes("5x"));
  assert.ok(age.question.content.mathExpressions[0].source.includes("x + 4 = 15"));
  assert.ok(price.question.content.mathExpressions[0].source.includes("3x"));
  assert.ok(perimeter.question.content.mathExpressions[0].source.includes("2x+2y"));
}

function testVersioning() {
  assert.strictEqual(versioning.isValidVersion("1.0"), true);
  assert.strictEqual(versioning.isValidVersion("1.2"), true);
  assert.strictEqual(versioning.isValidVersion("v1"), false);
  assert.strictEqual(versioning.compareVersions("1.1", "1.0") > 0, true);
  assert.strictEqual(versioning.compareVersions("2.0", "1.9") > 0, true);
}

function testFingerprint() {
  const q = system.curated.records[10].question;
  const same = fingerprint.createFingerprint(q);
  const changed = fingerprint.createFingerprint({ ...q, content: { ...q.content, prompt: `${q.content.prompt} ` } });
  assert.strictEqual(same, q.fingerprint);
  assert.notStrictEqual(same, changed);
}

function testValidatorFailures() {
  const valid = system.curated.records[10];
  const invalid = JSON.parse(JSON.stringify(valid.question));
  invalid.content.options[0].id = invalid.content.options[1].id;
  const result = validator.validateQuestion(invalid, { evaluationSpec: valid.evaluation });
  assert.strictEqual(result.valid, false);
  assert.ok(result.issues.some((item) => item.path === "content.options"));

  const invalidGenerated = JSON.parse(JSON.stringify(valid.question));
  invalidGenerated.contentKind = "generated";
  invalidGenerated.generation.generatorId = null;
  invalidGenerated.generation.generatorVersion = null;
  const generatedResult = validator.validateQuestion(invalidGenerated, { evaluationSpec: valid.evaluation });
  assert.strictEqual(generatedResult.valid, false);
  assert.ok(generatedResult.issues.some((item) => item.path === "generation"));
}

function testQuestionSetDuplicateProtection() {
  const localProvider = system.provider.createProvider({ curated: [], generators: {
    "algebra.like-terms": system.generators.LIKE_TERMS,
  }, storyTemplates: {} });
  const set = localProvider.createQuestionSet({
    quantity: 2,
    generated: [
      { generatorId: "algebra.like-terms", params: { a: 2, b: 5 } },
      { generatorId: "algebra.like-terms", params: { a: 3, b: 5 } },
    ],
  });
  assert.strictEqual(set.length, 2);
  assert.notStrictEqual(set[0].question.fingerprint, set[1].question.fingerprint);
}

const tests = [
  ["taxonomy", testTaxonomy],
  ["curated-content", testCurated],
  ["curated-filtering", testCuratedFiltering],
  ["generator-template-inventory", testGeneratorInventory],
  ["generators", testGenerators],
  ["generator-parameter-variation", testGeneratorParameterVariation],
  ["story-templates", testStoryTemplates],
  ["versioning", testVersioning],
  ["fingerprint", testFingerprint],
  ["validator-failures", testValidatorFailures],
  ["question-set-duplicate-protection", testQuestionSetDuplicateProtection],
];

let passed = 0;
for (const [name, test] of tests) {
  try {
    test();
    console.log(`PASS ${name}`);
    passed += 1;
  } catch (error) {
    console.error(`FAIL ${name}`);
    console.error(error.stack || error);
    process.exitCode = 1;
  }
}

console.log(`${passed}/${tests.length} Question System tests passed`);
if (passed !== tests.length) process.exitCode = 1;
