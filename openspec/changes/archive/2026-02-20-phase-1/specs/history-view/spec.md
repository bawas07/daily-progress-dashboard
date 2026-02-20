# History View Specification

## ADDED Requirements

### Requirement: Today Tab

The system SHALL display all progress logs and commitment completions for the current date in the Today tab.

#### Scenario: Today tab shows current date logs

- **WHEN** a user opens the history view and the Today tab is selected
- **THEN** the system SHALL display all progress_logs created on the current date
- **AND** the system SHALL display all commitment_logs created on the current date
- **AND** the display SHALL be grouped by type (progress logs and commitment completions)
- **AND** the system SHALL show a summary count (e.g., "3 progress logs and 2 commitments completed")

#### Scenario: Today tab shows note content

- **WHEN** displaying logs in the Today tab
- **THEN** each progress log entry SHALL show the note content if provided
- **AND** each commitment log entry SHALL show the note content if provided
- **AND** the display SHALL show the timestamp of each log

#### Scenario: Today tab filters by current date

- **WHEN** the Today tab is displayed
- **THEN** the system SHALL only include logs where DATE(logged_at) or DATE(completed_at) equals the current date
- **AND** logs from previous or future dates SHALL NOT be included

### Requirement: This Week Tab

The system SHALL display a weekly summary with logs grouped by date and summary counts.

#### Scenario: Week tab shows calendar grouping

- **WHEN** a user opens the history view and the This Week tab is selected
- **THEN** the system SHALL calculate the date range from Monday to Sunday of the current week
- **AND** the system SHALL group logs by date within the week
- **AND** the system SHALL display each day with its logs and counts

#### Scenario: Week tab shows summary counts

- **WHEN** the This Week tab is displayed
- **THEN** the system SHALL display summary counts for the week (e.g., "12 progress logs and 15 commitments this week")
- **AND** each day SHALL show individual counts

#### Scenario: Week tab includes off-day indicators

- **WHEN** displaying progress logs in the This Week tab
- **THEN** logs with is_off_day=true SHALL be visually indicated
- **AND** the display SHALL mark off-day logs differently (e.g., "(off-day)" suffix)

### Requirement: This Month Tab

The system SHALL display a monthly overview with logs grouped by date and summary counts.

#### Scenario: Month tab shows monthly overview

- **WHEN** a user opens the history view and the This Month tab is selected
- **THEN** the system SHALL calculate the date range for the current month
- **AND** the system SHALL group logs by date within the month
- **AND** the system SHALL display summary counts for the month

#### Scenario: Month tab shows daily summaries

- **WHEN** the This Month tab is displayed
- **THEN** each day SHALL show counts of progress logs and commitment completions
- **AND** days with no activity SHALL be visually distinguished

### Requirement: All Items Tab

The system SHALL display all active progress items and commitments regardless of their active/scheduled day configuration.

#### Scenario: All Items shows all active items

- **WHEN** a user opens the history view and the All Items tab is selected
- **THEN** the system SHALL display all progress items with status="active"
- **AND** the system SHALL display all commitments
- **AND** the display SHALL NOT be filtered by current day

#### Scenario: All Items shows active day indicator

- **WHEN** displaying items in the All Items tab
- **THEN** each item SHALL show its active_days or scheduled_days configuration
- **AND** if the current day is included in the active days, the display SHALL indicate "Active: Mon-Fri"
- **AND** if the current day is NOT included in the active days, the display SHALL indicate "Active: Mon-Fri (not today)"

#### Scenario: All Items shows last progress

- **WHEN** displaying progress items in the All Items tab
- **THEN** each item SHALL show the timestamp of the most recent progress log
- **AND** the display SHALL show the relative time (e.g., "Last: 2 days ago")
- **AND** items with no progress SHALL show "No progress yet"

#### Scenario: All Items allows logging progress

- **WHEN** a user taps on a progress item in the All Items tab
- **THEN** the system SHALL open the item detail view
- **AND** the user SHALL be able to log progress even if the current day is not in the item's active_days

### Requirement: History Navigation

The system SHALL provide tab navigation between Today, This Week, This Month, and All Items views.

#### Scenario: Tab switching updates content

- **WHEN** a user taps on a different history tab
- **THEN** the system SHALL update the displayed content to match the selected tab
- **AND** the selected tab SHALL be visually highlighted

#### Scenario: Swipe gestures for tab navigation

- **WHEN** a user swipes horizontally on the history view
- **THEN** the system SHALL switch to the adjacent tab
- **AND** the content SHALL update to show the new time range

### Requirement: History Item Interaction

The system SHALL allow users to tap on log entries to navigate to the associated item.

#### Scenario: Tap progress log navigates to item

- **WHEN** a user taps on a progress log entry in any history tab
- **THEN** the system SHALL navigate to the detail view for the associated progress item
- **AND** the detail view SHALL show the log that was tapped

#### Scenario: Tap commitment log navigates to commitment

- **WHEN** a user taps on a commitment log entry in any history tab
- **THEN** the system SHALL navigate to the detail view for the associated commitment
- **AND** the detail view SHALL show the log that was tapped

### Requirement: History Data Filtering

The system SHALL filter history data by user ownership and only show data for the authenticated user.

#### Scenario: History shows only user's own data

- **WHEN** a user views any history tab
- **THEN** the system SHALL only show progress logs for progress items owned by the user
- **AND** the system SHALL only show commitment logs for commitments owned by the user
- **AND** data from other users SHALL NOT be visible

### Requirement: History Timestamp Display

The system SHALL display timestamps in a user-friendly relative format with absolute timestamps available on demand.

#### Scenario: Recent times show relative format

- **WHEN** a log was created less than 24 hours ago
- **THEN** the display SHALL show relative time (e.g., "2 hours ago", "30 minutes ago")

#### Scenario: Older times show date format

- **WHEN** a log was created more than 24 hours ago
- **THEN** the display SHALL show the date (e.g., "Jan 15, 2026")

#### Scenario: Empty state when no activity

- **WHEN** there are no progress logs or commitment completions for the selected time range
- **THEN** the system SHALL display an empty state message
- **AND** the message SHALL be supportive (e.g., "No progress recorded this week. That's okay - start whenever you're ready!")
