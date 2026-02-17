<script setup lang="ts">
/**
 * Card Component
 *
 * A reusable card container component with consistent styling using Tailwind CSS.
 *
 * @example
 * <Card variant="default" padding="md">
 *   <h2>Card Title</h2>
 *   <p>Card content goes here</p>
 * </Card>
 *
 * Common Patterns:
 * - Use variant="default" for standard cards with subtle border
 * - Use variant="elevated" for cards that need to stand out with shadow
 * - Use variant="outlined" for cards with stronger visual separation
 * - Use padding="sm" for compact content
 * - Use padding="md" for standard content (default)
 * - Use padding="lg" for content that needs more breathing room
 */
import { computed } from 'vue'

type CardVariant = 'default' | 'elevated' | 'outlined'

interface Props {
  variant?: CardVariant
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
})

// Variant styles using Tailwind classes
const variantClasses = computed(() => {
  const variants = {
    default: 'bg-white border border-neutral-200',
    elevated: 'bg-white shadow-md border-0',
    outlined: 'bg-white border-2 border-neutral-300',
  }
  return variants[props.variant]
})

// Padding styles using Tailwind classes
const paddingClasses = computed(() => {
  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  return paddings[props.padding]
})

// Base classes that apply to all cards
const baseClasses = 'rounded-lg transition-shadow'
</script>

<template>
  <div :class="[baseClasses, variantClasses, paddingClasses]" v-bind="$attrs">
    <slot />
  </div>
</template>
