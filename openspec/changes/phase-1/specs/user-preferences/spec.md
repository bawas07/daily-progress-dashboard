# User Preferences Specification

## ADDED Requirements

### Requirement: Default Active Days

The system SHALL allow users to set default active days that are applied when creating new progress items.

#### Scenario: Default active days applied to new items

- **WHEN** a user creates a new progress item without manually selecting active days
- **THEN** the system SHALL apply the user's default_active_days preference
- **AND** the new item SHALL have the default_active_days as its active_days value

#### Scenario: Default active days does not affect existing items

- **WHEN** a user updates their default_active_days preference
- **THEN** existing progress items SHALL retain their original active_days configuration
- **AND** only newly created items SHALL use the updated default

#### Scenario: Default active days validation

- **WHEN** a user sets default_active_days
- **THEN** at least one day MUST be selected
- **AND** the system SHALL validate the days array contains valid day abbreviations

### Requirement: Theme Selection

The system SHALL allow users to select a theme (light, dark, or auto) that applies immediately across the application.

#### Scenario: Light theme selection

- **WHEN** a user selects "light" theme
- **THEN** the system SHALL apply the light theme immediately
- **AND** the system SHALL save the preference to the database
- **AND** the system SHALL persist the theme selection across sessions

#### Scenario: Dark theme selection

- **WHEN** a user selects "dark" theme
- **THEN** the system SHALL apply the dark theme immediately
- **AND** the system SHALL save the preference to the database
- **AND** the system SHALL persist the theme selection across sessions

#### Scenario: Auto theme selection

- **WHEN** a user selects "auto" theme
- **THEN** the system SHALL apply light or dark theme based on the user's system preference
- **AND** the system SHALL automatically switch when the system preference changes
- **AND** the system SHALL save "auto" to the database

### Requirement: Timezone Setting

The system SHALL allow users to set their timezone for accurate day boundary calculations.

#### Scenario: Timezone recalculate day boundaries

- **WHEN** a user updates their timezone preference
- **THEN** the system SHALL recalculate day boundaries for time-based operations
- **AND** the "current day" for dashboard purposes SHALL be determined based on the user's timezone
- **AND** all date-based filtering SHALL use the user's timezone

#### Scenario: Timezone persists across sessions

- **WHEN** a user sets their timezone
- **THEN** the timezone SHALL be saved to the database
- **AND** the timezone SHALL be applied on subsequent logins
- **AND** the user SHALL not need to reset timezone on each session

#### Scenario: Timezone validation

- **WHEN** a user selects a timezone
- **THEN** the system SHALL validate the timezone is a valid IANA timezone identifier
- **AND** invalid timezones SHALL be rejected with an error message

### Requirement: Notification Preferences

The system SHALL allow users to enable or disable notifications.

#### Scenario: Notifications enabled

- **WHEN** a user has enable_notifications set to true
- **THEN** the system SHALL be allowed to send notifications to the user
- **AND** notification preferences SHALL be saved to the database

#### Scenario: Notifications disabled

- **WHEN** a user has enable_notifications set to false
- **THEN** the system SHALL NOT send any notifications to the user
- **AND** notification settings SHALL be saved to the database

#### Scenario: Notifications deferred to Phase 2

- **WHEN** Phase 1 is active
- **THEN** actual notification delivery is NOT implemented
- **AND** the enable_notifications preference SHALL be stored for future use
- **AND** the UI SHALL indicate notifications are planned for a future phase

### Requirement: Retrieve User Preferences

The system SHALL allow users to retrieve their current preferences.

#### Scenario: Get preferences returns all settings

- **WHEN** a user requests their preferences
- **THEN** the system SHALL return all preference values
- **AND** the response SHALL include default_active_days, theme, timezone, and enable_notifications

#### Scenario: Preferences loaded on app start

- **WHEN** a user logs in
- **THEN** the system SHALL fetch the user's preferences
- **AND** the theme SHALL be applied based on the saved preference
- **AND** the timezone SHALL be used for all date calculations

### Requirement: Update User Preferences

The system SHALL allow users to update their preferences with immediate effect where applicable.

#### Scenario: Update default active days

- **WHEN** a user updates their default_active_days preference
- **THEN** the system SHALL save the new value to the database
- **AND** the preference SHALL NOT affect existing progress items
- **AND** the system SHALL return a success response

#### Scenario: Update theme

- **WHEN** a user updates their theme preference
- **THEN** the system SHALL save the new value to the database
- **AND** the new theme SHALL be applied immediately
- **AND** the system SHALL return a success response

#### Scenario: Update timezone

- **WHEN** a user updates their timezone preference
- **THEN** the system SHALL save the new value to the database
- **AND** all date-based operations SHALL use the new timezone going forward
- **AND** the system SHALL return a success response

#### Scenario: Toggle notifications

- **WHEN** a user toggles their enable_notifications preference
- **THEN** the system SHALL save the new boolean value to the database
- **AND** the system SHALL return a success response

### Requirement: Default Preferences on Registration

The system SHALL create default preferences for new users upon registration.

#### Scenario: Default preferences created automatically

- **WHEN** a new user account is created
- **THEN** the system SHALL automatically create user_preferences record
- **AND** default_active_days SHALL be set to ["mon", "tue", "wed", "thu", "fri"]
- **AND** theme SHALL be set to "auto"
- **AND** timezone SHALL be set to "UTC"
- **AND** enable_notifications SHALL be set to true

### Requirement: Preferences Ownership

The system SHALL ensure each user has exactly one preferences record linked to their account.

#### Scenario: One preferences record per user

- **WHEN** a user account is created
- **THEN** exactly one user_preferences record SHALL be created with a unique user_id foreign key
- **AND** the user_preferences table SHALL have a unique constraint on user_id

#### Scenario: Preferences cascade delete with user

- **WHEN** a user account is deleted
- **THEN** the associated user_preferences record SHALL be cascade deleted
