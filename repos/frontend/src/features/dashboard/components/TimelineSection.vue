<script setup lang="ts">
import type { DashboardTimelineEvent } from '../types/dashboard.types'

defineProps<{
  events: DashboardTimelineEvent[]
}>()

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} — ${formatTime(endTime)}`
}
</script>

<template>
  <section data-testid="timeline-section">
    <div class="flex items-center gap-2 mb-6">
      <span class="material-symbols-outlined text-sage">schedule</span>
      <h3 class="text-xl font-bold text-slate-800 tracking-tight">Timeline</h3>
    </div>

    <div v-if="events.length === 0" class="text-center py-8 text-slate-500" data-testid="timeline-empty">
      <p>No events scheduled today</p>
    </div>

    <div v-else class="space-y-0 pl-4 border-l-2 border-slate-200" data-testid="timeline-content">
      <div
        v-for="(event, index) in events"
        :key="event.id"
        class="relative pl-8"
        :class="index < events.length - 1 ? 'pb-8' : ''"
        data-testid="timeline-event"
      >
        <!-- Dot indicator -->
        <div
          class="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full ring-4 ring-background-light"
          :class="index === 0 ? 'bg-sage' : 'bg-slate-300'"
        ></div>

        <!-- Event card -->
        <div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
          <span
            class="text-xs font-bold uppercase tracking-widest"
            :class="index === 0 ? 'text-sage' : 'text-slate-400'"
          >
            {{ formatTimeRange(event.startTime, event.endTime) }}
          </span>
          <h4 class="text-lg font-semibold text-slate-900 mt-1">{{ event.title }}</h4>
          <p
            v-if="event.description"
            class="text-slate-500 text-sm mt-1"
          >
            {{ event.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
