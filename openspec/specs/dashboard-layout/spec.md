## ADDED Requirements

### Requirement: App Shell Layout
The application SHALL provide an AppShell layout component that renders a fixed top header and a persistent left sidebar for all authenticated pages. The main content area SHALL be positioned to the right of the sidebar and below the header.

#### Scenario: Authenticated user sees shell layout
- **WHEN** an authenticated user navigates to any protected route
- **THEN** the fixed header SHALL be visible at the top with logo, search input placeholder, and user profile dropdown
- **AND** the sidebar SHALL be visible on the left with navigation links (Dashboard, History, Insights, Settings)

#### Scenario: Sidebar navigation highlights active route
- **WHEN** the user is on the Dashboard page
- **THEN** the Dashboard link in the sidebar SHALL be visually highlighted as active

### Requirement: Dashboard Page Header
The dashboard page SHALL display a page header with a title ("Today's Awareness"), a subtitle ("Gently moving forward, one step at a time."), and a "Log Progress" action button.

#### Scenario: Dashboard header renders
- **WHEN** the dashboard page loads
- **THEN** the page header SHALL display the title, subtitle, and a "Log Progress" button

### Requirement: Eisenhower Matrix Themed Quadrants
The Eisenhower Matrix section SHALL display four visually distinct quadrant cards: "Do Now" (primary theme), "Schedule" (sage/green theme), "Delegate" (neutral theme), and "Eliminate" (light/dashed theme). Each quadrant SHALL list its progress items as styled cards.

#### Scenario: Matrix quadrants render with themed styling
- **WHEN** progress items exist for the current day
- **THEN** the matrix SHALL render four themed quadrant cards with items listed inside each

#### Scenario: Empty quadrant shows placeholder
- **WHEN** a quadrant has no progress items
- **THEN** the quadrant SHALL display a placeholder message

### Requirement: Vertical Timeline with Time Ranges
The timeline section SHALL display events as a vertical timeline with a left border line, circular dot indicators, time range labels (e.g., "9:00 AM — 11:00 AM"), event titles, and event descriptions.

#### Scenario: Timeline events render with time ranges and descriptions
- **WHEN** timeline events exist for the current day
- **THEN** each event SHALL display its start time, end time (computed from startTime + durationMinutes), title, and description

#### Scenario: Timeline empty state
- **WHEN** no timeline events exist for the current day
- **THEN** the timeline SHALL display an empty-state message

### Requirement: Rich Commitment Cards
The commitments section SHALL display each commitment as a rich card with the commitment title, a track/category label, a status icon (check for completed, hourglass for pending), progress text, and an action button.

#### Scenario: Completed commitment card
- **WHEN** a commitment is completed for today
- **THEN** the card SHALL show a check icon, "Progress: Steady" text, and an "Edit Entry" action button

#### Scenario: In-progress commitment card
- **WHEN** a commitment is not yet completed for today
- **THEN** the card SHALL show a pending icon, "Progress: In Progress" text, and a "Log Work" action button

### Requirement: Daily Flow Widget
The dashboard right column SHALL display a Daily Flow summary widget showing a simple bar chart visualization of daily activity flow.

#### Scenario: Daily Flow widget renders
- **WHEN** the dashboard loads with commitment and progress data
- **THEN** a Daily Flow widget SHALL render with bar chart visualization and a summary message

### Requirement: Backend Timeline Event endTime
The backend dashboard API SHALL return an `endTime` field on each timeline event, computed as `startTime + durationMinutes`.

#### Scenario: API returns endTime on timeline events
- **WHEN** a client requests `GET /api/dashboard?date=YYYY-MM-DD`
- **THEN** each event in `timeline.events` SHALL include an `endTime` string field representing the computed end time

### Requirement: Backend Timeline Event Description
The backend dashboard API SHALL return a `description` field on each timeline event (may be null if no description is set).

#### Scenario: API returns description on timeline events
- **WHEN** a client requests `GET /api/dashboard?date=YYYY-MM-DD`
- **THEN** each event in `timeline.events` SHALL include a `description` field (string or null)
