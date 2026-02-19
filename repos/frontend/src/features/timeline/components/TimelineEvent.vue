<script setup lang="ts">
import { Badge, Button, Card } from '@/components/ui'
import type { TimelineEvent } from '../types/timeline.types'

interface Props {
  event: TimelineEvent
  showActions?: boolean
}

withDefaults(defineProps<Props>(), {
  showActions: true,
})

const emit = defineEmits<{
  edit: [id: string]
  delete: [id: string]
}>()

function formatTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatRecurrence(event: TimelineEvent): string {
  if (event.recurrencePattern === 'daily') {
    return 'Daily'
  }

  if (event.recurrencePattern === 'weekly' && event.daysOfWeek?.length) {
    return `Weekly (${event.daysOfWeek.map((day) => day.toUpperCase()).join(', ')})`
  }

  return 'One-time'
}

function handleEdit(id: string) {
  emit('edit', id)
}

function handleDelete(id: string) {
  emit('delete', id)
}
</script>

<template>
  <Card
    variant="default"
    padding="md"
    class="border-l-4 border-l-primary-500"
    data-testid="timeline-event-card"
  >
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <div class="flex items-center gap-2 text-sm text-neutral-500">
          <span>{{ formatTime(event.startTime) }}</span>
          <span aria-hidden="true">•</span>
          <span>{{ event.durationMinutes }}m</span>
        </div>

        <h3 class="text-lg font-semibold text-neutral-900" data-testid="timeline-event-title">
          {{ event.title }}
        </h3>

        <Badge variant="info" data-testid="timeline-event-recurrence">
          {{ formatRecurrence(event) }}
        </Badge>
      </div>

      <div v-if="showActions" class="flex items-center gap-2">
        <Button size="sm" variant="secondary" @click="handleEdit(event.id)">
          Edit
        </Button>
        <Button size="sm" variant="ghost" @click="handleDelete(event.id)">
          Delete
        </Button>
      </div>
    </div>
  </Card>
</template>
