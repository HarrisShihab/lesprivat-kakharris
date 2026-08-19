const assert = require('assert');
const fs = require('fs');
const rules = fs.readFileSync('firestore.rules', 'utf8');
assert.match(rules, /mathDiagnosticResults/);
assert.match(rules, /ownerUid/);
console.log('diagnostic persistence rules contract PASS');
