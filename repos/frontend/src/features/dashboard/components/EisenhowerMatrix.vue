<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DashboardProgressQuadrants } from '../types/dashboard.types'
import { Card, Badge } from '@/components/ui'

const props = defineProps<{
  progressItems: DashboardProgressQuadrants
}>()

const collapsed = ref(false)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

const totalItemCount = computed(() => {
  const { important, notImportant } = props.progressItems
  return (
    important.urgent.length +
    important.notUrgent.length +
    notImportant.urgent.length +
    notImportant.notUrgent.length
  )
})

const quadrants = computed(() => [
  {
    key: 'important-urgent',
    label: 'Important & Urgent',
    items: props.progressItems.important.urgent,
    badgeVariant: 'error' as const,
  },
  {
    key: 'important-not-urgent',
    label: 'Important & Not Urgent',
    items: props.progressItems.important.notUrgent,
    badgeVariant: 'info' as const,
  },
  {
    key: 'not-important-urgent',
    label: 'Not Important & Urgent',
    items: props.progressItems.notImportant.urgent,
    badgeVariant: 'warning' as const,
  },
  {
    key: 'not-important-not-urgent',
    label: 'Not Important & Not Urgent',
    items: props.progressItems.notImportant.notUrgent,
    badgeVariant: 'neutral' as const,
  },
])

function isOverdue(deadline: string | null): boolean {
  if (!deadline) return false
  const deadlineDate = new Date(deadline + 'T23:59:59')
  return deadlineDate < new Date()
}

function formatDeadline(deadline: string): string {
  const date = new Date(deadline + 'T00:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <section class="eisenhower-section" data-testid="matrix-section">
    <Card variant="default" padding="none">
      <template #title>
        <button
          class="section-header w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors -mx-6 -mt-6 rounded-t-lg"
          data-testid="matrix-header"
          @click="toggleCollapse"
        >
          <h2 class="text-lg font-semibold text-neutral-800">Progress Items</h2>
          <span class="text-neutral-400 transition-transform" :class="{ 'rotate-180': !collapsed }">
            ▼
          </span>
        </button>
      </template>

      <div v-if="!collapsed" class="section-content" data-testid="matrix-content">
        <div v-if="totalItemCount === 0" class="empty-state px-4 py-8 text-center text-neutral-500" data-testid="matrix-empty">
          <p class="text-base">Your weekday items are taking a break. You can too.</p>
          <p class="mt-2 text-sm">
            <router-link to="/history" class="text-primary-600 hover:text-primary-700">
              → View all items in History
            </router-link>
          </p>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4" data-testid="matrix-grid">
          <Card
            v-for="quadrant in quadrants"
            :key="quadrant.key"
            variant="default"
            padding="sm"
            :data-testid="`quadrant-${quadrant.key}`"
          >
            <div class="flex items-center justify-between mb-3">
              <h3 class="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                {{ quadrant.label }}
              </h3>
              <Badge :variant="quadrant.badgeVariant">{{ quadrant.items.length }}</Badge>
            </div>

            <div v-if="quadrant.items.length === 0" class="text-xs text-neutral-400 italic">
              No items
            </div>

            <ul v-else class="space-y-2">
              <li
                v-for="item in quadrant.items"
                :key="item.id"
                class="progress-item text-sm"
                data-testid="progress-item"
              >
                <p class="font-medium text-neutral-900">{{ item.title }}</p>
                <p
                  v-if="item.deadline"
                  class="text-xs mt-0.5"
                  :class="isOverdue(item.deadline) ? 'text-red-600 font-semibold' : 'text-neutral-500'"
                  data-testid="item-deadline"
                >
                  {{ isOverdue(item.deadline) ? '⚠ Overdue: ' : 'Due: ' }}{{ formatDeadline(item.deadline) }}
                </p>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </Card>
  </section>
</template>
