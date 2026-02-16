# Commitments Specification

## ADDED Requirements

### Requirement: Create Commitment

The system SHALL allow users to create commitments with title and scheduled days. Commitments represent recurring routines with no end goal.

#### Scenario: Successful commitment creation

- **WHEN** a user provides a title and at least one scheduled day
- **THEN** the system SHALL create a commitment
- **AND** the system SHALL return the created commitment with generated ID

#### Scenario: Weekdays preset selection

- **WHEN** a user selects the "Weekdays" preset
- **THEN** the scheduled_days SHALL be set to ["mon", "tue", "wed", "thu", "fri"]

#### Scenario: Daily preset selection

- **WHEN** a user selects the "Daily" preset
- **THEN** the scheduled_days SHALL be set to ["mon", "tue", "wed", "thu", "fri", "sat", "sun"]

#### Scenario: Custom day selection

- **WHEN** a user manually selects specific days (e.g., ["mon", "wed", "fri"])
- **THEN** the scheduled_days SHALL be set to the selected days

#### Scenario: Validation requires title and scheduled days

- **WHEN** a user attempts to create a commitment without a title
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the field SHALL be specified as "title"

#### Scenario: Validation requires at least one scheduled day

- **WHEN** a user attempts to create a commitment with zero scheduled days
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the field SHALL be specified as "scheduledDays"
- **AND** the error message SHALL indicate "Select at least one scheduled day"

### Requirement: Commitment Activity Logging

The system SHALL allow users to log commitment activity multiple times per day with optional notes.

#### Scenario: Log commitment activity

- **WHEN** a user logs activity on a commitment
- **THEN** the system SHALL create a commitment_log entry
- **AND** the system SHALL set completed_at to the current timestamp
- **AND** the system SHALL optionally store a note if provided
- **AND** the system SHALL return the created log entry

#### Scenario: Multiple logs per day allowed

- **WHEN** a user logs activity on a commitment multiple times on the same day
- **THEN** the system SHALL create a separate commitment_log entry for each activity
- **AND** all logs SHALL be independently visible in the history

#### Scenario: Activity log without note

- **WHEN** a user logs commitment activity without providing a note
- **THEN** the system SHALL create a commitment_log entry with note=null
- **AND** the log SHALL be successfully created

### Requirement: Commitment Display

The system SHALL display commitments on the dashboard when the current day matches the scheduled days.

#### Scenario: Commitment appears on scheduled day

- **WHEN** the current day is "Monday" and a commitment has scheduled_days including "mon"
- **THEN** the commitment SHALL appear in the commitments section of the dashboard
- **AND** the commitment SHALL display with a checkbox

#### Scenario: Commitment hidden on unscheduled day

- **WHEN** the current day is "Saturday" and a commitment has scheduled_days of ["mon", "wed", "fri"]
- **THEN** the commitment SHALL NOT appear in the commitments section

#### Scenario: Daily commitment appears every day

- **WHEN** a commitment has scheduled_days including all seven days
- **THEN** the commitment SHALL appear in the commitments section every day

### Requirement: Commitment Completion Tracking

The system SHALL track whether a commitment has been completed on the current day.

#### Scenario: No completion today shows checkbox

- **WHEN** a commitment is displayed and no activity has been logged today
- **THEN** the commitment SHALL show an unchecked checkbox
- **AND** the user SHALL be able to click to log completion

#### Scenario: Completion today shows checkmark

- **WHEN** a commitment is displayed and at least one activity has been logged today
- **THEN** the commitment SHALL show a checked checkbox
- **AND** the user SHALL still be able to log additional activity

#### Scenario: Check if already completed today

- **WHEN** the system checks if a commitment is completed for the current date
- **THEN** the system SHALL query for commitment_logs where DATE(completed_at) equals the current date
- **AND** if any logs exist, the commitment SHALL be considered completed

### Requirement: Update Commitment

The system SHALL allow users to update commitment properties.

#### Scenario: Successful commitment update

- **WHEN** a user updates a commitment with valid data
- **THEN** the system SHALL update the commitment in the database
- **AND** the system SHALL update the updated_at timestamp
- **AND** the system SHALL return the updated commitment

#### Scenario: Update scheduled days changes visibility

- **WHEN** a user updates a commitment's scheduled_days
- **THEN** the commitment SHALL appear on the new scheduled days
- **AND** the commitment SHALL NOT appear on days that are no longer scheduled

### Requirement: Delete Commitment

The system SHALL allow users to delete commitments. Deleting a commitment SHALL cascade delete all associated activity logs.

#### Scenario: Successful commitment deletion

- **WHEN** a user confirms deletion of a commitment
- **THEN** the system SHALL delete the commitment from the database
- **AND** the system SHALL cascade delete all commitment_logs associated with that commitment
- **AND** the commitment SHALL no longer appear in the dashboard

#### Scenario: Confirmation required before deletion

- **WHEN** a user requests to delete a commitment
- **THEN** the system SHALL display a confirmation dialog
- **AND** the dialog SHALL explain that all activity history will be permanently deleted
- **AND** the deletion SHALL only proceed after user confirmation

### Requirement: Commitment Ownership

The system SHALL enforce user ownership of commitments.

#### Scenario: Users can only access their own commitments

- **WHEN** a user requests a commitment by ID
- **THEN** the system SHALL verify the commitment's user_id matches the authenticated user's ID
- **AND** if the user IDs do not match, the system SHALL return an error response with HTTP status 404

#### Scenario: Cascade delete on user deletion

- **WHEN** a user account is deleted
- **THEN** all commitments owned by that user SHALL be cascade deleted
- **AND** all commitment_logs associated with those commitments SHALL be cascade deleted

### Requirement: Commitment Activity History

The system SHALL maintain a history of commitment activity logs.

#### Scenario: View commitment activity history

- **WHEN** a user views a commitment's detail
- **THEN** the system SHALL display all activity logs for that commitment
- **AND** the logs SHALL be sorted by completed_at in descending order
- **AND** each log SHALL show the timestamp and optional note

#### Scenario: Recent activity shown on dashboard

- **WHEN** a commitment is displayed on the dashboard
- **AND** the commitment has activity logs
- **THEN** the system SHALL display the timestamp of the most recent activity
- **AND** the display SHALL show the relative time (e.g., "Completed 2 hours ago")
