<script setup lang="ts">
import { ref } from 'vue'
import { Card, Badge } from '@/components/ui'
import type { DashboardCommitment } from '../types/dashboard.types'

defineProps<{
  commitments: DashboardCommitment[]
}>()

const emit = defineEmits<{
  (e: 'toggle', commitment: DashboardCommitment): void
}>()

const collapsed = ref(false)

function toggleCollapse() {
  collapsed.value = !collapsed.value
}

function handleToggle(commitment: DashboardCommitment) {
  emit('toggle', commitment)
}
</script>

<template>
  <Card
    v-if="commitments.length > 0"
    variant="default"
    padding="none"
  >
    <template #title>
      <button
        class="section-header w-full flex items-center justify-between px-4 py-3 hover:bg-neutral-50 transition-colors -mx-6 -mt-6 rounded-t-lg"
        data-testid="commitments-header"
        @click="toggleCollapse"
      >
        <h2 class="text-lg font-semibold text-neutral-800">Commitments</h2>
        <span class="text-neutral-400 transition-transform" :class="{ 'rotate-180': !collapsed }">
          ▼
        </span>
      </button>
    </template>

    <div v-if="!collapsed" class="section-content" data-testid="commitments-content">
      <ul class="divide-y divide-neutral-100">
        <li
          v-for="commitment in commitments"
          :key="commitment.id"
          class="commitment-item flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
          data-testid="commitment-item"
        >
          <label class="flex items-center gap-3 cursor-pointer flex-1">
            <input
              type="checkbox"
              :checked="commitment.completedToday"
              class="h-5 w-5 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
              data-testid="commitment-checkbox"
              @change="handleToggle(commitment)"
            />
            <span
              class="text-sm"
              :class="commitment.completedToday ? 'text-neutral-400 line-through' : 'text-neutral-900 font-medium'"
            >
              {{ commitment.title }}
            </span>
          </label>
          <Badge
            v-if="commitment.completedToday"
            variant="success"
            data-testid="commitment-completed-badge"
          >
            ✓ Done today
          </Badge>
        </li>
      </ul>
    </div>
  </Card>
</template>
