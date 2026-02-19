<script setup lang="ts">
import { Card } from '@/components/ui'
import type { TodayHistoryData } from '../types/history.types'

interface Props {
  data: TodayHistoryData | null
}

defineProps<Props>()

function formatTimestamp(value: string): string {
  const date = new Date(value)
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-4" data-testid="today-history-view">
    <Card variant="default" padding="md">
      <p class="text-neutral-700 font-medium" data-testid="today-history-summary">
        {{ data?.summary.progressLogCount ?? 0 }} progress logs and {{ data?.summary.commitmentLogCount ?? 0 }} commitments completed
      </p>
    </Card>

    <div
      v-if="(data?.progressLogs.length ?? 0) === 0 && (data?.commitmentLogs.length ?? 0) === 0"
      class="p-6 bg-white border border-neutral-200 rounded-lg text-neutral-600"
      data-testid="today-history-empty"
    >
      No progress recorded today. That's okay - start whenever you're ready.
    </div>

    <Card v-if="(data?.progressLogs.length ?? 0) > 0" variant="default" padding="md">
      <h3 class="text-lg font-semibold text-neutral-900 mb-3">Progress Logs</h3>
      <ul class="space-y-3">
        <li
          v-for="entry in data?.progressLogs"
          :key="entry.id"
          class="p-3 border border-neutral-200 rounded-md"
          data-testid="today-progress-log"
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="text-neutral-900">{{ entry.progressItem.title }}</strong>
            <span class="text-sm text-neutral-500">{{ formatTimestamp(entry.loggedAt) }}</span>
          </div>
          <p v-if="entry.note" class="mt-1 text-sm text-neutral-700">{{ entry.note }}</p>
          <p v-if="entry.isOffDay" class="mt-1 text-xs text-amber-600">(off-day)</p>
        </li>
      </ul>
    </Card>

    <Card v-if="(data?.commitmentLogs.length ?? 0) > 0" variant="default" padding="md">
      <h3 class="text-lg font-semibold text-neutral-900 mb-3">Commitment Completions</h3>
      <ul class="space-y-3">
        <li
          v-for="entry in data?.commitmentLogs"
          :key="entry.id"
          class="p-3 border border-neutral-200 rounded-md"
          data-testid="today-commitment-log"
        >
          <div class="flex items-center justify-between gap-2">
            <strong class="text-neutral-900">{{ entry.commitment.title }}</strong>
            <span class="text-sm text-neutral-500">{{ formatTimestamp(entry.completedAt) }}</span>
          </div>
          <p v-if="entry.note" class="mt-1 text-sm text-neutral-700">{{ entry.note }}</p>
        </li>
      </ul>
    </Card>
  </div>
</template>
