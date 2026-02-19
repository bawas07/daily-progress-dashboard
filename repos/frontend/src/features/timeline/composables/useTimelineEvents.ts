import { computed, ref } from 'vue'
import { timelineApi } from '../services/timeline.api'
import type {
  CreateTimelineEventDto,
  TimelineEvent,
  UpdateTimelineEventDto,
} from '../types/timeline.types'

function toDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useTimelineEvents() {
  const events = ref<TimelineEvent[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedDate = ref(toDateKey(new Date()))

  async function fetchEvents(date = selectedDate.value) {
    loading.value = true
    error.value = null
    selectedDate.value = date

    try {
      const response = await timelineApi.getEvents(date)
      events.value = response.slice().sort((a, b) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch timeline events'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function createEvent(data: CreateTimelineEventDto) {
    loading.value = true
    error.value = null

    try {
      const created = await timelineApi.create(data)
      events.value = events.value.concat(created).sort((a, b) => {
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
      })
      return created
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create timeline event'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateEvent(id: string, data: UpdateTimelineEventDto) {
    loading.value = true
    error.value = null

    try {
      const updated = await timelineApi.update(id, data)
      events.value = events.value
        .map((event) => (event.id === id ? updated : event))
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      return updated
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update timeline event'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteEvent(id: string) {
    loading.value = true
    error.value = null

    try {
      await timelineApi.delete(id)
      events.value = events.value.filter((event) => event.id !== id)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete timeline event'
      error.value = message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    events: computed(() => events.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    selectedDate: computed(() => selectedDate.value),
    fetchEvents,
    createEvent,
    updateEvent,
    deleteEvent,
  }
}
