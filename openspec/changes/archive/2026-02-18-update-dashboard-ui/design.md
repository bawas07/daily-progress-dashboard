## Context

The current dashboard uses a simple vertical layout: a horizontal `AppHeader` bar with inline nav links, followed by stacked sections (Timeline → EisenhowerMatrix → Commitments) in a single-column `max-w-7xl` container. The existing backend API returns timeline events (id, title, startTime, durationMinutes), progress items grouped by Eisenhower quadrants, and commitments with completion status — all via `GET /api/dashboard?date=YYYY-MM-DD`.

The target design (see `example/dashboard.html`) introduces a fixed header + persistent sidebar layout with a two-column content grid (8-col + 4-col). The Eisenhower Matrix uses themed quadrant cards, the timeline becomes a vertical line with dot indicators and time ranges, and commitments move to a right-sidebar panel with rich cards. A "Daily Flow" summary widget is also added.

Tech stack: Vue 3 + TypeScript frontend, Hono backend with TypeScript, Tailwind CSS for styling.

## Goals / Non-Goals

**Goals:**
- Restyle the dashboard to match the example HTML design with fixed header, sidebar, two-column layout
- Update `EisenhowerMatrix`, `TimelineSection`, `CommitmentsSection` to match the new visual design
- Add `AppSidebar` component and `DailyFlowWidget` component
- Update backend API response to include `description` on timeline events so the timeline can show event descriptions
- Compute and return `endTime` (derived from `startTime + durationMinutes`) on timeline events for time-range display
- Update frontend types to match any API additions
- Update existing tests to match new DOM structure

**Non-Goals:**
- Implementing dark mode toggle (design includes dark-mode classes but we won't add the toggle mechanism)
- Adding search functionality (search bar is in the header visually but won't be wired up)
- Adding the "Insights" page (sidebar link exists but is not part of this change)
- Implementing the "Log Progress" modal/flow (button is present but action is out of scope)
- Changing data models/database schema — the `description` field already exists on timeline events in the DB; we just need to pass it through the API

## Decisions

### 1. Layout Architecture: App-level Shell vs. Per-page Layout

**Decision**: Create an `AppShell.vue` layout component used by authenticated routes, containing the fixed header and sidebar. `DashboardView` becomes the content rendered inside this shell.

**Rationale**: The sidebar + header are shared across all authenticated pages. Moving layout to an App-level shell avoids duplicating sidebar/header in every view. The existing `AppHeader.vue` will be refactored into the shell's header section.

**Alternative considered**: Keeping layout per-page — rejected because sidebar navigation would need to be duplicated or imported everywhere.

### 2. Tailwind CSS with Custom Theme

**Decision**: Extend the existing Tailwind config with the specific color palette from the example (primary `#135bec`, sage `#789482`, cream `#fdfcf8`, background-light `#f6f6f8`, background-dark `#101622`) and Lexend font family.

**Rationale**: The example uses these exact values and they create a cohesive visual identity. Adding them to the Tailwind config keeps styling consistent and maintainable.

### 3. Timeline endTime Calculation

**Decision**: Compute `endTime` on the backend (in `DashboardService`) from `startTime + durationMinutes` rather than requiring the frontend to calculate it.

**Rationale**: Keeps presentation logic on the server side and simplifies the frontend template. The durationMinutes field is still returned for other potential uses.

### 4. Commitment Track/Category Display

**Decision**: Use existing commitment data fields to derive the "track" label shown in the example. If commitments don't have a dedicated `track` field in the DB, use a simple placeholder derived from commitment metadata.

**Rationale**: Avoids a database migration for a purely cosmetic label. Can be enhanced later when a proper categorization system is built.

### 5. DailyFlowWidget as Static/Decorative

**Decision**: The Daily Flow widget will be a presentational component that computes simple bar heights from the existing commitment/progress completion data, rather than requiring a new API endpoint.

**Rationale**: The widget is motivational/decorative. Computing it from existing data avoids API complexity. Can be upgraded to pull real analytics data later.

## Risks / Trade-offs

- **Test churn**: All dashboard component tests will need updates due to new DOM structure and removed Card/Badge component usage → Mitigated by updating tests in the same tasks as component changes.
- **AppHeader refactor impact**: Other pages currently use `AppHeader` → Mitigated by keeping backward-compatible props or migrating all pages to use `AppShell` layout.
- **Tailwind version compatibility**: The example uses CDN Tailwind; our project may use a different version → Mitigated by using standard utility classes that work across Tailwind v3+.
