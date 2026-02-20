<script setup lang="ts">
import type { DashboardCommitment } from '../types/dashboard.types'

defineProps<{
  commitments: DashboardCommitment[]
}>()

const emit = defineEmits<{
  (e: 'toggle', commitment: DashboardCommitment): void
}>()

function handleToggle(commitment: DashboardCommitment) {
  emit('toggle', commitment)
}

function getStatusIcon(commitment: DashboardCommitment): string {
  if (commitment.completedToday) return 'check'
  if (commitment.completionCount > 0) return 'more_horiz'
  return 'hourglass_empty'
}

function getStatusText(commitment: DashboardCommitment): string {
  if (commitment.completedToday) return 'Progress: Steady'
  if (commitment.completionCount > 0) return 'Progress: In Progress'
  return 'Pending'
}

function getActionLabel(commitment: DashboardCommitment): string {
  if (commitment.completedToday) return 'Edit Entry'
  if (commitment.completionCount > 0) return 'Log Work'
  return 'Details'
}
</script>

<template>
  <section
    v-if="commitments.length > 0"
    class="bg-cream border border-slate-100 rounded-3xl p-6 shadow-sm"
    data-testid="commitments-section"
  >
    <div class="flex items-center gap-2 mb-6">
      <span class="material-symbols-outlined text-amber-500">star</span>
      <h3 class="text-xl font-bold text-slate-800 tracking-tight">Daily Commitments</h3>
    </div>

    <ul class="space-y-4" data-testid="commitments-content" aria-label="Commitments list">
      <li
        v-for="commitment in commitments"
        :key="commitment.id"
        class="group relative flex flex-col gap-3 p-4 bg-white rounded-2xl border border-slate-100 transition-all hover:border-primary-500/20"
        data-testid="commitment-item"
      >
        <div class="flex justify-between items-start">
          <div class="flex flex-col">
            <span
              class="text-lg font-medium leading-snug"
              :class="commitment.completedToday ? 'text-slate-900' : commitment.completionCount > 0 ? 'text-slate-900' : 'text-slate-400'"
            >
              {{ commitment.title }}
            </span>
            <span class="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
              {{ commitment.completedToday ? 'Completed' : commitment.completionCount > 0 ? 'Focus Area' : 'Upcoming' }}
            </span>
          </div>
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full"
            :class="commitment.completedToday
              ? 'bg-sage-20 text-sage'
              : commitment.completionCount > 0
                ? 'bg-slate-100 text-slate-400'
                : 'bg-slate-100 text-slate-300'"
          >
            <span class="material-symbols-outlined text-sm font-bold">{{ getStatusIcon(commitment) }}</span>
          </div>
        </div>

        <div class="flex justify-between items-center mt-2 pt-3 border-t border-slate-50">
          <span class="text-xs text-slate-500 font-medium" :class="{ italic: !commitment.completedToday && commitment.completionCount === 0 }">
            {{ getStatusText(commitment) }}
          </span>
          <button
            type="button"
            class="text-xs font-bold transition-colors"
            :class="commitment.completedToday
              ? 'text-primary-600 hover:underline'
              : commitment.completionCount > 0
                ? 'bg-primary-500/10 text-primary-600 px-3 py-1 rounded-lg hover:bg-primary-500/20'
                : 'text-slate-400 hover:text-slate-600'"
            :aria-label="`${getActionLabel(commitment)} for ${commitment.title}`"
            @click="handleToggle(commitment)"
          >
            {{ getActionLabel(commitment) }}
          </button>
        </div>
      </li>
    </ul>

    <!-- Moment of Calm -->
    <div class="mt-8">
      <div class="bg-sage-10 rounded-2xl p-5 border border-sage-20 text-center">
        <h5 class="text-sage text-sm font-bold mb-1">Moment of Calm</h5>
        <p class="text-slate-600 text-xs leading-relaxed">Take 5 minutes to breathe before starting your next commitment.</p>
      </div>
    </div>
  </section>
</template>
