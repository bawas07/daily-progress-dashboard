<script setup lang="ts">
import { computed } from 'vue'
import { Card } from '@/components/ui'
import type { WeeklyHistoryData } from '../types/history.types'

interface Props {
  data: WeeklyHistoryData | null
}

const props = defineProps<Props>()

const orderedEntries = computed(() => {
  if (!props.data) {
    return []
  }

  return Object.entries(props.data.weeklyData).sort(([a], [b]) => {
    return new Date(a).getTime() - new Date(b).getTime()
  })
})

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <div class="space-y-4" data-testid="weekly-history-view">
    <Card variant="default" padding="md">
      <p class="text-neutral-700 font-medium" data-testid="weekly-history-summary">
        {{ data?.summary.totalProgressLogs ?? 0 }} progress logs and {{ data?.summary.totalCommitmentLogs ?? 0 }} commitments this week
      </p>
    </Card>

    <Card
      v-for="[date, value] in orderedEntries"
      :key="date"
      variant="default"
      padding="md"
      data-testid="weekly-history-day"
    >
      <h3 class="text-md font-semibold text-neutral-900">{{ formatDate(date) }}</h3>
      <p class="text-sm text-neutral-500 mt-1">
        {{ value.progressLogs.length }} progress logs · {{ value.commitmentLogs.length }} commitment logs
      </p>

      <ul v-if="value.progressLogs.length > 0" class="mt-3 space-y-1 text-sm text-neutral-700">
        <li v-for="entry in value.progressLogs" :key="entry.id">
          {{ entry.progressItem.title }}
          <span v-if="entry.isOffDay" class="text-amber-600">(off-day)</span>
        </li>
      </ul>
    </Card>
  </div>
</template>
