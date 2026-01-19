# Daily Progress - Project Structure

## Repository Organization

```
daily-progress/
├── docs/                    # Project documentation
│   ├── specs/               # Feature specifications
│   └── steering/            # Project steering rules
│   ├── PRD.md              # Product Requirements Document
│   ├── SCHEMA.md           # Database schema documentation
│   ├── USER_FLOW.md        # User journey flows
│   └── WIREFRAME.md        # UI wireframes and layouts
├── repos/                   # Main application code
│   ├── backend/            # Bun + Hono API server
│   └── frontend/           # Vue 3 + Vite PWA client
├── automation_tests/       # End-to-end test scenarios
├── external_information/   # Third-party documentation
└── self/                   # AI assistant identity docs
```

## Backend Structure (`repos/backend/`)

```
backend/
├── src/
│   ├── modules/            # Feature modules
│   │   ├── auth/          # Authentication (users, JWT, sessions)
│   │   ├── progress/      # Progress items and logging
│   │   ├── commitments/   # Commitments and completion tracking
│   │   ├── timeline/      # Timeline events with recurrence
│   │   ├── dashboard/     # Dashboard data aggregation
│   │   ├── history/       # Historical data and analytics
│   │   └── sync/          # Offline sync functionality
│   ├── shared/            # Shared utilities and services
│   │   ├── database/      # Prisma client and connection
│   │   ├── middleware/    # Authentication, validation, errors
│   │   ├── services/      # JWT, logging, response helpers
│   │   └── types/         # TypeScript type definitions
│   ├── app.ts             # Hono app setup and route registration
│   └── server.ts          # Server startup and configuration
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   └── migrations/        # Database migration files
├── tests/                 # Test files (unit and integration)
├── docker-compose.yml     # PostgreSQL and Redis containers
└── package.json           # Dependencies and scripts
```

## Frontend Structure (`repos/frontend/`)

```
frontend/
├── src/
│   ├── features/          # Feature-based modules
│   │   ├── auth/         # Login, register, password reset
│   │   ├── dashboard/    # Main dashboard with all sections
│   │   ├── progress/     # Progress items management
│   │   ├── commitments/  # Commitments management
│   │   ├── timeline/     # Timeline events management
│   │   ├── history/      # History views and analytics
│   │   └── settings/     # User preferences and account
│   ├── shared/           # Reusable components and utilities
│   │   ├── components/   # UI components (buttons, forms, modals)
│   │   ├── composables/  # Vue composables for shared logic
│   │   ├── services/     # API services and HTTP client
│   │   ├── stores/       # Pinia stores for global state
│   │   ├── types/        # TypeScript interfaces
│   │   └── utils/        # Helper functions and constants
│   ├── router/           # Vue Router configuration
│   ├── styles/           # Global CSS and Tailwind config
│   ├── App.vue           # Root Vue component
│   └── main.ts           # Application entry point
├── public/               # Static assets and PWA manifest
├── tests/                # Unit tests (Vitest) and E2E (Playwright)
└── package.json          # Dependencies and scripts
```

## Module Architecture Pattern

Each backend module follows this structure:
```
module/
├── controllers/          # HTTP request handlers
├── services/            # Business logic layer
├── repositories/        # Data access layer
├── types/              # Module-specific types
├── validators/         # Zod validation schemas
└── tests/              # Module-specific tests
```

Each frontend feature follows this structure:
```
feature/
├── components/         # Feature-specific Vue components
├── composables/       # Feature-specific composables
├── services/          # Feature-specific API calls
├── types/            # Feature-specific TypeScript types
└── tests/            # Feature-specific tests
```

## Key Architectural Principles

- **Feature-First Organization**: Code organized by business features, not technical layers
- **Dependency Injection**: Backend modules use DI container for loose coupling
- **Separation of Concerns**: Clear boundaries between controllers, services, and repositories
- **Test-Driven Development**: Tests written before implementation for all features
- **Offline-First Design**: Frontend designed to work offline with sync capabilities
- **Progressive Web App**: Installable, works offline, responsive design

## Configuration Files

- **Backend**: `package.json`, `tsconfig.json`, `docker-compose.yml`, `prisma/schema.prisma`
- **Frontend**: `package.json`, `tsconfig.json`, `vite.config.ts`, `tailwind.config.js`
- **Shared**: `.gitignore`, `README.md`, documentation in `/docs`

## Development Workflow

1. **Specs First**: Features defined in `.kiro/specs/` before implementation
2. **TDD Approach**: Write failing tests, implement code, refactor
3. **Module Isolation**: Each module can be developed and tested independently
4. **API-First**: Backend API designed and documented before frontend integration
5. **Progressive Enhancement**: Core functionality works, then add PWA features