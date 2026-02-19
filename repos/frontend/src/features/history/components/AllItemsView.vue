<script setup lang="ts">
import { Card, Badge } from '@/components/ui'
import type { AllItemsData } from '../types/history.types'

interface Props {
  data: AllItemsData | null
}

defineProps<Props>()

function dayLabel(days: string[]): string {
  return days.map((day) => day.slice(0, 1).toUpperCase() + day.slice(1, 3)).join(', ')
}

function relativeTime(timestamp: string | null): string {
  if (!timestamp) {
    return 'No progress yet'
  }

  const diffMs = Date.now() - new Date(timestamp).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 1) {
    return 'Last: less than 1 hour ago'
  }

  if (diffHours < 24) {
    return `Last: ${diffHours} hours ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `Last: ${diffDays} days ago`
}
</script>

<template>
  <div class="space-y-4" data-testid="all-items-view">
    <Card variant="default" padding="md">
      <h3 class="text-lg font-semibold text-neutral-900">Progress Items</h3>
      <p v-if="(data?.progressItems.length ?? 0) === 0" class="text-sm text-neutral-500 mt-2">
        No active progress items.
      </p>

      <ul v-else class="mt-3 space-y-3">
        <li
          v-for="item in data?.progressItems"
          :key="item.id"
          class="p-3 border border-neutral-200 rounded-md"
          data-testid="all-items-progress-item"
        >
          <div class="flex items-center justify-between">
            <strong class="text-neutral-900">{{ item.title }}</strong>
            <Badge :variant="item.isActiveToday ? 'success' : 'warning'">
              {{ item.isActiveToday ? 'Active Today' : 'Not Today' }}
            </Badge>
          </div>
          <p class="text-sm text-neutral-600 mt-1">Active: {{ dayLabel(item.activeDays) }}{{ item.isActiveToday ? '' : ' (not today)' }}</p>
          <p class="text-sm text-neutral-500 mt-1">{{ relativeTime(item.lastProgressAt) }}</p>
        </li>
      </ul>
    </Card>

    <Card variant="default" padding="md">
      <h3 class="text-lg font-semibold text-neutral-900">Commitments</h3>
      <p v-if="(data?.commitments.length ?? 0) === 0" class="text-sm text-neutral-500 mt-2">
        No commitments yet.
      </p>

      <ul v-else class="mt-3 space-y-3">
        <li
          v-for="commitment in data?.commitments"
          :key="commitment.id"
          class="p-3 border border-neutral-200 rounded-md"
          data-testid="all-items-commitment"
        >
          <div class="flex items-center justify-between">
            <strong class="text-neutral-900">{{ commitment.title }}</strong>
            <Badge :variant="commitment.isScheduledToday ? 'success' : 'neutral'">
              {{ commitment.isScheduledToday ? 'Scheduled Today' : 'Not Scheduled Today' }}
            </Badge>
          </div>
          <p class="text-sm text-neutral-600 mt-1">
            Schedule: {{ dayLabel(commitment.scheduledDays) }}{{ commitment.isScheduledToday ? '' : ' (not today)' }}
          </p>
        </li>
      </ul>
    </Card>
  </div>
</template>
