# Math Lab Trusted Evaluation Boundary

This directory is reserved for the trusted evaluation backend boundary planned for Phase 11.

The implementation must:
- authenticate the caller;
- accept only presentation-safe submission identifiers and the student's answer;
- resolve evaluation specifications server-side;
- never return evaluation specifications or answer keys to the client;
- preserve `client-untrusted` for client-originated persisted results until a separate trusted-result contract is established.

Phase 11 does not introduce assessment, analytics, mastery, tutor assignment, or new question content.
