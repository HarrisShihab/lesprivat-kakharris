const assert = require('assert');
const fs = require('fs');
const rules = fs.readFileSync('firestore.rules', 'utf8');

assert.match(rules, /match \/mathSessions\/\{sessionId\}/);
assert.match(rules, /match \/mathResults\/\{resultId\}/);
assert.match(rules, /request\.auth\.uid == request\.resource\.data\.ownerUid/);
assert.match(rules, /request\.auth\.uid;[\s\S]*mathSessions/);
assert.match(rules, /request\.resource\.data\.trustStatus == "client-untrusted"/);
assert.match(rules, /allow update, delete: if false;/);
assert.match(rules, /match \/mathEvaluations\/\{docId\}/);
assert.match(rules, /match \/mathMastery\/\{docId\}/);
assert.match(rules, /match \/mathTaxonomy\/\{docId\}/);
console.log('Firestore rules static security contract tests: 9/9 passed');
