<script setup lang="ts">
/**
 * Button Component
 *
 * A reusable button component with consistent styling using Tailwind CSS.
 *
 * @example
 * <Button variant="primary" size="md">Click me</Button>
 *
 * Common Patterns:
 * - Use variant="primary" for main actions (save, submit, confirm)
 * - Use variant="secondary" for secondary actions (cancel, go back)
 * - Use size="sm" for tight spaces or tables
 * - Use size="md" for standard buttons (default)
 * - Use size="lg" for prominent CTAs
 */
import { computed } from 'vue'

type ButtonVariant = 'primary' | 'secondary'
type ButtonSize = 'sm' | 'md' | 'lg'

interface Props {
  variant?: ButtonVariant
  size?: ButtonSize
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  disabled: false,
  type: 'button',
})

// Variant styles using Tailwind classes
const variantClasses = computed(() => {
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 focus:ring-offset-primary-600',
    secondary: 'bg-neutral-200 text-neutral-900 hover:bg-neutral-300 focus:ring-neutral-500 focus:ring-offset-neutral-200',
  }
  return variants[props.variant]
})

// Size styles using Tailwind classes
const sizeClasses = computed(() => {
  const sizes = {
    sm: 'px-3 py-1.5 text-sm font-medium rounded-md',
    md: 'px-4 py-2 text-sm font-medium rounded-md',
    lg: 'px-6 py-3 text-base font-medium rounded-md',
  }
  return sizes[props.size]
})

// Base classes that apply to all buttons
const baseClasses = 'inline-flex items-center justify-center border border-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
</script>

<template>
  <button
    :type="type"
    :disabled="disabled"
    :class="[baseClasses, variantClasses, sizeClasses]"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
