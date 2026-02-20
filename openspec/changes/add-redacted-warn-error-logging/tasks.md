## 1. Logging foundation and redaction utilities

- [ ] 1.1 Define a shared warn/error log metadata shape in the logger layer (`event`, `request`, `response`, `timing`, `error`) and expose typed helpers for structured logging.
- [ ] 1.2 Implement a reusable redaction utility that recursively masks sensitive keys (`password`, `token`, `authorization`, `cookie`, `secret`, etc.) in nested objects/arrays.
- [ ] 1.3 Add unit tests for the redaction utility, including nested payloads, array values, and mixed-case key names.
- [ ] 1.4 Integrate redaction into logger warn/error helper paths so all warn/error metadata is sanitized before emission.

## 2. HTTP request lifecycle warn/error logging

- [ ] 2.1 Add request context middleware to capture/propagate `requestId` (`x-request-id`), method, path, query, client info, and request start time.
- [ ] 2.2 Add completion logging logic to emit `warn` for 4xx and `error` for 5xx with request/response context and `durationMs`.
- [ ] 2.3 Ensure request context middleware is registered in app bootstrap before route handlers so all modules participate.
- [ ] 2.4 Add tests verifying request ID propagation/generation and duration presence on warn/error logs.

## 3. Global error handling integration

- [ ] 3.1 Refactor global error middleware to emit structured error/warn logs with mapped status, response code/message, and sanitized context.
- [ ] 3.2 Ensure unhandled exceptions that return 500 always produce an `error` log entry with error name/message and stack (when available).
- [ ] 3.3 Prevent duplicate/conflicting error logs between middleware completion logging and global error logging paths.
- [ ] 3.4 Add/extend integration tests for 500 flows to verify logs are emitted with sanitized metadata and correlation fields.

## 4. Validation, hardening, and documentation

- [ ] 4.1 Add regression tests proving sensitive values (passwords/tokens/authorization headers/cookies) never appear in warn/error log output.
- [ ] 4.2 Validate that existing success/info logging behavior remains unchanged and that query logging still works as expected.
- [ ] 4.3 Document the new logging contract and redaction policy for backend contributors (fields logged, redacted keys, and request ID behavior).
- [ ] 4.4 Run backend test suites for logger/middleware/error handling paths and fix any failures before marking the change implementation-ready.
