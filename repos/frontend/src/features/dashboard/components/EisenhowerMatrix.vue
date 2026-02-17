<script setup lang="ts">
import { ref, computed } from 'vue'
import type { DashboardProgressQuadrants } from '../types/dashboard.types'

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
    color: 'border-red-200 bg-red-50',
    labelColor: 'text-red-700',
  },
  {
    key: 'important-not-urgent',
    label: 'Important & Not Urgent',
    items: props.progressItems.important.notUrgent,
    color: 'border-blue-200 bg-blue-50',
    labelColor: 'text-blue-700',
  },
  {
    key: 'not-important-urgent',
    label: 'Not Important & Urgent',
    items: props.progressItems.notImportant.urgent,
    color: 'border-yellow-200 bg-yellow-50',
    labelColor: 'text-yellow-700',
  },
  {
    key: 'not-important-not-urgent',
    label: 'Not Important & Not Urgent',
    items: props.progressItems.notImportant.notUrgent,
    color: 'border-gray-200 bg-gray-50',
    labelColor: 'text-gray-600',
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
  <section class="eisenhower-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <button
      class="section-header w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      data-testid="matrix-header"
      @click="toggleCollapse"
    >
      <h2 class="text-lg font-semibold text-gray-800">Progress Items</h2>
      <span class="text-gray-400 transition-transform" :class="{ 'rotate-180': !collapsed }">
        ▼
      </span>
    </button>

    <div v-if="!collapsed" class="section-content" data-testid="matrix-content">
      <div v-if="totalItemCount === 0" class="empty-state px-4 py-8 text-center text-gray-500" data-testid="matrix-empty">
        <p class="text-base">Your weekday items are taking a break. You can too.</p>
        <p class="mt-2 text-sm">
          <router-link to="/history" class="text-indigo-600 hover:text-indigo-700">
            → View all items in History
          </router-link>
        </p>
      </div>

      <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4" data-testid="matrix-grid">
        <div
          v-for="quadrant in quadrants"
          :key="quadrant.key"
          class="quadrant rounded-lg border p-3"
          :class="quadrant.color"
          :data-testid="`quadrant-${quadrant.key}`"
        >
          <h3 class="text-xs font-semibold uppercase tracking-wider mb-2" :class="quadrant.labelColor">
            {{ quadrant.label }}
          </h3>

          <div v-if="quadrant.items.length === 0" class="text-xs text-gray-400 italic">
            No items
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="item in quadrant.items"
              :key="item.id"
              class="progress-item text-sm"
              data-testid="progress-item"
            >
              <p class="font-medium text-gray-900">{{ item.title }}</p>
              <p
                v-if="item.deadline"
                class="text-xs mt-0.5"
                :class="isOverdue(item.deadline) ? 'text-red-600 font-semibold' : 'text-gray-500'"
                data-testid="item-deadline"
              >
                {{ isOverdue(item.deadline) ? '⚠ Overdue: ' : 'Due: ' }}{{ formatDeadline(item.deadline) }}
              </p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>
