<script setup lang="ts">
/**
 * ProgressItemsView Component
 *
 * Main view for managing progress items with list, create, and actions.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Card, Spinner, Badge } from '@/components/ui'
import CreateProgressItemForm from '../components/CreateProgressItemForm.vue'
import { useProgressItems } from '../composables/useProgressItems'
import type { ProgressItem, CreateProgressItemDto } from '../types/progress.types'

const router = useRouter()

// State
const showCreateForm = ref(false)
const items = ref<ProgressItem[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

// Composable
const { items: progressItems, fetchItems, createItem } = useProgressItems()

// Load items on mount
onMounted(async () => {
  try {
    await fetchItems({ limit: 100 })
    items.value = progressItems.value || []
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load progress items'
  } finally {
    loading.value = false
  }
})

// Get badge variant based on importance/urgency
function getQuadrantBadge(item: ProgressItem) {
  if (item.importance === 'high' && item.urgency === 'high') return { variant: 'error' as const, label: 'Imp. & Urg.' }
  if (item.importance === 'high' && item.urgency === 'low') return { variant: 'info' as const, label: 'Imp. & Not Urg.' }
  if (item.importance === 'low' && item.urgency === 'high') return { variant: 'warning' as const, label: 'Not Imp. & Urg.' }
  return { variant: 'neutral' as const, label: 'Not Imp. & Not Urg.' }
}

// Get day labels
function getDayLabels(days: string[]): string {
  const dayMap: Record<string, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
  }
  return days.map(d => dayMap[d]).join(', ')
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Actions
async function handleCreate(dto: CreateProgressItemDto) {
  try {
    await createItem(dto)
    showCreateForm.value = false
    // Reload items
    await fetchItems({ limit: 100 })
    items.value = progressItems.value || []
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to create item'
  }
}

function viewItem(id: string) {
  router.push(`/progress/${id}`)
}

function createNewItem() {
  showCreateForm.value = true
}

function cancelCreate() {
  showCreateForm.value = false
}
</script>

<template>
  <div class="progress-items-view max-w-6xl mx-auto">
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-3xl font-bold text-neutral-900">Progress Items</h1>
        <p class="text-neutral-600 mt-1">Track your long-term progress with the Eisenhower Matrix</p>
      </div>
      <Button
        v-if="!showCreateForm"
        variant="primary"
        @click="createNewItem"
      >
        + Create Item
      </Button>
    </div>

    <!-- Error Display -->
    <div v-if="error" class="mb-4 text-red-600" role="alert">
      {{ error }}
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex items-center justify-center py-16">
      <Spinner size="lg" />
    </div>

    <!-- Create Form -->
    <div v-if="showCreateForm" class="mb-6">
      <CreateProgressItemForm
        @success="(dto) => handleCreate(dto)"
        @cancel="cancelCreate"
      />
    </div>

    <!-- Items List -->
    <div v-else-if="items.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <Card
        v-for="item in items"
        :key="item.id"
        variant="default"
        padding="md"
        class="cursor-pointer hover:shadow-lg transition-shadow"
        @click="viewItem(item.id)"
      >
        <div class="flex items-start justify-between mb-3">
          <h3 class="font-semibold text-neutral-900 flex-1 pr-2">
            {{ item.title }}
          </h3>
          <Badge :variant="getQuadrantBadge(item).variant" size="sm">
            {{ getQuadrantBadge(item).label }}
          </Badge>
        </div>

        <div class="space-y-2 text-sm text-neutral-600">
          <div>
            <strong>Active Days:</strong>
            <span class="ml-1">{{ getDayLabels(item.activeDays) }}</span>
          </div>
          <div v-if="item.deadline">
            <strong>Deadline:</strong>
            <span class="ml-1">{{ formatDate(item.deadline) }}</span>
          </div>
          <div class="text-xs text-neutral-500">
            Created {{ formatDate(item.createdAt) }}
          </div>
        </div>

        <div class="mt-4 pt-4 border-t border-neutral-200">
          <Button variant="primary" size="sm" class="w-full">
            View Details
          </Button>
        </div>
      </Card>
    </div>

    <!-- Empty State -->
    <Card
      v-else-if="!loading"
      variant="default"
      padding="lg"
      class="text-center"
    >
      <div class="py-8">
        <h3 class="text-xl font-semibold text-neutral-900 mb-2">No progress items yet</h3>
        <p class="text-neutral-600 mb-6">
          Create your first progress item to start tracking your long-term goals.
        </p>
        <Button variant="primary" @click="createNewItem">
          + Create Your First Item
        </Button>
      </div>
    </Card>
  </div>
</template>

