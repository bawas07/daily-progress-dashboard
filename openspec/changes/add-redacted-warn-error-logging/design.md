## Context

The backend already uses Winston (`repos/backend/src/shared/logger/logger.service.ts`) and Prisma client logging, but operational debugging is still difficult when a request fails with a 500. Current logs do not consistently include full request/response context, and sensitive values may appear if request payloads are logged naively.

This change is cross-cutting because it touches app middleware (`repos/backend/src/app.ts`), global error handling (`repos/backend/src/shared/middleware/error.middleware.ts`), and shared logging utilities. The design must improve debuggability while preventing credential leakage.

## Goals / Non-Goals

**Goals:**
- Ensure every backend `warn` and `error` entry includes enough HTTP context to debug failures quickly.
- Guarantee that 5xx responses always produce structured error logs.
- Redact sensitive fields from request/response metadata before writing logs.
- Standardize log payload shape so logs are searchable and alert-friendly.
- Add tests for redaction and error-path logging behavior.

**Non-Goals:**
- Replacing Winston with a different logging framework.
- Introducing distributed tracing infrastructure (OpenTelemetry, Jaeger, etc.) in this change.
- Logging full response payloads for all successful requests.
- Building new dashboards/alerts in monitoring tools as part of this artifact.

## Decisions

### 1) Add HTTP request-context middleware for failure-focused logging

Implement a shared middleware that:
- Creates/propagates `requestId` (`x-request-id` passthrough if present, otherwise generated).
- Captures minimal request context at ingress (method, path, query, selected headers, client IP, user-agent, authenticated user id if available).
- Measures request latency.
- Logs once on completion when status indicates issue severity:
  - `warn` for 4xx responses (operational/client issues).
  - `error` for 5xx responses (server failures).

Rationale:
- Keeps logging consistent across all modules without changing every controller.
- Ensures route-level failures are visible even when thrown deep in service/repository layers.

Alternatives considered:
- Logging inside each controller: rejected due to duplication and inconsistent adoption.
- Keeping only Hono default logger: rejected because it lacks structured failure context and redaction guarantees.

### 2) Introduce a central redaction utility and enforce it in all warn/error paths

Create a reusable sanitizer for log metadata that:
- Recursively redacts sensitive keys (case-insensitive), including: `password`, `newPassword`, `currentPassword`, `token`, `refreshToken`, `accessToken`, `authorization`, `cookie`, `secret`, `apiKey`.
- Supports nested objects/arrays and known auth header formats (e.g., `Bearer ...`).
- Truncates oversized string payloads to reduce risk and log volume.

Rationale:
- A single utility prevents drift between middleware logs and error middleware logs.
- Redaction-by-default avoids accidental leakage during future logging additions.

Alternatives considered:
- Manual redaction at call sites: rejected as error-prone.
- Full body suppression: rejected because some request/response context is required for debugging.

### 3) Upgrade global error middleware to emit structured failure events

Update `errorHandler` to:
- Map runtime errors to final HTTP status first.
- Emit one structured `error` log event for 5xx and one `warn` event for mapped non-5xx exceptions.
- Include request context + final response metadata (`status`, API code, message, duration, requestId).
- Include stack traces for server errors (and optionally for non-production only if needed by policy).

Rationale:
- Today’s error handler logs only partial context and can miss useful response-side metadata.
- Explicit logging in the global handler guarantees visibility for uncaught exceptions.

Alternatives considered:
- Logging only at middleware completion: rejected because uncaught exception details (message/stack/classification) would be weaker.

### 4) Define a stable warn/error log schema

Adopt a consistent meta structure:
- `event`: `http.warn` | `http.error` | `app.warn` | `app.error`
- `request`: `{ requestId, method, path, query, headers, body, ip, userAgent, userId }`
- `response`: `{ status, code, message, body }` (response body optional and redacted)
- `timing`: `{ durationMs }`
- `error`: `{ name, message, stack }` (stack on error paths)

Rationale:
- Predictable shape improves grepability and compatibility with log forwarders.

Alternatives considered:
- Free-form metadata: rejected due to poor consistency and weak observability ergonomics.

### 5) Test strategy: unit + integration verification

Add tests to verify:
- Redaction masks sensitive keys in nested request/response objects.
- Error middleware logs an `error` event for 500 responses with requestId and sanitized metadata.
- 4xx responses produce `warn` logs with sanitized metadata.
- Password/token material never appears in emitted logs.

Rationale:
- This change is security-sensitive; regression tests are required to prevent leaks.

## Risks / Trade-offs

- [Risk] Over-logging increases log volume and cost -> Mitigation: log detailed context only for warn/error paths, truncate large fields.
- [Risk] Redaction misses uncommon sensitive keys -> Mitigation: centralized configurable sensitive-key list + test coverage for known auth/password fields.
- [Risk] Logging request/response bodies could expose PII if redaction fails -> Mitigation: strict redaction first, optional body capture limits, avoid full success-response logging.
- [Risk] Request body may not be readable twice in middleware -> Mitigation: parse once safely, store sanitized snapshot in request context, avoid mutating downstream body handling.
- [Risk] Missing correlation with existing logs -> Mitigation: include `requestId` in all middleware and error-handler warn/error logs.

## Migration Plan

1. Add shared redaction utility and tests.
2. Add request-context middleware and register it in app bootstrap before route handlers.
3. Refactor global error middleware to emit structured warn/error logs using redacted metadata.
4. Add/adjust integration tests for 4xx/5xx logging scenarios.
5. Deploy to staging and validate by intentionally triggering 400 and 500 responses.
6. Deploy to production after verifying no sensitive values appear in log samples.

Rollback:
- Revert middleware/error-handler logging changes and redeploy.
- If emergency mitigation is needed, reduce `LOG_LEVEL` to `error` temporarily while patching.

## Open Questions

- Should all 4xx statuses be logged as `warn`, or only selected classes (e.g., repeated auth failures, rate limits)?
- Should stack traces be suppressed in production logs, or retained but restricted to internal sinks only?
- Do we want to include response body snapshots for error responses, or keep only `{code, message}` to minimize exposure?
