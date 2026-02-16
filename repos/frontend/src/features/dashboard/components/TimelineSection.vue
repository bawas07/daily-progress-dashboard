<script setup lang="ts">
import { ref } from 'vue'
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
  <section class="timeline-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <button
      class="section-header w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      data-testid="timeline-header"
      @click="toggleCollapse"
    >
      <h2 class="text-lg font-semibold text-gray-800">Timeline</h2>
      <span class="text-gray-400 transition-transform" :class="{ 'rotate-180': !collapsed }">
        ▼
      </span>
    </button>

    <div v-if="!collapsed" class="section-content" data-testid="timeline-content">
      <div v-if="events.length === 0" class="empty-state px-4 py-8 text-center text-gray-500" data-testid="timeline-empty">
        <p>No events scheduled today</p>
      </div>

      <ul v-else class="divide-y divide-gray-100">
        <li
          v-for="event in events"
          :key="event.id"
          class="timeline-event flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
          data-testid="timeline-event"
        >
          <div class="flex-shrink-0 text-sm font-medium text-indigo-600 w-20">
            {{ formatTime(event.startTime) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium text-gray-900 truncate">{{ event.title }}</p>
          </div>
          <div class="flex-shrink-0 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {{ formatDuration(event.durationMinutes) }}
          </div>
        </li>
      </ul>
    </div>
  </section>
</template>
