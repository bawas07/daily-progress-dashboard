# User Authentication Specification

## Purpose
Define requirements for the user auth capability.

## Requirements

### Requirement: User Registration

The system SHALL allow new users to register an account with email and password. Passwords MUST meet security requirements and be hashed before storage. Upon successful registration, the system SHALL create default user preferences.

#### Scenario: Successful registration with valid data

- **WHEN** a user provides a valid email, name, and password meeting requirements
- **THEN** the system SHALL create a new user account
- **AND** the system SHALL hash the password using bcrypt with 10 salt rounds
- **AND** the system SHALL create default user preferences
- **AND** the system SHALL return a success response with user data

#### Scenario: Registration fails with existing email

- **WHEN** a user attempts to register with an email that already exists
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the error message SHALL indicate "Email already exists"

#### Scenario: Registration fails with weak password

- **WHEN** a user provides a password that does not meet requirements (less than 8 characters, missing uppercase, missing lowercase, missing number)
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the error message SHALL indicate the specific password requirement(s) not met

### Requirement: User Login

The system SHALL authenticate users with email and password credentials. Upon successful authentication, the system SHALL generate a short-lived access token (15 minutes) and a long-lived refresh token (7 days).

#### Scenario: Successful login returns token pair

- **WHEN** a user provides valid email and password credentials
- **THEN** the system SHALL validate the credentials
- **AND** the system SHALL generate an access token with 15 minute expiration
- **AND** the system SHALL generate a refresh token with 7 day expiration
- **AND** the system SHALL store the refresh token in the database
- **AND** the system SHALL return both tokens along with user data and preferences
- **AND** the system SHALL update the user's last_login timestamp

#### Scenario: Login fails with invalid credentials

- **WHEN** a user provides an email that exists but incorrect password
- **THEN** the system SHALL return an error response with code "E001"
- **AND** the error message SHALL indicate "Invalid email or password"

#### Scenario: Login fails with non-existent email

- **WHEN** a user provides an email that does not exist
- **THEN** the system SHALL return an error response with code "E001"
- **AND** the error message SHALL indicate "Invalid email or password" (same as invalid password for security)

### Requirement: Token Validation

The system SHALL validate access tokens on protected API endpoints. The system SHALL reject requests with invalid or expired tokens.

#### Scenario: Valid access token grants access

- **WHEN** a request includes a valid access token in the Authorization header
- **THEN** the system SHALL grant access to the protected resource
- **AND** the system SHALL extract the user ID from the token payload
- **AND** the system SHALL proceed with the requested operation

#### Scenario: Expired access token is rejected

- **WHEN** a request includes an access token that has expired
- **THEN** the system SHALL return an error response with HTTP status 401
- **AND** the error response code SHALL be "E004" (Unauthorized)

#### Scenario: Invalid access token is rejected

- **WHEN** a request includes a malformed or signature-invalid access token
- **THEN** the system SHALL return an error response with HTTP status 401
- **AND** the error response code SHALL be "E004" (Unauthorized)

#### Scenario: Missing access token is rejected

- **WHEN** a request to a protected endpoint does not include an Authorization header
- **THEN** the system SHALL return an error response with HTTP status 401
- **AND** the error response code SHALL be "E004" (Unauthorized)

### Requirement: Token Refresh

The system SHALL allow clients to exchange a valid refresh token for a new token pair. Each refresh token SHALL only be usable once. The system SHALL revoke old refresh tokens when issuing new ones.

#### Scenario: Successful token refresh returns new token pair

- **WHEN** a client provides a valid, unrevoked refresh token
- **THEN** the system SHALL generate a new access token with 15 minute expiration
- **AND** the system SHALL generate a new refresh token with 7 day expiration
- **AND** the system SHALL revoke the old refresh token by setting revoked_at timestamp
- **AND** the system SHALL store the new refresh token in the database
- **AND** the system SHALL return both new tokens to the client

#### Scenario: Token refresh fails with revoked token

