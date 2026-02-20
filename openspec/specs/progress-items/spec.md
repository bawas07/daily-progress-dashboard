# Progress Items Specification

## Purpose
Define requirements for the progress items capability.

## Requirements

### Requirement: Create Progress Item

The system SHALL allow users to create progress items with title, importance, urgency, active days, and optional deadline. Items SHALL be automatically assigned to Eisenhower Matrix quadrants based on importance and urgency values.

#### Scenario: Successful progress item creation

- **WHEN** a user provides a title, importance (high/low), urgency (high/low), and at least one active day
- **THEN** the system SHALL create a new progress item
- **AND** the system SHALL set the status to "active"
- **AND** the system SHALL return the created item with generated ID

#### Scenario: Progress item with optional deadline

- **WHEN** a user creates a progress item with a deadline date
- **THEN** the system SHALL store the deadline date
- **AND** the deadline SHALL be displayed in the item detail

#### Scenario: Progress item without deadline

- **WHEN** a user creates a progress item without specifying a deadline
- **THEN** the system SHALL create the item with a null deadline value
- **AND** the item SHALL function normally without a deadline

#### Scenario: Progress item validation fails with missing title

- **WHEN** a user attempts to create a progress item without a title
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the field SHALL be specified as "title"
- **AND** the error message SHALL indicate "Title is required"

#### Scenario: Progress item validation fails with no active days

- **WHEN** a user attempts to create a progress item with zero active days selected
- **THEN** the system SHALL return an error response with code "E002"
- **AND** the field SHALL be specified as "activeDays"
- **AND** the error message SHALL indicate "Select at least one active day"

### Requirement: Eisenhower Matrix Classification

The system SHALL categorize progress items into four quadrants based on importance and urgency combinations.

#### Scenario: Important and Urgent quadrant

- **WHEN** a progress item has importance="high" and urgency="high"
- **THEN** the item SHALL be displayed in the "Important & Urgent" quadrant
- **AND** this quadrant SHALL be displayed first in the matrix

#### Scenario: Important and Not Urgent quadrant

- **WHEN** a progress item has importance="high" and urgency="low"
- **THEN** the item SHALL be displayed in the "Important & Not Urgent" quadrant
- **AND** this quadrant SHALL be displayed second in the matrix

#### Scenario: Not Important and Urgent quadrant

- **WHEN** a progress item has importance="low" and urgency="high"
- **THEN** the item SHALL be displayed in the "Not Important & Urgent" quadrant
- **AND** this quadrant SHALL be displayed third in the matrix

#### Scenario: Not Important and Not Urgent quadrant

- **WHEN** a progress item has importance="low" and urgency="low"
- **THEN** the item SHALL be displayed in the "Not Important & Not Urgent" quadrant
- **AND** this quadrant SHALL be displayed fourth in the matrix

### Requirement: Update Progress Item

The system SHALL allow users to update progress item properties. Changes to importance or urgency SHALL move the item to a different quadrant.

#### Scenario: Successful progress item update

- **WHEN** a user updates a progress item with valid data
- **THEN** the system SHALL update the item in the database
- **AND** the system SHALL update the updated_at timestamp
- **AND** the system SHALL return the updated item

#### Scenario: Quadrant change on importance update

- **WHEN** a user updates a progress item's importance from "low" to "high"
- **THEN** the item SHALL be moved to the appropriate quadrant based on the new importance and current urgency
- **AND** the item SHALL appear in the new quadrant on the dashboard

#### Scenario: Quadrant change on urgency update

- **WHEN** a user updates a progress item's urgency from "low" to "high"
- **THEN** the item SHALL be moved to the appropriate quadrant based on the current importance and new urgency
- **AND** the item SHALL appear in the new quadrant on the dashboard

#### Scenario: Update validation uses same rules as creation

- **WHEN** a user updates a progress item
- **THEN** the system SHALL validate the title is not empty
- **AND** the system SHALL validate at least one active day is selected
- **AND** validation failures SHALL return appropriate error responses

### Requirement: Settle Progress Item

The system SHALL allow users to mark progress items as settled. Settled items SHALL be removed from the active dashboard but preserved in history.

#### Scenario: Successful settle operation

- **WHEN** a user marks a progress item as settled
- **THEN** the system SHALL update the item's status to "settled"
- **AND** the system SHALL update the updated_at timestamp
- **THEN** the item SHALL no longer appear in the dashboard's progress items section
- **AND** the item SHALL remain visible in the history "All Items" view

#### Scenario: Settled items cannot be un-settled

- **WHEN** a progress item has status="settled"
- **THEN** the item SHALL NOT appear in the active dashboard
- **AND** there SHALL BE NO functionality to change status back to "active" in Phase 1

### Requirement: List Progress Items

The system SHALL allow users to list their progress items with pagination support.

#### Scenario: List returns paginated results

- **WHEN** a user requests progress items with page and limit parameters
- **THEN** the system SHALL return progress items for the user
- **AND** the response SHALL include pagination metadata (total, perPage, currentPage, lastPage)
- **AND** results SHALL be sorted by updated_at in descending order

#### Scenario: List filters by user ownership

- **WHEN** a user requests progress items
- **THEN** the system SHALL only return items where user_id matches the authenticated user
- **AND** the system SHALL NOT return items belonging to other users

### Requirement: Active Days Filtering

The system SHALL only show progress items on the dashboard when the current day matches the item's active days configuration.

#### Scenario: Item appears on active day

- **WHEN** the current day is "Monday" and a progress item has active_days including "mon"
- **THEN** the item SHALL appear in the dashboard's progress items section
- **AND** the item SHALL be grouped into the appropriate quadrant

#### Scenario: Item hidden on inactive day

- **WHEN** the current day is "Saturday" and a progress item has active_days of ["mon", "tue", "wed", "thu", "fri"]
- **THEN** the item SHALL NOT appear in the dashboard's progress items section
- **AND** a supportive empty state message SHALL be displayed if no items are scheduled for the day

#### Scenario: Weekend item appears on weekend

- **WHEN** the current day is "Saturday" and a progress item has active_days including "sat"
- **THEN** the item SHALL appear in the dashboard's progress items section

### Requirement: Progress Item Metadata

The system SHALL maintain creation and modification timestamps for each progress item.

#### Scenario: Created at timestamp on creation

- **WHEN** a progress item is created
- **THEN** the created_at timestamp SHALL be set to the current time
- **AND** the created_at timestamp SHALL never be modified

#### Scenario: Updated at timestamp on modification

- **WHEN** a progress item is updated
- **THEN** the updated_at timestamp SHALL be set to the current time
- **AND** logging progress on the item SHALL also update the updated_at timestamp

### Requirement: Progress Item Ownership

The system SHALL enforce user ownership of progress items. Users SHALL only access their own items.

#### Scenario: Users can only access their own items

- **WHEN** a user requests a progress item by ID
- **THEN** the system SHALL verify the item's user_id matches the authenticated user's ID
- **AND** if the user IDs do not match, the system SHALL return an error response with HTTP status 404
- **AND** the error message SHALL NOT indicate whether the item exists or belongs to another user

#### Scenario: Cascade delete on user deletion

- **WHEN** a user account is deleted
- **THEN** all progress items owned by that user SHALL be cascade deleted
- **AND** all progress logs associated with those items SHALL be cascade deleted
