<script setup lang="ts">
/**
 * ProgressItemDetail Component
 *
 * Display full item details with progress history and actions.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { useProgressLogs } from '../composables/useProgressLogs'
import { useProgressItems } from '../composables/useProgressItems'
import LogProgressModal from './LogProgressModal.vue'
import type { ProgressItem } from '../types/progress.types'

interface Props {
  itemId: string
}

const props = defineProps<Props>()

const router = useRouter()

// State
const item = ref<ProgressItem | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showLogModal = ref(false)
const logging = ref(false)

// Composables
const { logs, loading: logsLoading, fetchLogs, createLog } = useProgressLogs()
const { fetchItem, settleItem: deleteItem } = useProgressItems()

// Load item and logs
onMounted(async () => {
  try {
    item.value = await fetchItem(props.itemId)
    await fetchLogs(props.itemId)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load item'
  } finally {
    loading.value = false
  }
})

// Get badge variant based on importance/urgency
function getQuadrantBadge(item: ProgressItem) {
  if (item.importance === 'high' && item.urgency === 'high') return { variant: 'error' as const, label: 'Important & Urgent' }
  if (item.importance === 'high' && item.urgency === 'low') return { variant: 'info' as const, label: 'Important & Not Urgent' }
  if (item.importance === 'low' && item.urgency === 'high') return { variant: 'warning' as const, label: 'Not Important & Urgent' }
  return { variant: 'neutral' as const, label: 'Not Important & Not Urgent' }
}

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
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

// Actions
async function handleLogProgress(dto: { note?: string; isOffDay: boolean }) {
  logging.value = true
  try {
    await createLog(props.itemId, dto)
    showLogModal.value = false
    // Refresh item to get updated timestamp
    item.value = await fetchItem(props.itemId)
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to log progress'
  } finally {
    logging.value = false
  }
}

async function handleSettle() {
  if (!confirm('Are you sure you want to settle this item? It will be removed from the active dashboard.')) {
    return
  }

  try {
    await deleteItem(props.itemId)
    router.push('/progress')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to settle item'
  }
}

function handleEdit() {
  router.push(`/progress/${props.itemId}/edit`)
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-16">
    <Spinner size="lg" />
  </div>

  <div v-else-if="error" class="text-center py-16">
    <p class="text-red-600 text-lg">{{ error }}</p>
    <Button variant="primary" class="mt-4" @click="router.push('/progress')">
      Back to Items
    </Button>
  </div>

  <div v-else-if="item" class="max-w-4xl mx-auto space-y-6">
    <!-- Header Card -->
    <Card variant="default" padding="md">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-neutral-900">{{ item.title }}</h1>
            <Badge :variant="getQuadrantBadge(item).variant">
              {{ getQuadrantBadge(item).label }}
            </Badge>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-neutral-600">
            <span>
              <strong>Active Days:</strong> {{ getDayLabels(item.activeDays) }}
            </span>
            <span v-if="item.deadline">
              <strong>Deadline:</strong> {{ formatDate(item.deadline) }}
            </span>
            <span>
              <strong>Created:</strong> {{ formatDateTime(item.createdAt) }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="secondary" size="sm" @click="handleEdit">
            Edit
          </Button>
          <Button
            variant="primary"
            size="sm"
            @click="showLogModal = true"
          >
            Log Progress
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-red-600 hover:text-red-700"
            @click="handleSettle"
          >
            Settle
          </Button>
        </div>
      </div>
    </Card>

    <!-- Progress Logs -->
    <Card variant="default" padding="md">
      <h2 class="text-lg font-semibold text-neutral-900 mb-4">Progress History</h2>

      <div v-if="logsLoading" class="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>

      <div v-else-if="logs.length === 0" class="text-center py-8 text-neutral-500">
        <p>No progress logged yet. Click "Log Progress" to start tracking!</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="log in logs"
          :key="log.id"
          class="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
        >
          <div class="flex items-start justify-between mb-2">
            <span class="text-sm font-medium text-primary-600">
              {{ formatDateTime(log.loggedAt) }}
            </span>
            <Badge
              v-if="log.isOffDay"
              variant="warning"
              size="sm"
            >
              Off Day
            </Badge>
          </div>
          <p v-if="log.note" class="text-neutral-700 whitespace-pre-wrap">
            {{ log.note }}
          </p>
          <p v-else class="text-neutral-400 italic">
            No notes
          </p>
        </div>
      </div>
    </Card>

    <!-- Log Progress Modal -->
    <LogProgressModal
      v-model:open="showLogModal"
      :item-title="item.title"
      :submitting="logging"
      @submit="handleLogProgress"
    />
  </div>
</template>
