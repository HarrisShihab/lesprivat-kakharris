# Phase 12 — P4–P8 Pilot QA

Baseline: `main` / `40b97dd7`

Phase 12 is QA-only. No new feature work is introduced by this document. No merge/closure is permitted while an important acceptance criterion is not `PASS`.

## P4 — Practice ulang dari hasil Diagnostic

Acceptance:

- Diagnostic result is available to the authenticated student.
- Student can return to Math Lab from the diagnostic result.
- Student can start Practice again after Diagnostic.
- Practice starts with the trusted boundary and returns exactly 10 questions.
- Practice result/history remains isolated from the diagnostic result.
- No internal evaluation specification or trust metadata is exposed in the student-facing presentation.

Status: `NOT VERIFIABLE` — requires authenticated browser execution.

## P5 — Admin / My Learning

Acceptance:

- Admin can enter My Learning.
- Admin can start Practice using the same Math Lab engine.
- Admin receives a normal Practice result/history flow.
- Admin UI does not expose the student-only evaluation specification.
- Admin path does not alter Game System behavior.

Status: `NOT VERIFIABLE` — requires authenticated admin browser execution; static test coverage exists in repository.

## P6 — Public → Login → Murid

Acceptance:

- Public can enter the limited Math Lab Practice without login.
- Public flow does not create permanent private student history.
- Login CTA/path works.
- After login, the user reaches the authenticated Murid Math Lab.
- Authenticated Practice remains available after the transition.

Status: `NOT VERIFIABLE` — requires production browser execution and authentication state changes.

## P7 — Full vertical regression

Target flow:

```text
Public
→ Practice
→ Login
→ Murid Practice
→ Diagnostic
→ Result
→ Mastery
→ Recommendation
→ Practice ulang
```

Secondary flow:

```text
Admin
→ My Learning
→ Practice
→ Result
```

Acceptance:

- No blocker appears in either flow.
- Existing Game System remains functional.
- No cross-user data is visible.
- No evaluation specification leaks to the client-facing UI.

Status: `NOT VERIFIABLE` — requires production browser execution after P4–P6 manual gates pass.

## P8 — Final acceptance

P8 may become `PASS` only when:

1. P4 = PASS
2. P5 = PASS
3. P6 = PASS
4. P7 = PASS
5. Automated regression is green.
6. No unresolved acceptance-blocking defect remains.
7. Trusted Backend status remains explicitly documented and is not overstated as production-trusted merely because Firestore Rules exist.

Status: `BLOCKED` — upstream manual gates are not yet verifiable in this environment.

## Merge gate

Do not merge or close Phase 12 until P4–P8 satisfy the acceptance conditions above.