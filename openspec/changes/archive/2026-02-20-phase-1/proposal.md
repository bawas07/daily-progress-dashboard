# Phase 1: Core Features Implementation

## Why

Traditional todo systems surface items only near deadlines, punish inconsistency with guilt, and fail to help users maintain awareness of ongoing responsibilities. We need to build the foundation of Daily Progress — a calm, daily-first system that helps individuals make consistent progress on long-term work through daily visibility, incremental progress tracking, and memory support.

**Core Philosophy**: "Progress is acknowledged, not judged." This is a memory and progress support system, not a productivity tracker with gamification, streaks, or performance measurement.

## What Changes

### Backend Implementation (Bun + Hono)
- Implement modular backend architecture with dependency injection
- Create 7 feature modules: auth, progress, commitment, timeline, user, dashboard, history
- Build RESTful API with standardized response format (Sxxx for success, Exxx for errors)
- JWT authentication with short-lived access tokens (15 minutes) and refresh token rotation
- bcrypt password hashing (10 salt rounds)
- Prisma ORM for PostgreSQL database operations
- Zod validation for all request/response schemas
- Winston logging for structured error tracking

### Frontend Implementation (Vue 3)
- Build web application with responsive design
- Implement feature-based folder structure aligned with backend modules
- Create daily dashboard with collapsible sections (timeline, progress items, commitments)
- Eisenhower Matrix component with 4 quadrants for progress items
- History view with Today, This Week, This Month, and All Items tabs
- Settings screen for user preferences (theme, timezone, default active days)
- API-based data fetching (no offline storage in Phase 1)
- Automatic token refresh when access token expires

### Database Schema
- 8 tables: users, user_preferences, refresh_tokens, timeline_events, progress_items, progress_logs, commitments, commitment_logs
- Row-level security policies for user data isolation
- Foreign key cascades for data consistency
- JSONB fields for arrays (active_days, scheduled_days, days_of_week)
- Refresh token table for token rotation and revocation

### 10 Core Requirements
1. **User Authentication**: Secure login/signup with JWT refresh tokens, email validation, password strength requirements, automatic token refresh
2. **Daily Dashboard**: Single view aggregating timeline events, progress items, and commitments for the current day via API
3. **Progress Items**: Eisenhower Matrix organization with importance/urgency classification, active days scheduling, optional deadlines
4. **Progress Logging**: Append-only progress tracking with optional notes (1000 char max), off-day flag support
5. **Commitments**: Recurring routines with scheduled days, multiple activity logs per day allowed
6. **Timeline Events**: Time-anchored events with recurrence patterns (one-time, daily, weekly, custom)
7. **History View**: Multi-tab view (Today, Week, Month, All Items) with progress and commitment logs
8. **User Preferences**: Customizable default active days, theme (light/dark/auto), timezone, notifications
9. **Error Handling**: Field-level validation, user-friendly error messages, explicit confirmations for destructive actions
10. **API Standards**: Standardized response codes, 2-second response time SLA, pagination metadata, operation logging

## Capabilities

### New Capabilities

