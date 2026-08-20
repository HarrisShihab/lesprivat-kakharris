# Math Lab — Trusted Backend Decision

Status: SELECTED / IMPLEMENTATION IN PROGRESS

## Decision

Math Lab uses **Firebase Cloud Functions 2nd gen + Firebase Admin SDK** as the trusted backend.

This choice follows the existing project architecture: Firebase Authentication and Firestore are already the system of record, `functions/` already exists with `firebase-admin`, and Math Lab already has server-side evaluator code.

## Trust boundary

```text
Browser
  │
  │ answer / sessionId
  ▼
Firebase Cloud Function (trusted)
  │
  ├─ validates authenticated UID
  ├─ reads the trusted question/evaluation source
  ├─ evaluates the answer server-side
  ├─ calculates score/result
  ├─ calculates Diagnostic mastery/recommendation
  └─ writes final records with Admin SDK
       │
       ├─ mathResults
       ├─ mathDiagnosticResults
       └─ mathMastery
```

The browser may submit answers. It does **not** submit score, `isCorrect`, mastery, or recommendation as authoritative facts.

## Practice finalization

`completeMathLabPractice`:

1. authenticates the caller;
2. verifies session ownership;
3. reads the persisted session responses;
4. ignores client-provided correctness metadata;
5. re-evaluates every answer using the trusted evaluator;
6. calculates score/accuracy server-side;
7. writes a `trustStatus: "trusted"` result;
8. marks the session trusted/completed;
9. is idempotent using a deterministic result ID.

## Diagnostic finalization

`completeMathLabDiagnostic`:

1. authenticates the caller;
2. validates the 12-question trusted pilot response set;
3. evaluates answers using the server-side Diagnostic pilot;
4. generates Diagnostic Result, mastery, and recommendations;
5. writes `trustStatus: "trusted"` records using the Admin SDK;
6. updates the current `mathMastery` document;
7. is idempotent using a deterministic result ID.

## Important limitation

Code in `functions/` is not production-trusted merely because it exists in GitHub. The Firebase Functions must be deployed to the Firebase project before the production application can rely on this boundary.

Deployment is therefore a separate operational gate from code/regression testing.

## Security rule transition

The intended final state is that clients may update their own active session responses, but cannot create or modify final `mathResults` / `mathDiagnosticResults`. Only the trusted backend creates trusted final records.

Existing `client-untrusted` data is historical/provisional and must not be treated as an official academic result.
