# Progress Logging Specification

## Purpose
Define requirements for the progress logging capability.

## Requirements

### Requirement: Create Progress Log

The system SHALL allow users to log progress on progress items with optional notes. Each log SHALL be timestamped and optionally marked as an off-day log.

#### Scenario: Successful progress log with note

- **WHEN** a user logs progress on a progress item with a note (up to 1000 characters)
- **THEN** the system SHALL create a progress log entry
- **AND** the system SHALL set the logged_at timestamp to the current time
- **AND** the system SHALL store the note text
- **AND** the system SHALL set is_off_day to false if the current day is in the item's active_days
- **AND** the system SHALL update the progress item's updated_at timestamp
- **AND** the system SHALL return the created log entry

#### Scenario: Successful progress log without note

- **WHEN** a user logs progress on a progress item without providing a note
- **THEN** the system SHALL create a progress log entry
- **AND** the system SHALL set the note field to null
- **AND** the log SHALL be successfully created

#### Scenario: Progress log on off-day

- **WHEN** a user logs progress on a progress item and the current day is NOT in the item's active_days
- **THEN** the system SHALL create a progress log entry
- **AND** the system SHALL set is_off_day to true
- **AND** the system SHALL indicate "off-day" in the success response

#### Scenario: Note length exceeds maximum

- **WHEN** a user attempts to log progress with a note longer than 1000 characters
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the error message SHALL indicate "Note must be 1000 characters or less"

### Requirement: Progress Log History

The system SHALL maintain an append-only history of progress logs for each item. Logs SHALL be sorted by timestamp in descending order.

#### Scenario: Retrieve progress logs for an item

- **WHEN** a user requests progress logs for a specific item
- **THEN** the system SHALL return all progress logs for that item
- **AND** the logs SHALL be sorted by logged_at in descending order (most recent first)
- **AND** the response SHALL include the note, logged_at timestamp, and is_off_day flag for each log

#### Scenario: Multiple logs per day allowed

- **WHEN** a user logs progress multiple times on the same day
- **THEN** the system SHALL create a separate progress log entry for each log action
- **AND** all logs SHALL be independently visible in the history

#### Scenario: Progress logs are append-only

- **WHEN** a progress log has been created
- **THEN** the log SHALL NOT be editable
- **AND** the log SHALL NOT be deletable
- **AND** the note content SHALL never be modified
- **AND** the logged_at timestamp SHALL never be changed

### Requirement: Progress Log Item Ownership

The system SHALL verify that a progress item belongs to the user before allowing progress logging.

#### Scenario: Log on own item succeeds

- **WHEN** a user logs progress on an item that belongs to them
- **THEN** the progress log SHALL be created successfully

#### Scenario: Log on non-existent item fails

- **WHEN** a user attempts to log progress on an item that does not exist
- **THEN** the system SHALL return an error response with code "E003"
- **AND** the error message SHALL indicate "Progress item not found"

#### Scenario: Log on another user's item fails

- **WHEN** a user attempts to log progress on an item belonging to another user
- **THEN** the system SHALL return an error response with code "E003"
- **AND** the error message SHALL indicate "Progress item not found" (same as non-existent for security)

### Requirement: Progress Log Display

The system SHALL display recent progress logs in the item detail view.

#### Scenario: Recent logs shown in item detail

- **WHEN** a user opens the detail view for a progress item
- **THEN** the system SHALL display the most recent progress logs
- **AND** the display SHALL show the note content, timestamp, and off-day indicator
- **AND** the logs SHALL be shown in reverse chronological order

#### Scenario: Last progress indicator

- **WHEN** a progress item has at least one progress log
- **THEN** the system SHALL display the timestamp of the most recent log
- **AND** the display SHALL show the relative time (e.g., "2 days ago")
