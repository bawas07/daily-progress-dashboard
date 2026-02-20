# Daily Dashboard Specification

## Purpose
Define requirements for the daily dashboard capability.

## Requirements

### Requirement: Unified Daily Interface

The system SHALL provide a single dashboard view that aggregates timeline events, progress items, and commitments for the current day.

#### Scenario: Dashboard shows all sections

- **WHEN** a user opens the application on any day
- **THEN** the dashboard SHALL display three sections: Timeline, Progress Items, and Commitments
- **AND** each section SHALL show only items relevant to the current day

#### Scenario: Dashboard shows current date

- **WHEN** the dashboard is displayed
- **THEN** the current date SHALL be prominently displayed at the top
- **AND** the date format SHALL be user-friendly (e.g., "Monday, January 20, 2026")

### Requirement: Timeline Section

The system SHALL display a Timeline Events section showing time-anchored events for the current day in chronological order.

#### Scenario: Timeline section shows events

- **WHEN** the dashboard is loaded and there are timeline events scheduled for the current day
- **THEN** the Timeline section SHALL display events sorted by start_time ascending
- **AND** each event SHALL show title, start time, and duration

#### Scenario: Timeline section supports collapse

- **WHEN** the user taps on the Timeline section header
- **THEN** the section SHALL collapse to hide event details
- **AND** the section SHALL expand when tapped again

#### Scenario: Empty timeline state

- **WHEN** there are no timeline events scheduled for the current day
- **THEN** the Timeline section SHALL display an empty state message
- **AND** the message SHALL say "No events scheduled today"

### Requirement: Progress Items Section

The system SHALL display a Progress Items section organized by Eisenhower Matrix quadrants.

#### Scenario: Progress items grouped by quadrant

- **WHEN** the dashboard is loaded and there are active progress items scheduled for the current day
- **THEN** the items SHALL be grouped into four quadrants:
  - Important & Urgent (importance="high" AND urgency="high")
  - Important & Not Urgent (importance="high" AND urgency="low")
  - Not Important & Urgent (importance="low" AND urgency="high")
  - Not Important & Not Urgent (importance="low" AND urgency="low")
- **AND** quadrants SHALL be displayed in priority order

#### Scenario: Each item shows metadata

- **WHEN** a progress item is displayed in the matrix
- **THEN** the item SHALL show the title
- **AND** the item SHALL show the most recent progress (timestamp and note excerpt)
- **AND** if the item has a deadline, the deadline SHALL be displayed
- **AND** overdue deadlines SHALL be visually indicated

#### Scenario: Progress items section supports collapse

- **WHEN** the user taps on the Progress Items section header
- **THEN** the section SHALL collapse to hide quadrant details
- **AND** the section SHALL expand when tapped again

#### Scenario: Empty progress items state

- **WHEN** there are no progress items scheduled for the current day
- **THEN** the Progress Items section SHALL display a supportive empty state
- **AND** the message SHALL explain "Your weekday items are taking a break. You can too."
- **AND** a link SHALL be provided: "→ View all items in History"

#### Scenario: Weekend progress items empty state

- **WHEN** the current day is a weekend day (Saturday or Sunday)
- **AND** there are no progress items with active_days including the current day
- **THEN** the Progress Items section SHALL display the supportive empty state
- **AND** the system SHALL encourage rest rather than guilt

### Requirement: Commitments Section

The system SHALL display a Commitments section showing recurring routines with checkboxes for completion tracking.

#### Scenario: Commitments displayed with checkboxes

- **WHEN** the dashboard is loaded and there are commitments scheduled for the current day
- **THEN** the Commitments section SHALL display each commitment
- **AND** each commitment SHALL show a checkbox for completion
- **AND** completed commitments SHALL show a checked state
- **AND** uncompleted commitments SHALL show an unchecked state

#### Scenario: Checkbox triggers completion

- **WHEN** a user taps on an unchecked commitment checkbox
- **THEN** the system SHALL create a commitment_log entry
- **AND** the checkbox SHALL change to checked state
- **AND** a success message SHALL be displayed

#### Scenario: Already completed commitment shows completed

- **WHEN** a commitment has already been completed today
- **THEN** the checkbox SHALL be pre-filled with checked state
- **AND** tapping the checkbox again SHALL log additional activity
- **AND** the system SHALL display "Already completed today" info

#### Scenario: Commitments section supports collapse

- **WHEN** the user taps on the Commitments section header
- **THEN** the section SHALL collapse to hide commitment details
- **AND** the section SHALL expand when tapped again

#### Scenario: Empty commitments state

- **WHEN** there are no commitments scheduled for the current day
- **THEN** the Commitments section SHALL display a minimal state or be hidden
- **AND** no commitment section SHALL be displayed if there are no commitments at all

### Requirement: Dashboard Data Loading

The system SHALL fetch all dashboard data from the API when the dashboard is loaded or refreshed.

#### Scenario: Dashboard loads data on mount

- **WHEN** the dashboard component is mounted
- **THEN** the system SHALL make API calls to fetch timeline events, progress items, and commitments for the current day
- **AND** a loading indicator SHALL be displayed while data is being fetched
- **AND** the loading indicator SHALL be hidden when all data has loaded

#### Scenario: Dashboard refresh updates all sections

- **WHEN** the user triggers a manual refresh (pull to refresh or refresh button)
- **THEN** the system SHALL fetch fresh data for all sections
- **AND** all sections SHALL update with the latest data

#### Scenario: API error handling

- **WHEN** an API call fails while loading dashboard data
- **THEN** the system SHALL display an error message
- **AND** the error message SHALL be user-friendly
- **AND** the system SHALL provide a retry option

### Requirement: Dashboard Responsive Design

The dashboard SHALL be responsive and optimized for mobile viewing while working on all screen sizes.

#### Scenario: Mobile layout optimized for small screens

- **WHEN** the dashboard is viewed on a mobile device
- **THEN** sections SHALL be displayed vertically stacked
- **AND** touch targets SHALL be at least 44x44 pixels for easy tapping

#### Scenario: Tablet/desktop layout may use horizontal space

- **WHEN** the dashboard is viewed on a larger screen
- **THEN** sections MAY be displayed in multiple columns if space allows
- **AND** the layout SHALL remain usable on all screen sizes

### Requirement: Dashboard Actions

The system SHALL provide quick action buttons for common operations from the dashboard.

#### Scenario: Add new item button

- **WHEN** the user taps a "+" button on the dashboard
- **THEN** the system SHALL display an item type chooser (Timeline Event, Progress Item, Commitment)
- **AND** selecting an option SHALL open the appropriate creation form

#### Scenario: Quick tap on item navigates to detail

- **WHEN** the user taps on a progress item or timeline event
- **THEN** the system SHALL navigate to the item detail view
- **AND** the detail view SHALL allow logging progress or editing details

#### Scenario: Quick tap on commitment logs completion

- **WHEN** the user taps on a commitment checkbox
- **THEN** the system SHALL log completion and update the checkbox state
- **AND** the user SHALL remain on the dashboard

### Requirement: Dashboard Day Navigation

The system SHALL allow users to navigate to different days to view or manage items for other dates.

#### Scenario: Date selector changes dashboard content

- **WHEN** the user selects a different date from a date picker
- **THEN** the dashboard SHALL refresh to show items for the selected date
- **AND** the selected date SHALL be displayed at the top of the dashboard

#### Scenario: Return to today button

- **WHEN** the user taps a "Today" button
- **THEN** the dashboard SHALL refresh to show items for the current date
- **AND** the date selector SHALL reset to the current date
