<script setup lang="ts">
import { ref } from 'vue'
import { Card, Badge } from '@/components/ui'
import type { DashboardTimelineEvent } from '../types/dashboard.types'

defineProps<{
  events: DashboardTimelineEvent[]
}>()

const collapsed = ref(false)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (remaining === 0) return `${hours}h`
  return `${hours}h ${remaining}min`
}
</script>

<template>
  <Card variant="default" padding="none">
    <template #title>
      <button
        class="section-header w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors -mx-6 -mt-6 rounded-t-lg"
        data-testid="timeline-header"
        @click="toggleCollapse"
      >
        <h2 class="text-lg font-semibold text-neutral-800">Timeline</h2>
        <span class="text-neutral-400 transition-transform" :class="{ 'rotate-180': !collapsed }">
          ▼
        </span>
      </button>
    </template>

    <div v-if="!collapsed" class="section-content" data-testid="timeline-content">
      <div v-if="events.length === 0" class="empty-state px-4 py-8 text-center text-neutral-500" data-testid="timeline-empty">
        <p>No events scheduled today</p>
      </div>

      <ul v-else class="divide-y divide-neutral-100">
        <li
          v-for="event in events"
          :key="event.id"
          class="timeline-event flex items-center gap-4 px-4 py-3 hover:bg-neutral-50 transition-colors"
          data-testid="timeline-event"
        >
          <div class="flex-shrink-0 text-sm font-medium text-primary-600 w-20">
            {{ formatTime(event.startTime) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-neutral-900 truncate">{{ event.title }}</p>
          </div>
          <Badge variant="info">
            {{ formatDuration(event.durationMinutes) }}
          </Badge>
        </li>
      </ul>
    </div>
  </Card>
</template>
