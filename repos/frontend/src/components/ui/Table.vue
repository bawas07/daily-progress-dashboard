<script setup lang="ts">
/**
 * Table Component
 *
 * A basic data table with consistent styling and hover states.
 * Semantic HTML structure with accessibility features.
 *
 * @example
 * <Table :data="items" :columns="['Name', 'Email', 'Status']">
 *   <template #cell="{ item, column }">
 *     {{ item[column.toLowerCase()] }}
 *   </template>
 * </Table>
 *
 * Common Patterns:
 * - Use for displaying tabular data
 * - Keep content concise
 * - Use slots for custom cell rendering
 * - Ensure responsive scroll on mobile
 */
import { computed } from 'vue'

interface Column {
  key: string
  label: string
}

interface Props {
  data: Record<string, any>[]
  columns?: Column[]
  caption?: string
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [],
  caption: '',
})

// Extract columns from data if not provided
const tableColumns = computed(() => {
  if (props.columns.length > 0) return props.columns
  if (props.data.length === 0) return []
  
  // Extract keys from first data item
  const keys = Object.keys(props.data[0])
  return keys.map(key => ({ key, label: key }))
})
</script>

<template>
  <div class="overflow-x-auto">
    <table class="min-w-full divide-y divide-neutral-200">
      <caption v-if="caption" class="sr-only">
        {{ caption }}
      </caption>
      
      <thead class="bg-neutral-50">
        <tr>
          <th
            v-for="column in tableColumns"
            :key="column.key"
            scope="col"
            class="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      
      <tbody class="bg-white divide-y divide-neutral-200">
        <tr
          v-for="(item, index) in data"
          :key="index"
          class="hover:bg-neutral-50 transition-colors"
        >
          <td
            v-for="column in tableColumns"
            :key="column.key"
            class="px-6 py-4 whitespace-nowrap text-sm text-neutral-900"
          >
            <slot
              name="cell"
              :item="item"
              :column="column"
              :value="item[column.key]"
            >
              {{ item[column.key] }}
            </slot>
          </td>
        </tr>
        
        <tr v-if="data.length === 0">
          <td
            :colspan="tableColumns.length"
            class="px-6 py-4 text-center text-sm text-neutral-500"
          >
            No data available
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
/* Screen reader only class */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
</style>
