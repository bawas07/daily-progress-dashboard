# Token Refresh Specification

## ADDED Requirements

### Requirement: Refresh Token Generation

The system SHALL generate a unique refresh token when a user logs in or registers. Each refresh token SHALL be stored in the database with user association, expiration time, and optional metadata.

#### Scenario: Refresh token created on login

- **WHEN** a user successfully logs in
- **THEN** the system SHALL generate a cryptographically secure random refresh token
- **AND** the system SHALL store the refresh token in the refresh_tokens table
- **AND** the refresh token SHALL have an expires_at of 7 days from creation
- **AND** the system SHALL optionally store user_agent and ip_address from the request

#### Scenario: Refresh token is unique

- **WHEN** a refresh token is generated
- **THEN** the token value SHALL be unique across all refresh tokens in the database
- **AND** the system SHALL enforce a unique constraint on the token column

### Requirement: Refresh Token Rotation

The system SHALL implement token rotation on each refresh. When a refresh token is used, the system SHALL issue a new token pair and revoke the old token. Each refresh token SHALL only be usable once.

#### Scenario: Successful token rotation

- **WHEN** a client presents a valid, unrevoked refresh token
- **THEN** the system SHALL validate the token exists and is not revoked
- **AND** the system SHALL check the token has not expired
- **AND** the system SHALL generate a new access token with 15 minute expiration
- **AND** the system SHALL generate a new refresh token with 7 day expiration
- **AND** the system SHALL mark the old refresh token as revoked (set revoked_at)
- **AND** the system SHALL store the new refresh token in the database
- **AND** the system SHALL return both new tokens to the client

#### Scenario: Reused refresh token is rejected

- **WHEN** a client presents a refresh token that has already been used (revoked_at is not null)
- **THEN** the system SHALL return an error response with code "E004"
- **AND** the system SHALL log a security warning about potential token replay attack
- **AND** the system SHALL NOT issue a new token pair

#### Scenario: Expired refresh token is rejected

- **WHEN** a client presents a refresh token where expires_at is in the past
- **THEN** the system SHALL return an error response with code "E004"
- **AND** the error message SHALL indicate "Invalid or expired refresh token"

### Requirement: Refresh Token Storage

The system SHALL store refresh tokens in the database with metadata for validation and revocation.

#### Scenario: Refresh token includes required fields

- **WHEN** a refresh token is stored
- **THEN** the database record SHALL include:
  - id: unique identifier
  - token: unique token string
  - user_id: foreign key to users table
  - expires_at: token expiration timestamp
  - created_at: token creation timestamp
  - revoked_at: null when active, set to timestamp when revoked
  - user_agent: optional client user agent string
  - ip_address: optional client IP address

#### Scenario: Refresh token has proper indexes

- **WHEN** the refresh_tokens table is queried
- **THEN** there SHALL be an index on user_id for user token lookups
- **AND** there SHALL be a unique index on token for token validation

### Requirement: Refresh Token Revocation

The system SHALL provide a mechanism to revoke refresh tokens. Revoked tokens SHALL not be valid for token exchange.

#### Scenario: Logout revokes refresh token

- **WHEN** a user logs out with a valid refresh token
- **THEN** the system SHALL find the refresh token by token value
- **AND** the system SHALL set revoked_at to the current timestamp
- **AND** the system SHALL return a success response

#### Scenario: Multiple refresh tokens per user

- **WHEN** a user logs in from multiple devices
- **THEN** the system SHALL maintain separate refresh tokens for each device
- **AND** each refresh token SHALL be independently revocable
- **AND** revoking one token SHALL NOT affect other tokens for the same user

#### Scenario: Revoked token cannot be used

- **WHEN** a client presents a refresh token where revoked_at is not null
- **THEN** the system SHALL return an error response with code "E004"
- **AND** the token SHALL NOT be valid for obtaining new tokens

### Requirement: Automatic Token Refresh

The client SHALL automatically refresh the access token when a 401 response is received. The refresh process SHALL be transparent to the user.

#### Scenario: Client automatically refreshes on 401

- **WHEN** an API request returns HTTP status 401 (Unauthorized)
- **THEN** the client SHALL automatically call the refresh endpoint with the stored refresh token
- **AND** the client SHALL update stored tokens with the new token pair
- **AND** the client SHALL retry the original request with the new access token
- **AND** the user SHALL NOT be prompted to log in again

#### Scenario: Token refresh failure redirects to login

- **WHEN** the automatic token refresh fails (invalid token, network error, etc.)
- **THEN** the client SHALL clear all stored tokens
- **AND** the client SHALL redirect the user to the login screen
- **AND** the client SHALL display a session expired message

#### Scenario: Multiple concurrent 401 responses

- **WHEN** multiple API requests receive 401 responses simultaneously
- **THEN** the client SHALL queue subsequent requests while a refresh is in progress
- **AND** the client SHALL only perform one refresh operation
- **AND** all queued requests SHALL be retried after the refresh completes

### Requirement: Token Storage in Client

The client SHALL store access and refresh tokens securely. Tokens SHALL be accessible to the API client for automatic inclusion in requests.

#### Scenario: Tokens stored after login

- **WHEN** a user successfully logs in
- **THEN** the client SHALL store the access token in memory or state management (Pinia)
- **AND** the client SHALL store the refresh token in localStorage
- **AND** both tokens SHALL be accessible to the HTTP client for request authorization

#### Scenario: Tokens cleared after logout

- **WHEN** a user logs out
- **THEN** the client SHALL clear the access token from memory/state
- **AND** the client SHALL remove the refresh token from localStorage
- **AND** no tokens SHALL remain accessible to the HTTP client

### Requirement: Refresh Token Cleanup

The system SHALL provide a mechanism to clean up expired and revoked refresh tokens to prevent database bloat.

#### Scenario: Expired tokens are periodically cleaned

- **WHEN** a scheduled cleanup job runs
- **THEN** the system SHALL delete refresh tokens where expires_at is in the past and revoked_at is not null
- **AND** the system SHALL optionally delete tokens where revoked_at is older than a retention period (e.g., 30 days)

### Requirement: Token Payload Structure

The access token SHALL contain user identification in the JWT payload. The refresh token SHALL be an opaque string stored in the database.

#### Scenario: Access token contains user ID

- **WHEN** an access token is generated
- **THEN** the JWT payload SHALL contain:
  - sub: user ID (subject)
  - email: user's email address
  - iat: issued at timestamp
  - exp: expiration timestamp (current time + 15 minutes)

#### Scenario: Refresh token is opaque

- **WHEN** a refresh token is generated
- **THEN** the token SHALL be a cryptographically secure random string
- **AND** the token SHALL not contain encoded user data (opaque token)
- **AND** the system SHALL look up user data by querying the database with the token value
