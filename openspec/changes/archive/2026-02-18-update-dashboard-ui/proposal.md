## Why

The current dashboard has a basic vertical layout with a horizontal navigation bar and simple card-based sections. The design lacks visual hierarchy, polish, and the spatial organization needed for quick daily awareness. We need to update the dashboard to match a modern layout with fixed header + sidebar navigation, a two-column content area (Eisenhower Matrix + Timeline on the left, Commitments on the right), and richer visual presentation including themed quadrant cards, a vertical timeline with descriptions, and summary widgets.

## What Changes

- **Restyle AppHeader**: Convert to a fixed top header with logo, search input, and profile dropdown (replacing horizontal nav links + action buttons)
- **Add AppSidebar**: New persistent left sidebar with navigation links (Dashboard, History, Insights, Settings) and a daily quote widget
- **Restyle DashboardView**: Two-column grid layout (8-col left, 4-col right) with a page header showing title, subtitle, and "Log Progress" action button
- **Restyle EisenhowerMatrix**: Themed quadrant cards — Do Now (primary), Schedule (sage green), Delegate (neutral), Eliminate (dashed/light) — replacing the current generic card grid
- **Restyle TimelineSection**: Vertical timeline with left-border line, dot indicators, time range spans, event titles, and descriptions (requires API to return description and endTime/time range data)
- **Restyle CommitmentsSection**: Rich commitment cards with title, track label, status icon, progress text, and action buttons instead of checkbox list
- **Add DailyFlowWidget**: New summary widget showing a small bar chart of daily activity flow
- **Update backend API**: Add `description` field to timeline events response; add `track`/category label to commitments response to support the new UI card layout
- **Add `endTime` to timeline events**: The example shows time ranges (e.g., "9:00 AM — 11:00 AM"), so the API response needs to convey endpoint or provide calculated end-time from startTime + durationMinutes

## Capabilities

### New Capabilities
- `dashboard-layout`: App-level fixed header + sidebar layout system with responsive navigation

### Modified Capabilities
- None — this is purely a frontend UI overhaul plus minor API field additions. No spec-level behavior changes to existing capabilities.

## Impact

- **Frontend**: Major visual rework of `DashboardView.vue`, `EisenhowerMatrix.vue`, `TimelineSection.vue`, `CommitmentsSection.vue`, `AppHeader.vue`. New `AppSidebar.vue` and `DailyFlowWidget.vue` components. Updated `dashboard.types.ts` for new API fields.
- **Backend**: `DashboardService` may need to include additional fields (description on timeline events, track/category on commitments) in its response. The `DashboardController` interface stays the same.
- **Tests**: Existing dashboard component specs and composable tests will need updates to match new DOM structure and data shapes.
- **Styling**: The project currently uses vanilla CSS + Tailwind classes inline. The new design introduces a specific color palette (primary blue, sage green, cream, background-light/dark) and Lexend font.
