<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui'
import type { MonthlyHistoryData } from '../types/history.types'

interface Props {
  data: MonthlyHistoryData | null
}

const props = defineProps<Props>()

const orderedEntries = computed(() => {
  if (!props.data) {
    return []
  }

  return Object.entries(props.data.monthlyData).sort(([a], [b]) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })
})

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-4" data-testid="monthly-history-view">
    <Card variant="default" padding="md">
      <p class="text-neutral-700 font-medium" data-testid="monthly-history-summary">
        {{ data?.summary.totalProgressLogs ?? 0 }} progress logs and {{ data?.summary.totalCommitmentLogs ?? 0 }} commitments this month
      </p>
    </Card>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      <Card
        v-for="[date, value] in orderedEntries"
        :key="date"
        variant="default"
        padding="sm"
        data-testid="monthly-history-day"
      >
        <h3 class="font-semibold text-neutral-900">{{ formatDate(date) }}</h3>
        <p class="text-sm text-neutral-600 mt-1">
          {{ value.progressLogs.length }} progress · {{ value.commitmentLogs.length }} commitments
        </p>
        <p v-if="value.progressLogs.length + value.commitmentLogs.length === 0" class="text-xs text-neutral-400 mt-2">
          No activity
        </p>
      </Card>
    </div>
  </div>
</template>
