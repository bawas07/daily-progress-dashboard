# Backend Redacted Error Logging Specification

## ADDED Requirements

### Requirement: Structured warn/error logging for HTTP requests

The backend SHALL emit structured log entries for warn and error conditions with request and response context.

#### Scenario: Warn log emitted for client error response
- **WHEN** an HTTP request completes with a 4xx status
- **THEN** the system SHALL emit a `warn` log entry
- **AND** the log entry SHALL include request metadata (`requestId`, method, path)
- **AND** the log entry SHALL include response metadata (`status`, response code, message)

#### Scenario: Error log emitted for server error response
- **WHEN** an HTTP request completes with a 5xx status
- **THEN** the system SHALL emit an `error` log entry
- **AND** the log entry SHALL include request metadata (`requestId`, method, path)
- **AND** the log entry SHALL include response metadata (`status`, response code, message)

### Requirement: Unhandled exceptions are always logged

The backend SHALL always log unhandled exceptions that result in internal server errors.

#### Scenario: Exception in route handler produces error log
- **WHEN** an unhandled exception occurs during request processing
- **THEN** the global error handling path SHALL emit an `error` log entry
- **AND** the log entry SHALL include the error name and message
- **AND** the log entry SHALL include stack information when available
- **AND** the final response SHALL still be returned with HTTP 500

### Requirement: Sensitive data redaction

The backend SHALL redact sensitive information from log metadata before writing warn/error logs.

#### Scenario: Password fields are redacted
- **WHEN** request or response metadata contains password-like fields
- **THEN** the system SHALL replace those values with a redacted marker before logging
- **AND** cleartext password values SHALL NOT appear in warn/error log output

#### Scenario: Token and secret fields are redacted
- **WHEN** request or response metadata contains authorization, token, cookie, or secret fields
- **THEN** the system SHALL replace those values with a redacted marker before logging
- **AND** bearer token values SHALL NOT appear in warn/error log output

#### Scenario: Nested sensitive values are redacted
- **WHEN** sensitive fields are present inside nested objects or arrays
- **THEN** the system SHALL redact sensitive values recursively
- **AND** non-sensitive fields SHALL remain readable for debugging

### Requirement: Request-response correlation

The backend SHALL include correlation data in warn/error logs to connect request and response events.

#### Scenario: Request ID is propagated or generated
- **WHEN** an incoming request includes `x-request-id`
- **THEN** warn/error logs for that request SHALL use the same request ID

#### Scenario: Request ID is generated when absent
- **WHEN** an incoming request does not include `x-request-id`
- **THEN** the system SHALL generate a request ID
- **AND** warn/error logs for that request SHALL include the generated ID

#### Scenario: Duration is captured for failure logs
- **WHEN** a warn/error log entry is emitted for an HTTP request
- **THEN** the log entry SHALL include request duration in milliseconds

### Requirement: Consistent log payload shape

Warn and error log payloads SHALL use a consistent schema across middleware and global error handling.

#### Scenario: Shared schema fields are present
- **WHEN** a warn/error log is emitted from any backend layer
- **THEN** the log entry SHALL include consistent top-level fields for event, request, response, and timing
- **AND** fields SHALL use stable names suitable for search and monitoring ingestion
