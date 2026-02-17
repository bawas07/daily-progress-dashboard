<script setup lang="ts">
/**
 * FormField Component
 *
 * A wrapper component for form fields that provides consistent labeling,
 * error messaging, and help text. Accessible and easy to compose with Input components.
 *
 * @example
 * <FormField label="Email" error="Invalid email" help="We'll never share your email">
 *   <Input v-model="email" type="email" id="email" />
 * </FormField>
 *
 * Common Patterns:
 * - Always provide a label for accessibility
 * - Use error prop to show validation errors
 * - Use help prop for additional context
 * - Use required prop to mark required fields
 */
import { computed, useId } from 'vue'

interface Props {
  label?: string
  error?: string | string[]
  help?: string
  required?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  required: false,
})

// Generate unique ID for label association
const fieldId = useId()

// Computed error list for consistent rendering
const errorList = computed(() => {
  if (!props.error) return []
  return Array.isArray(props.error) ? props.error : [props.error]
})

// Computed ID for aria-describedby
const describedBy = computed(() => {
  const ids = []
  if (props.help) ids.push(`${fieldId}-help`)
  if (errorList.value.length > 0) ids.push(`${fieldId}-error`)
  return ids.length > 0 ? ids.join(' ') : undefined
})
</script>

<template>
  <div class="form-field">
    <label
      v-if="label"
      :for="fieldId"
      class="block text-sm font-medium text-neutral-700 mb-1"
    >
      {{ label }}
      <span v-if="required" class="text-red-500" aria-label="required">*</span>
    </label>

    <slot :id="fieldId" :error="Boolean(error)" :described-by="describedBy" />

    <p
      v-if="help && !error"
      :id="`${fieldId}-help`"
      class="mt-1 text-sm text-neutral-500"
    >
      {{ help }}
    </p>

    <div
      v-if="errorList.length > 0"
      :id="`${fieldId}-error`"
      class="mt-1"
      role="alert"
    >
      <p
        v-for="(err, index) in errorList"
        :key="index"
        class="text-sm text-red-600"
      >
        {{ err }}
      </p>
    </div>
  </div>
</template>
