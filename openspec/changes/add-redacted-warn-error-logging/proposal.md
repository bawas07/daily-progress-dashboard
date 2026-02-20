## Why

The backend currently logs database queries but does not reliably capture enough context when requests fail with 500 errors. This makes production debugging slow and uncertain, especially when the original request/response context is missing.

## What Changes

- Add structured backend logging for all `warn` and `error` events, including request context and response outcome.
- Ensure unhandled exceptions and 5xx responses are always logged with correlation metadata (request ID, route, method, status, latency).
- Add payload redaction so sensitive fields (for example passwords, tokens, and secrets) are masked before being written to logs.
- Standardize log shape across middleware and global error handling to make searching and alerting easier.
- Add automated tests for redaction and error logging behavior.

## Capabilities

### New Capabilities
- `backend-redacted-error-logging`: Structured warn/error logging with request-response context and sensitive-field redaction for safe debugging.

### Modified Capabilities
- None.

## Impact

- Affected backend systems: HTTP middleware, global error handler, logger configuration/utilities, and shared response/error pipeline.
- Affected runtime behavior: warn/error logs become richer and consistent, with sensitive fields redacted by default.
- Affected quality controls: new/updated backend tests to verify logging on 5xx paths and redaction correctness.
