<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Card, FormField, Input } from '@/components/ui'
import type { CreateTimelineEventDto, DayOfWeek } from '../types/timeline.types'

const emit = defineEmits<{
  success: [payload: CreateTimelineEventDto]
  cancel: []
}>()

const title = ref('')
const date = ref(new Date().toISOString().slice(0, 10))
const time = ref('09:00')
const durationMinutes = ref(30)
const recurrence = ref<'none' | 'daily' | 'weekly'>('none')
const daysOfWeek = ref<DayOfWeek[]>(['mon'])
const submitting = ref(false)
const validationError = ref('')

const dayOptions: Array<{ label: string; value: DayOfWeek }> = [
  { label: 'Mon', value: 'mon' },
  { label: 'Tue', value: 'tue' },
  { label: 'Wed', value: 'wed' },
  { label: 'Thu', value: 'thu' },
  { label: 'Fri', value: 'fri' },
  { label: 'Sat', value: 'sat' },
  { label: 'Sun', value: 'sun' },
]

const isWeekly = computed(() => recurrence.value === 'weekly')

const isValid = computed(() => {
  if (!title.value.trim() || !date.value || !time.value || durationMinutes.value <= 0) {
    return false
  }

  if (isWeekly.value && daysOfWeek.value.length === 0) {
    return false
  }

  return true
})

function toggleDay(day: DayOfWeek) {
  const exists = daysOfWeek.value.includes(day)
  if (exists) {
    daysOfWeek.value = daysOfWeek.value.filter((value) => value !== day)
    return
  }
  daysOfWeek.value = daysOfWeek.value.concat(day)
}

function isDaySelected(day: DayOfWeek) {
  return daysOfWeek.value.includes(day)
}

async function handleSubmit() {
  validationError.value = ''

  if (!isValid.value) {
    validationError.value = 'Please complete all required fields.'
    return
  }

  submitting.value = true

  try {
    const startTime = new Date(`${date.value}T${time.value}:00`)
    const payload: CreateTimelineEventDto = {
      title: title.value.trim(),
      startTime: startTime.toISOString(),
      durationMinutes: durationMinutes.value,
    }

    if (recurrence.value === 'daily') {
      payload.recurrencePattern = 'daily'
    }

    if (recurrence.value === 'weekly') {
      payload.recurrencePattern = 'weekly'
      payload.daysOfWeek = daysOfWeek.value
    }

    emit('success', payload)
  } catch (error: unknown) {
    validationError.value = error instanceof Error ? error.message : 'Failed to create timeline event'
  } finally {
    submitting.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <Card variant="default" padding="md" data-testid="create-timeline-event-form">
    <h2 class="text-xl font-semibold text-neutral-900 mb-4">Create Timeline Event</h2>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div v-if="validationError" class="text-sm text-red-600" role="alert">
        {{ validationError }}
      </div>

      <FormField label="Title" required>
        <template #default="{ id }">
          <Input
            :id="id"
            v-model="title"
            type="text"
            placeholder="Morning planning"
            data-testid="timeline-title-input"
          />
        </template>
      </FormField>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Date" required>
          <input
            v-model="date"
            type="date"
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="timeline-date-input"
          />
        </FormField>

        <FormField label="Start Time" required>
          <input
            v-model="time"
            type="time"
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="timeline-time-input"
          />
        </FormField>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Duration (minutes)" required>
          <input
            v-model.number="durationMinutes"
            type="number"
            min="1"
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="timeline-duration-input"
          />
        </FormField>

        <FormField label="Recurrence">
          <select
            v-model="recurrence"
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="timeline-recurrence-select"
          >
            <option value="none">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
          </select>
        </FormField>
      </div>

      <FormField
        v-if="isWeekly"
        label="Days of Week"
        required
        help="Select at least one day for weekly recurrence"
      >
        <div class="flex flex-wrap gap-2" data-testid="timeline-weekly-days">
          <button
            v-for="day in dayOptions"
            :key="day.value"
            type="button"
            class="px-3 py-1.5 text-sm rounded-md border transition-colors"
            :class="
              isDaySelected(day.value)
                ? 'bg-primary-600 text-white border-primary-600'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-400'
            "
            @click="toggleDay(day.value)"
          >
            {{ day.label }}
          </button>
        </div>
      </FormField>

      <div class="flex items-center gap-3 pt-4">
        <Button type="submit" variant="primary" :disabled="submitting || !isValid" data-testid="timeline-create-submit">
          {{ submitting ? 'Creating...' : 'Create Event' }}
        </Button>
        <Button type="button" variant="secondary" :disabled="submitting" @click="handleCancel">
          Cancel
        </Button>
      </div>
    </form>
  </Card>
</template>
