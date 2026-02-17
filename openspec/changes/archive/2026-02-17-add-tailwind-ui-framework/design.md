## Context

The frontend application is a Vue 3 + Vite PWA for daily progress tracking. Currently, the application lacks a structured CSS framework, leading to potential inconsistencies in styling and increased custom CSS maintenance. Tailwind CSS (v3.4.0), PostCSS, and Autoprefixer are already installed as devDependencies but not configured or used.

**Current State:**
- Build system: Vite 5.4.0
- Framework: Vue 3.5.0 with TypeScript
- CSS dependencies installed but unused: tailwindcss, postcss, autoprefixer
- No centralized design system or component library

**Constraints:**
- Must maintain PWA functionality and performance
- Should integrate with existing Vue 3 components without major refactoring
- Configuration should be extensible for future design tokens

## Goals / Non-Goals

**Goals:**
- Configure Tailwind CSS with a custom design system (colors, spacing, typography)
- Set up PostCSS pipeline in Vite build process
- Create base CSS entry point with Tailwind directives
- Establish foundational UI component patterns using Tailwind utilities
- Ensure responsive design utilities are available

**Non-Goals:**
- Complete redesign of existing UI components (will be iterative)
- Creating a full component library (starting with base patterns only)
- Complex custom Tailwind plugins (using standard utilities first)
- CSS-in-JS or other styling approaches

## Decisions

**1. Tailwind Config Location**
- **Decision**: Create `tailwind.config.js` in frontend root with custom design tokens
- **Rationale**: Central configuration allows consistent theming across all components. Standard location that works with Tailwind tooling and IDE autocomplete.
- **Alternatives Considered**:
  - `tailwind.config.ts` - Rejected: TypeScript config adds complexity without significant benefit for this use case
  - Extending default theme only - Rejected: Custom tokens needed for brand consistency

**2. CSS Entry Point**
- **Decision**: Create `src/styles/main.css` as the single CSS entry point
- **Rationale**: Centralizes all styles. Can add custom component styles below Tailwind imports. Pattern scales well.
- **Alternatives Considered**:
  - Import in `main.ts` directly - Rejected: Separates CSS concerns from JS entry point
  - Multiple CSS files per component - Rejected: Defeats purpose of utility-first approach, increases HTTP requests

**3. Content Sources**
- **Decision**: Configure Tailwind to scan `./index.html`, `./src/**/*.{vue,js,ts,jsx,tsx}`
-Rationale**: Scans all relevant files for class usage. Standard Vue + Vite pattern.
- **Alternatives Considered**:
  - Only scan `.vue` files - Rejected: Misses utility usage in JS/TS files

**4. Purge/CSS Optimization**
- **Decision**: Use Tailwind's default JIT (Just-In-Time) engine
- **Rationale**: Generates only used CSS, smaller bundles. Default in Tailwind v3+. No additional config needed.

## Risks / Trade-offs

**[Risk] Large initial bundle size** → Mitigation: JIT mode ensures only used utilities are included. Monitor bundle size in build output.

**[Risk] Team learning curve for utility-first CSS** → Mitigation: Start with base components as patterns. Document common patterns in code comments.

**[Risk] Class name verbosity in templates** → Mitigation: Use Vue's composables and component props to abstract complex patterns. Extract repeated class combinations into components.

**[Risk] Conflicts with existing CSS** → Mitigation: Tailwind usesPreflight (CSS reset) but can be customized. Review existing styles and adjust specificity if needed.

## Migration Plan

**Phase 1: Configuration** (This change)
1. Create `tailwind.config.js` with design tokens
2. Create `postcss.config.js` for Vite processing
3. Create `src/styles/main.css` with Tailwind directives
4. Import `main.css` in `src/main.ts`

**Phase 2: Base Components** (Future)
1. Create Button component with Tailwind variants
2. Create Input component with consistent styling
3. Create Card/Panel component for layout

**Phase 3: Gradual Migration** (Future)
1. Migrate existing components to Tailwind incrementally
2. Remove custom CSS as components are migrated
3. Establish component library patterns

**Rollback Strategy**: Remove Tailwind imports from `main.ts` and delete config files. No breaking changes to existing functionality.

## Open Questions

1. **Design Tokens**: What brand colors should be defined in Tailwind config?
   - **Resolution**: Start with neutral grays and primary blue. Can be extended in future changes.

2. **Typography Scale**: Should we use Tailwind's default or custom font sizes?
   - **Resolution**: Use Tailwind defaults initially. Adjust based on design needs.

3. **Component Variants**: How many button/input variants to create initially?
   - **Resolution**: Start with primary/secondary buttons and basic inputs. Expand based on usage.
