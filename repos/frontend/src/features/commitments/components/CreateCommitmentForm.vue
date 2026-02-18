<script setup lang="ts">
/**
 * CreateCommitmentForm Component
 *
 * Form for creating new commitments with title and scheduled days selection.
 * Includes day selection presets (weekdays, daily, 3x/week).
 */
import { ref, computed } from 'vue'
import { Button, Input, Card, FormField } from '@/components/ui'
import type { CreateCommitmentDto, DayOfWeek } from '../types/commitment.types'

const props = defineProps<{
  initialValues?: CreateCommitmentDto
  isEditing?: boolean
}>()

const emit = defineEmits<{
  success: [dto: CreateCommitmentDto]
  cancel: []
}>()

// Form state
const title = ref(props.initialValues?.title || '')
const scheduledDays = ref<DayOfWeek[]>(props.initialValues?.scheduledDays || ['mon', 'tue', 'wed', 'thu', 'fri'])
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

// Presets
interface DayPreset {
  label: string
  days: DayOfWeek[]
}

const presets: DayPreset[] = [
  { label: 'Weekdays', days: ['mon', 'tue', 'wed', 'thu', 'fri'] },
  { label: 'Daily', days: ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] },
  { label: '3x/week', days: ['mon', 'wed', 'fri'] },
]

// Validation
const isValid = computed(() => {
  return title.value.trim().length > 0 && scheduledDays.value.length > 0
})

function applyPreset(preset: DayPreset) {
  scheduledDays.value = [...preset.days]
}

function toggleDay(day: DayOfWeek) {
  const index = scheduledDays.value.indexOf(day)
  if (index === -1) {
    scheduledDays.value.push(day)
  } else {
    // Prevent deselecting all days
    if (scheduledDays.value.length > 1) {
      scheduledDays.value.splice(index, 1)
    }
  }
}

function isDaySelected(day: DayOfWeek) {
  return scheduledDays.value.includes(day)
}

async function handleSubmit() {
  validationError.value = ''

  if (!title.value.trim()) {
    validationError.value = 'Title is required'
    return
  }

  if (scheduledDays.value.length === 0) {
    validationError.value = 'Select at least one scheduled day'
    return
  }

  submitting.value = true

  try {
    const dto: CreateCommitmentDto = {
      title: title.value.trim(),
      scheduledDays: scheduledDays.value,
    }

    emit('success', dto)
  } catch (err: any) {
    validationError.value = err.response?.data?.message || 'Failed to create commitment'
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
    <h2 class="text-xl font-semibold text-neutral-900 mb-4">
      {{ isEditing ? 'Edit Commitment' : 'Create Commitment' }}
    </h2>

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
            placeholder="What routine do you want to track?"
            :error="Boolean(validationError && !title)"
          />
        </template>
      </FormField>

      <!-- Scheduled Days Presets -->
      <FormField label="Schedule Presets" help="Quick-select common schedules">
        <div class="flex flex-wrap gap-2">
          <button
            v-for="preset in presets"
            :key="preset.label"
            type="button"
            class="px-3 py-1.5 text-xs rounded-md border transition-colors bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-primary-50 hover:border-primary-500 hover:text-primary-700"
            @click="applyPreset(preset)"
          >
            {{ preset.label }}
          </button>
        </div>
      </FormField>

      <!-- Scheduled Days -->
      <FormField label="Scheduled Days" required help="Select at least one day">
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

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-4">
        <Button
          type="submit"
          variant="primary"
          :disabled="submitting || !isValid"
        >
          {{ submitting ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Commitment') }}
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
