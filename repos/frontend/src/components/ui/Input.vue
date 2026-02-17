<script setup lang="ts">
/**
 * Input Component
 *
 * A reusable text input component with consistent styling using Tailwind CSS.
 *
 * @example
 * <Input v-model="name" placeholder="Enter name" type="text" />
 *
 * Common Patterns:
 * - Always use v-model for two-way binding
 * - Use type="email" for email validation
 * - Use type="password" for password fields
 * - Use disabled prop for read-only inputs
 * - Focus states are automatically styled with primary color ring
 */
import { computed } from 'vue'

interface Props {
  modelValue: string | number
  type?: 'text' | 'email' | 'password' | 'number' | 'tel'
  placeholder?: string
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text',
  disabled: false,
  required: false,
})

const emit = defineEmits<{
  'update:modelValue': [value: string | number]
}>()

const localValue = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

// Input classes using Tailwind
// Consistent border, padding, and focus states
const inputClasses = 'w-full px-3 py-2 border border-neutral-300 rounded-md shadow-sm placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 disabled:bg-neutral-100 disabled:cursor-not-allowed sm:text-sm transition-colors'
</script>

<template>
  <input
    :id="id"
    :name="name"
    :type="type"
    :value="localValue"
    :placeholder="placeholder"
    :disabled="disabled"
    :required="required"
    :class="inputClasses"
    @input="(e: Event) => localValue = (e.target as HTMLInputElement).value"
    v-bind="$attrs"
  />
</template>
