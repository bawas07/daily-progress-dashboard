## 1. Backend API Updates

- [x] 1.1 Update `DashboardService` to include `endTime` (computed from `startTime + durationMinutes`) and `description` fields on timeline events
- [x] 1.2 Update backend `DashboardData` and `TimelineEvent` interfaces to include the new fields
- [x] 1.3 Add/update backend unit tests for `DashboardService` covering `endTime` and `description`

## 2. Tailwind Theme & Font Setup

- [x] 2.1 Extend Tailwind config with new colors (`primary`, `sage`, `cream`, `background-light`, `background-dark`, `neutral-soft`) and Lexend font
- [x] 2.2 Install Lexend font (Google Fonts import)

## 3. App Shell Layout

- [x] 3.1 Create `AppSidebar.vue` component with navigation links (Dashboard, History, Progress, Settings) and daily quote widget
- [x] 3.2 Refactor `AppHeader.vue` into a fixed top header with logo, search input placeholder, and profile dropdown
- [x] 3.3 Create `AppShell.vue` layout component combining header + sidebar + main content area
- [x] 3.4 Update `App.vue` to use `AppShell` for authenticated routes

## 4. Dashboard View Rework

- [x] 4.1 Update `DashboardView.vue` to use two-column grid layout (8-col left, 4-col right) with page header (title, subtitle, "Log Progress" button)
- [x] 4.2 Update `DashboardView.spec.ts` for new layout structure

## 5. Eisenhower Matrix Restyle

- [x] 5.1 Update `EisenhowerMatrix.vue` with themed quadrant cards: Do Now (primary), Schedule (sage), Delegate (neutral), Eliminate (dashed/light)
- [x] 5.2 Update `EisenhowerMatrix.spec.ts` for new DOM structure

## 6. Timeline Section Restyle

- [x] 6.1 Update `DashboardTimelineEvent` type to include `endTime` and `description` fields
- [x] 6.2 Update `TimelineSection.vue` to vertical timeline with left border, dot indicators, time range labels, titles, and descriptions
- [x] 6.3 Update `TimelineSection.spec.ts` for new DOM structure and data expectations

## 7. Commitments Section Restyle

- [x] 7.1 Update `CommitmentsSection.vue` to rich commitment cards with title, track label, status icon, progress text, and action buttons
- [x] 7.2 Update `CommitmentsSection.spec.ts` for new card structure

## 8. Daily Flow Widget

- [x] 8.1 Create `DailyFlowWidget.vue` component with bar chart visualization and summary message
- [x] 8.2 Add tests for `DailyFlowWidget`
- [x] 8.3 Integrate widget into `DashboardView` right column

## 9. Verification

- [x] 9.1 Run all backend tests (`npm test` in `repos/backend`)
- [x] 9.2 Run all frontend tests (`npm test` in `repos/frontend`)
- [ ] 9.3 Visual check in browser to confirm layout matches example
