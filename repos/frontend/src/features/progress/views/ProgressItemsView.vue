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
import type { CreateProgressItemDto, ProgressItem } from '../types/progress.types'

const router = useRouter()

// State
const showCreateForm = ref(false)

// Composable
const { items, fetchItems, createItem, loading, error } = useProgressItems()

// Load items on mount
onMounted(async () => {
  try {
    await fetchItems({ limit: 100 })
  } catch (err: any) {
    console.error('Failed to load items:', err)
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
  console.log('Creating progress item with DTO:', dto)
  try {
    const newItem = await createItem(dto)
    console.log('Created item successfully:', newItem)
    showCreateForm.value = false
    // Reload items to get fresh data
    await fetchItems({ limit: 100 })
  } catch (err: any) {
    console.error('Failed to create item:', err)
    console.error('Error response:', err.response)
    // Keep form open on error
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
  <section class="progress-items-view space-y-6" aria-labelledby="progress-items-title">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 id="progress-items-title" class="text-3xl font-black tracking-tight text-slate-900">Progress Items</h1>
        <p class="text-sm text-slate-600">Track your long-term progress with the Eisenhower Matrix.</p>
      </div>
      <Button
        v-if="!showCreateForm"
        variant="primary"
        data-testid="progress-create-button"
        @click="createNewItem"
      >
        + Create Item
      </Button>
    </header>

    <!-- Main Content -->
    <main>
      <!-- Error Display -->
    <div v-if="error" class="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg" role="alert">
      <div class="flex">
        <div class="flex-shrink-0">
          <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
          </svg>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <div class="mt-2 text-sm text-red-700">
            {{ error }}
          </div>
        </div>
      </div>
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
        v-else-if="!loading && !showCreateForm"
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
    </main>
  </section>
</template>
