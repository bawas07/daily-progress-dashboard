<script setup lang="ts">
import { ref } from 'vue'
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
  <section
    v-if="commitments.length > 0"
    class="commitments-section bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
  >
    <button
      class="section-header w-full flex items-center justify-between px-4 py-3 bg-gray-50 hover:bg-gray-100 transition-colors"
      data-testid="commitments-header"
      @click="toggleCollapse"
    >
      <h2 class="text-lg font-semibold text-gray-800">Commitments</h2>
      <span class="text-gray-400 transition-transform" :class="{ 'rotate-180': !collapsed }">
        ▼
      </span>
    </button>

    <div v-if="!collapsed" class="section-content" data-testid="commitments-content">
      <ul class="divide-y divide-gray-100">
        <li
          v-for="commitment in commitments"
          :key="commitment.id"
          class="commitment-item flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors"
          data-testid="commitment-item"
        >
          <label class="flex items-center gap-3 cursor-pointer flex-1">
            <input
              type="checkbox"
              :checked="commitment.completedToday"
              class="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              data-testid="commitment-checkbox"
              @change="handleToggle(commitment)"
            />
            <span
              class="text-sm"
              :class="commitment.completedToday ? 'text-gray-400 line-through' : 'text-gray-900 font-medium'"
            >
              {{ commitment.title }}
            </span>
          </label>
          <span
            v-if="commitment.completedToday"
            class="text-xs text-green-600 whitespace-nowrap"
            data-testid="commitment-completed-badge"
          >
            ✓ Done today
          </span>
        </li>
      </ul>
    </div>
  </section>
</template>
