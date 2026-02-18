<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardCommitment, DashboardProgressQuadrants } from '../types/dashboard.types'

const props = defineProps<{
  commitments: DashboardCommitment[]
  progressItems: DashboardProgressQuadrants
}>()

/**
 * Compute bar heights based on daily completion status.
 * Generates 6 bars representing activity buckets across the day.
 */
const bars = computed(() => {
  const completedCount = props.commitments.filter(c => c.completedToday).length
  const totalCommitments = props.commitments.length
  const totalProgressItems =
    props.progressItems.important.urgent.length +
    props.progressItems.important.notUrgent.length +
    props.progressItems.notImportant.urgent.length +
    props.progressItems.notImportant.notUrgent.length

  // Generate bar heights based on a simple activity model
  const ratio = totalCommitments > 0 ? completedCount / totalCommitments : 0
  const progressRatio = totalProgressItems > 0 ? Math.min(totalProgressItems / 8, 1) : 0

  return [
    { height: 'h-2/3', active: ratio > 0 },
    { height: 'h-full', active: ratio > 0 || progressRatio > 0.5 },
    { height: 'h-3/4', active: ratio > 0.3 },
    { height: 'h-1/4', active: false },
    { height: 'h-1/4', active: false },
    { height: 'h-1/4', active: false },
  ]
})

const summaryMessage = computed(() => {
  const completed = props.commitments.filter(c => c.completedToday).length
  const total = props.commitments.length

  if (total === 0) return 'Add some commitments to start tracking your flow.'
  if (completed === total) return 'All commitments completed! Wonderful progress today.'
  if (completed > 0) return 'Your progress is steady and balanced today. No need to rush.'
  return 'Your day is just beginning. Take it one step at a time.'
})
</script>

<template>
  <div class="p-6 bg-slate-900 rounded-3xl text-white shadow-xl" data-testid="daily-flow-widget">
    <div class="flex items-center justify-between mb-4">
      <span class="text-sm font-medium opacity-80 tracking-wide uppercase">Daily Flow</span>
      <span class="material-symbols-outlined text-primary-500">waves</span>
    </div>

    <div class="flex items-end gap-1 h-12 mb-4">
      <div
        v-for="(bar, index) in bars"
        :key="index"
        class="flex-1 rounded-t-lg"
        :class="[bar.height, bar.active ? 'bg-primary-500' : 'bg-slate-800']"
        :style="{ opacity: bar.active ? (1 - index * 0.15) : 1 }"
      ></div>
    </div>

    <p class="text-xs text-slate-400 leading-relaxed font-light">{{ summaryMessage }}</p>
  </div>
</template>
