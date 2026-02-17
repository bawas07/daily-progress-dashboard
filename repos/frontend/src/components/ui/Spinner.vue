<script setup lang="ts">
/**
 * Spinner Component
 *
 * A loading indicator with CSS-based rotation animation.
 * Supports multiple sizes and maintains accessibility.
 *
 * @example
 * <Spinner size="sm" />
 * <Spinner size="md" />
 * <Spinner size="lg" />
 *
 * Common Patterns:
 * - Use for async operations
 * - Use during data fetching
 * - Use during form submission
 * - Always provide context for screen readers
 */
import { computed } from 'vue'

type SpinnerSize = 'sm' | 'md' | 'lg'

interface Props {
  size?: SpinnerSize
  label?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  label: 'Loading',
})

// Size in pixels
const sizePx = computed(() => {
  const sizes = {
    sm: '16px',
    md: '24px',
    lg: '32px',
  }
  return sizes[props.size]
})

// Border thickness based on size
const borderThickness = computed(() => {
  const thickness = {
    sm: '2px',
    md: '3px',
    lg: '4px',
  }
  return thickness[props.size]
})
</script>

<template>
  <div
    role="status"
    :aria-label="label"
    class="inline-flex items-center justify-center"
  >
    <svg
      class="animate-spin"
      :width="sizePx"
      :height="sizePx"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        class="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        :stroke-width="borderThickness"
      />
      <path
        class="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
    
    <span class="sr-only">{{ label }}</span>
  </div>
</template>

<style scoped>
/* Ensure smooth spinning animation */
@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-spin {
  animation: spin 1s linear infinite;
}

/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
