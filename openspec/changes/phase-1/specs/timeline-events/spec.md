# Timeline Events Specification

## ADDED Requirements

### Requirement: Create Timeline Event

The system SHALL allow users to create time-anchored events with title, start time, duration, and optional recurrence pattern.

#### Scenario: Create one-time event

- **WHEN** a user provides a title, start time, and duration for a timeline event
- **THEN** the system SHALL create a timeline event
- **AND** the system SHALL set recurrence_pattern to null
- **AND** the system SHALL set status to "active"
- **AND** the system SHALL return the created event

#### Scenario: Create daily recurring event

- **WHEN** a user selects "daily" as the recurrence pattern
- **THEN** the system SHALL create a timeline event with recurrence_pattern="daily"
- **AND** the event SHALL appear on the dashboard every day

#### Scenario: Create weekly recurring event

- **WHEN** a user selects "weekly" as the recurrence pattern and selects specific days of the week
- **THEN** the system SHALL create a timeline event with recurrence_pattern="weekly"
- **AND** the system SHALL store the selected days in the days_of_week JSONB array
- **AND** the event SHALL appear on the dashboard only on the selected days

#### Scenario: Create custom recurring event

- **WHEN** a user selects "custom" as the recurrence pattern
- **THEN** the system SHALL create a timeline event with recurrence_pattern="custom"
- **AND** the system SHALL store the custom recurrence configuration

#### Scenario: Default duration applied

- **WHEN** a user creates a timeline event without specifying duration
- **THEN** the system SHALL set the duration_minutes to 30 (default value)

#### Scenario: Validation requires title and start time

- **WHEN** a user attempts to create a timeline event without a title or start time
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the error message SHALL indicate which required field is missing

#### Scenario: Weekly recurrence requires day selection

- **WHEN** a user selects "weekly" recurrence but does not select any days of the week
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the error message SHALL indicate "Select at least one day of the week"

### Requirement: Timeline Event Display

The system SHALL display timeline events in chronological order by start time on the dashboard.

#### Scenario: Events sorted chronologically

- **WHEN** the dashboard displays timeline events for a day
- **THEN** events SHALL be sorted by start_time in ascending order
- **AND** the first event SHALL be the earliest event of the day

#### Scenario: Event shows title and time

- **WHEN** a timeline event is displayed
- **THEN** the display SHALL show the event title
- **AND** the display SHALL show the start time (e.g., "9:00 AM")
- **AND** the display SHALL show the duration (e.g., "30m")

#### Scenario: Recurring event indicator

- **WHEN** a timeline event has a recurrence pattern (not null)
- **THEN** the display SHALL indicate the recurrence pattern (e.g., "Daily", "Weekly Mon/Wed/Fri")

### Requirement: Timeline Event Matching

The system SHALL determine which events appear on the dashboard based on the current date and recurrence rules.

#### Scenario: One-time event matches exact date

- **WHEN** a one-time event has start_time date matching the current date
- **THEN** the event SHALL appear in the timeline section

#### Scenario: One-time event does not match other dates

- **WHEN** a one-time event has start_time date different from the current date
- **THEN** the event SHALL NOT appear in the timeline section

#### Scenario: Daily recurring event matches every day

- **WHEN** an event has recurrence_pattern="daily"
- **THEN** the event SHALL appear in the timeline section every day

#### Scenario: Weekly recurring event matches selected days

- **WHEN** an event has recurrence_pattern="weekly" and days_of_week includes "mon"
- **AND** the current day is Monday
- **THEN** the event SHALL appear in the timeline section

#### Scenario: Weekly recurring event does not match unselected days

- **WHEN** an event has recurrence_pattern="weekly" and days_of_week does not include "tue"
- **AND** the current day is Tuesday
- **THEN** the event SHALL NOT appear in the timeline section

### Requirement: Update Timeline Event

The system SHALL allow users to update timeline event properties.

#### Scenario: Successful event update

- **WHEN** a user updates a timeline event with valid data
- **THEN** the system SHALL update the event in the database
- **AND** the system SHALL update the updated_at timestamp
- **AND** the system SHALL return the updated event

#### Scenario: Update changes to future occurrences only

- **WHEN** a user updates a recurring event's title or time
- **THEN** the changes SHALL apply to future occurrences of the event
- **AND** historical progress logs or completed instances SHALL retain the original title at time of logging

### Requirement: Settle Timeline Event

The system SHALL allow users to mark timeline events as settled. Settled events SHALL be removed from the active timeline.

#### Scenario: Successful settle operation

- **WHEN** a user marks a timeline event as settled
- **THEN** the system SHALL update the event's status to "settled"
- **AND** the event SHALL no longer appear in the timeline section
- **AND** the event SHALL remain in the database for historical records

### Requirement: Timeline Event Ownership

The system SHALL enforce user ownership of timeline events.

#### Scenario: Users can only access their own events

- **WHEN** a user requests a timeline event by ID
- **THEN** the system SHALL verify the event's user_id matches the authenticated user's ID
- **AND** if the user IDs do not match, the system SHALL return an error response with HTTP status 404

#### Scenario: Cascade delete on user deletion

- **WHEN** a user account is deleted
- **THEN** all timeline events owned by that user SHALL be cascade deleted

### Requirement: Timeline Event Status

The system SHALL support "active" and "settled" status for timeline events.

#### Scenario: Active events appear on dashboard

- **WHEN** a timeline event has status="active"
- **AND** the event matches the current date and recurrence rules
- **THEN** the event SHALL appear in the timeline section

#### Scenario: Settled events do not appear on dashboard

- **WHEN** a timeline event has status="settled"
- **THEN** the event SHALL NOT appear in the timeline section
- **AND** the event SHALL only be accessible through history views
