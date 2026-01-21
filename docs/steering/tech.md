# Daily Progress - Technology Stack

## Backend Stack

- **Runtime**: Bun (JavaScript/TypeScript runtime and package manager)
- **Framework**: Hono (lightweight web framework)
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis for performance optimization
- **Authentication**: JWT with bcrypt password hashing
- **Validation**: Zod for request/response validation
- **Logging**: Winston for structured logging
- **Testing**: Bun test runner with TDD approach

## JWT Authentication

### Token Configuration

- **Algorithm**: HS256
- **Token Lifetime**: 7 days (initial implementation)
- **Secret**: Stored in environment variable `JWT_SECRET`
- **Payload**: `{ sub: userId, email, iat, exp }`

### Token Storage (Frontend)

- **Phase 1**: Stored in localStorage for simplicity
- **Production Enhancement**: HTTP-only cookies recommended

### Password Security

- **Hashing**: bcrypt with 10 salt rounds
- **Requirements**: 8+ chars, uppercase, lowercase, number, special character

### Refresh Tokens

**Documentation**: See `docs/enhancements/jwt-refresh-token.md` for planned implementation of:

- Short-lived access token (15 min)
- Long-lived refresh token (7 days)
- Refresh token rotation
- Token revocation

## Frontend Stack

- **Framework**: Vue 3 with TypeScript and Composition API
- **Build Tool**: Vite for fast development and optimized builds
- **Routing**: Vue Router v4 with authentication guards
- **State Management**: Pinia for global state
- **Styling**: Tailwind CSS with CSS variables for theming
- **Forms**: VueUse for form handling and validation
- **PWA**: Vite PWA plugin for offline capabilities
- **Offline Storage**: IndexedDB with Dexie.js
- **Testing**: Vitest + Vue Test Utils + Playwright for E2E

## Architecture Patterns

- **Backend**: Modular architecture with dependency injection
- **Frontend**: Feature-based folder structure with composables
- **API**: RESTful endpoints with standardized response format
- **Offline-First**: PWA with sync queue for offline actions
- **TDD**: Test-driven development for all features

## Development Commands

### Backend Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Run tests
bun test

# Run tests with coverage
bun test --coverage

# Database operations
bunx prisma migrate dev
bunx prisma generate
bunx prisma studio
```

### Frontend Development

```bash
# Install dependencies
bun install

# Start development server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run unit tests
bun run test

# Run E2E tests
bun run test:e2e
```

### Docker Development

```bash
# Start databases (PostgreSQL + Redis)
docker-compose up -d

# Stop databases
docker-compose down

# View logs
docker-compose logs -f
```

## Database Schema

- **Users**: Authentication and profile data
- **User Preferences**: Default settings and theme preferences
- **Timeline Events**: Time-anchored events with recurrence patterns
- **Progress Items**: Eisenhower Matrix items with active days
- **Progress Logs**: Progress entries with notes and timestamps
- **Commitments**: Recurring routines with scheduled days
- **Commitment Logs**: Completion records with timestamps

## API Conventions

- **Base URL**: `/api/`
- **Authentication**: Bearer token in Authorization header
- **Response Format**: `{ data: {...} }` for success, `{ error: {...} }` for errors
- **Status Codes**: Standard HTTP codes (200, 201, 400, 401, 404, 500)
- **Validation**: Zod schemas for all request/response validation
- **Error Handling**: Centralized error middleware with structured logging

## Offline Sync Strategy

- **Client**: IndexedDB for local storage, sync queue for offline actions
- **Server**: Sync endpoint processes batched changes
- **Conflict Resolution**: Last-write-wins based on timestamps
- **PWA**: Service worker for offline capabilities and caching