- **WHEN** a client provides a refresh token that has been revoked
- **THEN** the system SHALL return an error response with code "E004"
- **AND** the error message SHALL indicate "Invalid or expired refresh token"

#### Scenario: Token refresh fails with expired token

- **WHEN** a client provides a refresh token that has passed its expiration time
- **THEN** the system SHALL return an error response with code "E004"
- **AND** the error message SHALL indicate "Invalid or expired refresh token"

#### Scenario: Token refresh fails with reused token

- **WHEN** a client provides a refresh token that has already been used (revoked)
- **THEN** the system SHALL return an error response with code "E004"
- **AND** the system SHALL log a security warning about potential token replay attack

### Requirement: Token Revocation (Logout)

The system SHALL allow users to revoke their refresh token on logout. The system SHALL mark the token as revoked and prevent further use.

#### Scenario: Successful logout revokes refresh token

- **WHEN** a logged-in user requests logout with a valid refresh token
- **THEN** the system SHALL mark the refresh token as revoked by setting revoked_at timestamp
- **AND** the system SHALL return a success response
- **AND** the client SHALL clear stored tokens from localStorage

#### Scenario: Logout with already revoked token

- **WHEN** a user attempts to logout with a refresh token that is already revoked
- **THEN** the system SHALL return a success response (idempotent operation)
- **AND** the system SHALL not return an error

### Requirement: Session Validation

The system SHALL provide an endpoint to validate the current session and return user information if the access token is valid.

#### Scenario: Valid session returns user information

- **WHEN** a client requests session validation with a valid access token
- **THEN** the system SHALL return the current user's information
- **AND** the system SHALL include user preferences in the response

#### Scenario: Session validation fails with invalid token

- **WHEN** a client requests session validation with an invalid or expired access token
- **THEN** the system SHALL return an error response with HTTP status 401
- **AND** the error response code SHALL be "E004" (Unauthorized)

### Requirement: Password Security

The system SHALL enforce password strength requirements. Passwords MUST be hashed using bcrypt with 10 salt rounds before storage.

#### Scenario: Password meets all requirements

- **WHEN** a user provides a password with 8+ characters, at least one uppercase letter, at least one lowercase letter, and at least one number
- **THEN** the password SHALL be accepted for registration or password update

#### Scenario: Password too short

- **WHEN** a user provides a password with fewer than 8 characters
- **THEN** the system SHALL return an error response indicating password must be at least 8 characters

#### Scenario: Password missing uppercase

- **WHEN** a user provides a password with no uppercase letters
- **THEN** the system SHALL return an error response indicating password must contain at least one uppercase letter

#### Scenario: Password missing lowercase

- **WHEN** a user provides a password with no lowercase letters
- **THEN** the system SHALL return an error response indicating password must contain at least one lowercase letter

#### Scenario: Password missing number

- **WHEN** a user provides a password with no numbers
- **THEN** the system SHALL return an error response indicating password must contain at least one number

### Requirement: Email Validation

The system SHALL validate email format and uniqueness. Email addresses MUST be unique across all users.

#### Scenario: Valid email format accepted

- **WHEN** a user provides an email in valid format (user@domain.com)
- **THEN** the email SHALL be accepted for registration

#### Scenario: Invalid email format rejected

- **WHEN** a user provides an email in invalid format (missing @, missing domain, etc.)
- **THEN** the system SHALL return an error response indicating invalid email format

### Requirement: Default Preferences

The system SHALL automatically create default user preferences for new users.

#### Scenario: Default preferences created on registration

- **WHEN** a new user account is created
- **THEN** the system SHALL create default user preferences with:
  - default_active_days set to ["mon", "tue", "wed", "thu", "fri"]
  - theme set to "auto"
  - timezone set to "UTC"
  - enable_notifications set to true

#### Scenario: User preferences linked to user account

- **WHEN** a user account is created
- **THEN** the user_preferences record SHALL have user_id foreign key referencing the user
- **AND** the user_preferences record SHALL be cascade deleted if the user is deleted
