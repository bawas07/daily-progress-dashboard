<script setup lang="ts">
/**
 * CreateProgressItemForm Component
 *
 * Form for creating new progress items with validation.
 */
import { ref, computed } from 'vue'
import { Button, Input, Card, FormField } from '@/components/ui'
import type { CreateProgressItemDto, DayOfWeek, Importance, Urgency } from '../types/progress.types'

const emit = defineEmits<{
  success: [dto: CreateProgressItemDto]
  cancel: []
}>()

// Form state
const title = ref('')
const importance = ref<Importance>('high')
const urgency = ref<Urgency>('high')
const activeDays = ref<DayOfWeek[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
const deadline = ref('')
const submitting = ref(false)
const validationError = ref('')

// Day options
const dayOptions: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
]

// Validation
const isValid = computed(() => {
  return (
    title.value.trim().length > 0 &&
    activeDays.value.length > 0
  )
})

function toggleDay(day: DayOfWeek) {
  const index = activeDays.value.indexOf(day)
  if (index === -1) {
    activeDays.value.push(day)
  } else {
    // Prevent deselecting all days
    if (activeDays.value.length > 1) {
      activeDays.value.splice(index, 1)
    }
  }
}

function isDaySelected(day: DayOfWeek) {
  return activeDays.value.includes(day)
}

async function handleSubmit() {
  validationError.value = ''

  if (!isValid.value) {
    validationError.value = 'Please fill in all required fields'
    return
  }

  submitting.value = true

  try {
    const dto: CreateProgressItemDto = {
      title: title.value.trim(),
      importance: importance.value,
      urgency: urgency.value,
      activeDays: activeDays.value,
      deadline: deadline.value || undefined,
    }

    emit('success', dto)
  } catch (err: any) {
    validationError.value = err.response?.data?.message || 'Failed to create progress item'
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <Card variant="default" padding="md">
    <h2 class="text-xl font-semibold text-neutral-900 mb-4">Create Progress Item</h2>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Error Display -->
      <div v-if="validationError" class="text-red-600 text-sm" role="alert">
        {{ validationError }}
      </div>

      <!-- Title -->
      <FormField label="Title" required>
        <template #default="{ id }">
          <Input
            :id="id"
            v-model="title"
            type="text"
            placeholder="What do you want to make progress on?"
            :error="Boolean(validationError && !title)"
          />
        </template>
      </FormField>

      <!-- Importance & Urgency -->
      <div class="grid grid-cols-2 gap-4">
        <FormField label="Importance">
          <select
            v-model="importance"
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </FormField>

        <FormField label="Urgency">
          <select
            v-model="urgency"
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option value="high">High</option>
            <option value="low">Low</option>
          </select>
        </FormField>
      </div>

      <!-- Active Days -->
      <FormField label="Active Days" required help="Select at least one day">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="day in dayOptions"
            :key="day.value"
            type="button"
            :class="[
              'px-3 py-1.5 text-sm rounded-md border transition-colors',
              isDaySelected(day.value)
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-500'
            ]"
            @click="toggleDay(day.value)"
          >
            {{ day.label }}
          </button>
        </div>
      </FormField>

      <!-- Deadline -->
      <FormField label="Deadline" help="Optional - when does this need to be done?">
        <input
          v-model="deadline"
          type="date"
          class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </FormField>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          :disabled="submitting || !isValid"
        >
          {{ submitting ? 'Creating...' : 'Create Item' }}
        </Button>
        <Button
          type="button"
          variant="secondary"
          @click="handleCancel"
          :disabled="submitting"
        >
          Cancel
        </Button>
      </div>
    </form>
  </Card>
</template>
