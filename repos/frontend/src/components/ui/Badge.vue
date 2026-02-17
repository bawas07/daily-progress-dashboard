<script setup lang="ts">
/**
 * Badge Component
 *
 * A small status indicator with color variants for displaying labels and states.
 * Compact design with pill shape for visual consistency.
 *
 * @example
 * <Badge variant="success">Active</Badge>
 * <Badge variant="error">Failed</Badge>
 * <Badge variant="warning">Pending</Badge>
 *
 * Common Patterns:
 * - Use for status indicators
 * - Use for counting items
 * - Use for categorization
 * - Keep text short and concise
 */
import { computed } from 'vue'

export type BadgeVariant = 'success' | 'error' | 'warning' | 'info' | 'neutral'

interface Props {
  variant?: BadgeVariant
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'neutral',
})

// Variant styles using Tailwind classes
const variantClasses = computed(() => {
  const variants = {
    success: 'bg-green-100 text-green-800 border-green-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
    neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  }
  return variants[props.variant]
})
</script>

<template>
  <span
    :class="[
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variantClasses
    ]"
  >
    <slot />
  </span>
</template>
