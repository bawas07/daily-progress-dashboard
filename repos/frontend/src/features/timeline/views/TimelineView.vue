<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { Button, Card, Spinner } from '@/components/ui'
import CreateTimelineEventForm from '../components/CreateTimelineEventForm.vue'
import TimelineEventCard from '../components/TimelineEvent.vue'
import { useTimelineEvents } from '../composables/useTimelineEvents'
import type { CreateTimelineEventDto } from '../types/timeline.types'

const showCreateForm = ref(false)
const activeDate = ref(new Date().toISOString().slice(0, 10))

const {
  events,
  loading,
  error,
  fetchEvents,
  createEvent,
  updateEvent,
  deleteEvent,
} = useTimelineEvents()

onMounted(async () => {
  try {
    await fetchEvents(activeDate.value)
  } catch {
    // Error is surfaced by composable state.
  }
})

async function handleDateChange() {
  await fetchEvents(activeDate.value)
}

async function handleCreate(payload: CreateTimelineEventDto) {
  await createEvent(payload)
  showCreateForm.value = false
}

async function handleDelete(id: string) {
  const confirmed = window.confirm('Delete this timeline event?')
  if (!confirmed) {
    return
  }
  await deleteEvent(id)
}

async function handleEdit(id: string) {
  const target = events.value.find((event) => event.id === id)
  if (!target) {
    return
  }

  const newTitle = window.prompt('Update event title', target.title)
  if (!newTitle || newTitle.trim() === target.title) {
    return
  }

  await updateEvent(id, { title: newTitle.trim() })
}
</script>

<template>
  <div class="timeline-view min-h-screen bg-gray-50" data-testid="timeline-view">
    <header class="max-w-6xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900">Timeline Events</h1>
          <p class="text-neutral-600 mt-1">
            Capture time-anchored activities for the day.
          </p>
        </div>

        <div class="flex items-center gap-2">
          <input
            v-model="activeDate"
            type="date"
            class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="timeline-date-filter"
            @change="handleDateChange"
          />
          <Button variant="secondary" data-testid="timeline-refresh-button" @click="handleDateChange">
            Refresh
          </Button>
          <Button
            v-if="!showCreateForm"
            variant="primary"
            data-testid="timeline-create-button"
            @click="showCreateForm = true"
          >
            + Add Event
          </Button>
        </div>
      </div>
    </header>

    <main class="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div v-if="error" class="mb-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-700" role="alert">
        {{ error }}
      </div>

      <div v-if="showCreateForm" class="mb-6">
        <CreateTimelineEventForm
          @success="handleCreate"
          @cancel="showCreateForm = false"
        />
      </div>

      <div v-if="loading && events.length === 0" class="flex justify-center py-16" data-testid="timeline-loading">
        <Spinner size="lg" />
      </div>

      <div v-else-if="events.length > 0" class="space-y-4" data-testid="timeline-events-list">
        <TimelineEventCard
          v-for="event in events"
          :key="event.id"
          :event="event"
          @delete="handleDelete"
          @edit="handleEdit"
        />
      </div>

      <Card v-else variant="default" padding="lg" class="text-center" data-testid="timeline-empty-state">
        <p class="text-neutral-600">No events scheduled for this day.</p>
      </Card>
    </main>
  </div>
</template>