- `user-auth`: User registration with email validation, login with short-lived JWT access tokens (15 min) and long-lived refresh tokens (7 days), password hashing with bcrypt (10 rounds), automatic token rotation on refresh, token revocation on logout, secure password requirements (8+ chars, uppercase, lowercase, number)
- `progress-items`: Full CRUD for progress items with Eisenhower Matrix classification (importance: high/low, urgency: high/low), active days scheduling (mon-sun selection), optional deadlines, status management (active/settled), automatic quadrant assignment
- `progress-logging`: Create progress logs with optional notes (max 1000 chars), append-only history (never edited), off-day flag for non-active day logging, multiple logs per day allowed, sorted by logged_at DESC
- `timeline-events`: Create time-anchored events with title, start time, duration (default 30min), recurrence patterns (one-time, daily, weekly, custom), days_of_week for weekly patterns, status management (active/settled)
- `commitments`: Create recurring routines with title, scheduled days (mon-sun selection), multiple activity logs per day with optional notes, cascade delete of logs when commitment deleted
- `history-view`: Today tab with current date logs, Week tab with calendar grouping and summary counts, Month tab with monthly overview, All Items tab showing all active items regardless of active days
- `daily-dashboard`: Unified daily interface with Timeline section (chronological events), Progress Items section (4 quadrants: Important×Urgent, Important×Not Urgent, Not Important×Urgent, Not Important×Not Urgent), Commitments section with checkboxes
- `user-preferences`: Default active days (applies to new items only), theme selection (light/dark/auto with immediate application), timezone setting (recalculates day boundaries), notification preferences
- `token-refresh`: Automatic refresh token rotation, refresh token can only be used once (new refresh token issued on each refresh), refresh token revocation on logout, backend refresh token storage for validation and revocation

### Modified Capabilities

None (initial implementation)

## Impact

**Technology Stack:**

**Backend:**
- Bun runtime for JavaScript/TypeScript execution
- Hono framework for lightweight HTTP server
- Prisma ORM for type-safe database operations
- PostgreSQL for persistent data storage (includes refresh_tokens table)
- JWT (HS256) for authentication: access tokens (15 min), refresh tokens (7 days)
- bcrypt with 10 salt rounds for password hashing
- Zod for request/response validation
- Winston for structured logging
- Bun test runner for TDD approach

**Frontend:**
- Vue 3 with Composition API and TypeScript
- Vite for fast development and optimized builds
- Vue Router v4 with authentication guards
- Pinia for global state management
- Tailwind CSS with CSS variables for theming
- VueUse for form handling and validation
- Axios or fetch API for HTTP requests
- Vitest + Vue Test Utils for unit testing
- Playwright for E2E testing

**Infrastructure:**
- Docker Compose for PostgreSQL container
- Environment-based configuration
- CORS configuration for API access
- HTTPS/TLS encryption for production

**Affected Code:**
- **Backend API**: 7 modules with controllers, services, repositories following modular architecture pattern, plus refresh token module
- **Frontend**: 7 feature modules with components, composables, services following feature-first organization, plus auth store for token management
- **Database**: Complete schema with 8 tables (added refresh_tokens), indexes for foreign keys and frequently queried fields
- **Authentication**: JWT-based session management with access/refresh token pattern, automatic token refresh middleware
- **API Client**: HTTP interceptor to handle 401 responses and automatic token refresh

**Architecture Patterns:**
- **Backend**: Modular architecture with dependency injection, separation of concerns (controller→service→repository), centralized error handling
- **Frontend**: Feature-based folder structure, composables for shared logic, API services with standardized response handling and automatic token refresh
- **API**: RESTful endpoints with `/api/` base URL, bearer token authentication (access token), standardized response format
- **Token Flow**: Client stores access + refresh tokens, uses access token for API calls, automatically refreshes when 401 received, logout revokes refresh token
- **TDD**: Tests written before implementation for all features

**Authentication Flow:**
1. User logs in → Server returns access token (15min) + refresh token (7 days)
2. Client uses access token for API calls
3. Access token expires (15min) → Client receives 401 → Client calls `/api/auth/refresh` with refresh token
4. Server validates refresh token, returns new access token + new refresh token (rotation)
5. Refresh token can only be used once (prevents token replay attacks)
6. User logs out → Server revokes refresh token

**Systems:**
- New modular backend with dependency injection container
- New web frontend with responsive design
- New authentication system with JWT access/refresh token pattern
- New token refresh system with automatic rotation
- New notification system for daily reminders (planned)

**Deferred to Future Phase:**
- Offline-first capabilities (IndexedDB, service workers, sync queue)
- HTTP-only cookies for token storage (Phase 1 uses localStorage/memory)
- Multi-device session management (single device assumed in Phase 1)
