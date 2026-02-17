## Context

The frontend application has Tailwind CSS configured but currently uses basic HTML elements with utility classes scattered throughout components. Existing components like EisenhowerMatrix.vue mix layout logic with inline styling, making maintenance difficult and creating inconsistency across the application.

**Current State:**
- Tailwind CSS configured with basic design tokens
- Three basic components exist (Button, Input, Card) but are incomplete
- No consistent form field wrappers or validation feedback
- No modal, toast, or loading state components
- Direct use of native HTML elements leads to inconsistent UX

**Constraints:**
- Must use existing Tailwind configuration and design tokens
- Vue 3 Composition API with TypeScript
- Components should be standalone and reusable
- Follow existing project structure in `repos/frontend/src/components/ui/`

## Goals / Non-Goals

**Goals:**
- Create 9 production-ready UI components with consistent styling
- Ensure accessibility (ARIA attributes, keyboard navigation)
- Support theming through Tailwind's design tokens
- Provide clear TypeScript props for each component
- Create components that can be composed together (e.g., FormField wrapping Input)
- Apply components to all existing pages for immediate consistency

**Non-Goals:**
- Complex component variants (stick to basic use cases)
- Advanced features like drag-and-drop for Table
- Animation libraries (use CSS transitions only)
- Breaking changes to existing Tailwind config

## Decisions

**Component Architecture:**
- Use Vue 3 `<script setup>` with Composition API for consistency
- Define props interfaces with TypeScript for type safety
- Use `defineProps` with `withDefaults` for optional props
- Emit events for user interactions (click, submit, change, close)
- Support `class` prop for custom styling flexibility

**Styling Strategy:**
- Use Tailwind utility classes as the primary styling approach
- Leverage existing design tokens from `tailwind.config.js`
- Use Tailwind's `@apply` directive only for complex repeated patterns
- Support variants through computed classes based on props
- Ensure responsive design with mobile-first approach

**Component Specifics:**
- **Button**: Support 3 variants (primary, secondary, ghost) and 3 sizes (sm, md, lg). Use `type="button"` by default.
- **Input**: Support text, email, password types with focus states and error styling. Expose v-model for two-way binding.
- **FormField**: Wrapper component that combines label, input slot, error message, and help text. Handles accessibility attributes.
- **Modal**: Use teleport to body, support close on ESC and backdrop click. Include header, body, and footer slots.
- **Toast**: Fixed position container in corner, auto-dismiss after N seconds, support multiple toasts simultaneously.
- **Card**: Simple container with padding, border radius, and shadow. Support optional header and footer.
- **Badge**: Small status indicator with color variants (success, warning, error, info).
- **Spinner**: Simple CSS animation for loading states. Support size prop.
- **Table**: Basic table with header styling and row hover. Support custom cell content through slots.

**Validation & Error Handling:**
- FormField and Input should support error states through props
- Use visual cues (red border, error text) for validation feedback
- Don't implement full validation library - keep it simple

## Risks / Trade-offs

**[Risk] Component complexity may grow over time**
- **Mitigation**: Start with minimal viable variants, add features only when needed. Document prop interfaces clearly.

**[Risk] Inconsistent application of components across pages**
- **Mitigation**: Include refactoring of existing pages in this change to demonstrate proper usage from the start.

**[Risk] Accessibility may be overlooked in favor of styling**
- **Mitigation**: Include ARIA attributes and keyboard support from the beginning. Test with keyboard navigation.

**[Trade-off] Flexibility vs. consistency**
- Accepting more props and `class` forwarding increases flexibility but makes components more complex. Balance by providing sensible defaults and common variants.

## Migration Plan

1. Create all 9 UI components in `repos/frontend/src/components/ui/`
2. Create index file to export all components for easy imports
3. Refactor existing components to use new UI library:
   - EisenhowerMatrix.vue: Use Button, Card, Badge
   - Dashboard views: Use Card, Button, Input
4. Test all pages visually and functionally
5. No database or API changes required - zero-downtime deployment

## Open Questions

- Should Toast use a dedicated state management (Pinia) or simple composables?
  - **Decision**: Start with composable approach, can add Pinia if state management becomes complex.

- Should Table component support pagination or sorting?
  - **Decision**: Not in scope - start with basic styled table, add features as needed.

- How to handle component documentation?
  - **Decision**: Add JSDoc comments to components, create TestComponents.vue as usage examples.
