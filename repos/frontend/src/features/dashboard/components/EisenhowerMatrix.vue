<script setup lang="ts">
import { computed } from 'vue'
import type { DashboardProgressQuadrants } from '../types/dashboard.types'

const props = defineProps<{
  progressItems: DashboardProgressQuadrants
}>()

const quadrants = computed(() => [
  {
    key: 'do-now',
    label: 'Do Now',
    icon: 'priority_high',
    items: props.progressItems.important.urgent,
    bgClass: 'bg-primary-500/5 border-primary-500/10',
    headerClass: 'text-primary-600',
    itemBorderClass: 'border-primary-500/5',
  },
  {
    key: 'schedule',
    label: 'Schedule',
    icon: 'event',
    items: props.progressItems.important.notUrgent,
    bgClass: 'bg-sage-5 border-sage-10',
    headerClass: 'text-sage',
    itemBorderClass: 'border-sage-10',
  },
  {
    key: 'delegate',
    label: 'Delegate',
    icon: 'group',
    items: props.progressItems.notImportant.urgent,
    bgClass: 'bg-slate-100 border-transparent',
    headerClass: 'text-slate-500',
    itemBorderClass: 'border-slate-200',
  },
  {
    key: 'eliminate',
    label: 'Eliminate',
    icon: 'delete_sweep',
    items: props.progressItems.notImportant.notUrgent,
    bgClass: 'bg-slate-50 border-dashed border-slate-200',
    headerClass: 'text-slate-400',
    itemBorderClass: 'border-slate-200',
  },
])
</script>

<template>
  <section data-testid="matrix-section">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary-600">grid_view</span>
        <h3 class="text-xl font-bold text-slate-800 tracking-tight">Eisenhower Matrix</h3>
      </div>
      <span class="text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full uppercase font-bold tracking-tighter">Priority View</span>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4" data-testid="matrix-grid">
      <div
        v-for="quadrant in quadrants"
        :key="quadrant.key"
        class="p-5 rounded-2xl border"
        :class="quadrant.bgClass"
        :data-testid="`quadrant-${quadrant.key}`"
      >
        <div class="flex justify-between items-center mb-4">
          <h4 class="text-sm font-bold uppercase tracking-widest" :class="quadrant.headerClass">
            {{ quadrant.label }}
          </h4>
          <span class="material-symbols-outlined text-sm" :class="quadrant.headerClass">{{ quadrant.icon }}</span>
        </div>

        <div v-if="quadrant.items.length > 0" class="space-y-3">
          <div
            v-for="item in quadrant.items"
            :key="item.id"
            class="bg-white p-3 rounded-xl border text-sm text-slate-700 shadow-sm"
            :class="[quadrant.itemBorderClass, quadrant.key === 'delegate' ? 'italic text-slate-500' : '']"
            data-testid="progress-item"
          >
            {{ item.title }}
          </div>
        </div>

        <p
          v-else-if="quadrant.key === 'eliminate'"
          class="text-xs text-slate-400"
        >
          Clear any distractions here to maintain emotional calm.
        </p>
        <p v-else class="text-xs text-slate-400 italic">No items</p>
      </div>
    </div>
  </section>
</template>
