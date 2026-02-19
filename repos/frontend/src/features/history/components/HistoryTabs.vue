<script setup lang="ts">
import type { HistoryTab } from '../types/history.types'

interface Props {
  modelValue: HistoryTab
}

defineProps<Props>()

const emit = defineEmits<{
  'update:modelValue': [value: HistoryTab]
}>()

const tabs: Array<{ key: HistoryTab; label: string }> = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'month', label: 'This Month' },
  { key: 'all', label: 'All Items' },
]

function selectTab(tab: HistoryTab) {
  emit('update:modelValue', tab)
}
</script>

<template>
  <nav class="flex flex-wrap gap-2" data-testid="history-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.key"
      type="button"
      class="px-4 py-2 text-sm font-medium rounded-md border transition-colors"
      :class="
        modelValue === tab.key
          ? 'bg-primary-600 text-white border-primary-600'
          : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-400'
      "
      :data-testid="`history-tab-${tab.key}`"
      @click="selectTab(tab.key)"
    >
      {{ tab.label }}
    </button>
  </nav>
</template>
