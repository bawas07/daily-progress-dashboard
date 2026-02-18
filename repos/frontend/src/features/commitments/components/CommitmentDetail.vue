<script setup lang="ts">
/**
 * CommitmentDetail Component
 *
 * Display full commitment details with activity history and actions.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Card, Badge, Spinner } from '@/components/ui'
import { useCommitmentLogs } from '../composables/useCommitmentLogs'
import { useCommitments } from '../composables/useCommitments'
import { commitmentsApi } from '../services/commitments.api'
import LogCommitmentModal from './LogCommitmentModal.vue'
import EditCommitmentModal from './EditCommitmentModal.vue'
import type { Commitment, CreateCommitmentDto } from '../types/commitment.types'

interface Props {
  commitmentId: string
}

const props = defineProps<Props>()

const router = useRouter()

// State
const commitment = ref<Commitment | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const showLogModal = ref(false)
const showEditModal = ref(false)
const logging = ref(false)
const updating = ref(false)

// Composables
const { logs, loading: logsLoading, fetchLogs, logActivity } = useCommitmentLogs()
const { deleteCommitment, updateCommitment, fetchCommitments } = useCommitments()

// Load commitment and logs
onMounted(async () => {
  try {
    // Since there's no getById endpoint, fetch all and find by ID
    const all = await commitmentsApi.getAll()
    commitment.value = all.find((c) => c.id === props.commitmentId) || null

    if (!commitment.value) {
      error.value = 'Commitment not found'
      return
    }

    try {
      await fetchLogs(props.commitmentId)
    } catch {
      // Logs endpoint may not exist yet, that's okay
    }
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to load commitment'
  } finally {
    loading.value = false
  }
})

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
  return days.map((d) => dayMap[d]).join(', ')
}

function getScheduleLabel(days: string[]): string {
  if (days.length === 7) return 'Daily'
  const weekdays = ['mon', 'tue', 'wed', 'thu', 'fri']
  if (days.length === 5 && weekdays.every((d) => days.includes(d))) return 'Weekdays'
  return getDayLabels(days)
}

// Actions
async function handleLogActivity(dto: { note?: string }) {
  logging.value = true
  try {
    await logActivity(props.commitmentId, dto)
    showLogModal.value = false
    // Refresh commitment to get updated completedToday
    const all = await commitmentsApi.getAll()
    commitment.value = all.find((c) => c.id === props.commitmentId) || null
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to log activity'
  } finally {
    logging.value = false
  }
}

async function handleUpdate(id: string, dto: CreateCommitmentDto) {
  updating.value = true
  try {
    const updated = await updateCommitment(id, dto)
    commitment.value = updated
    showEditModal.value = false
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to update commitment'
  } finally {
    updating.value = false
  }
}

async function handleDelete() {
  if (
    !confirm(
      'Are you sure you want to delete this commitment? All activity history will be permanently deleted.'
    )
  ) {
    return
  }

  try {
    await deleteCommitment(props.commitmentId)
    router.push('/commitments')
  } catch (err: any) {
    error.value = err.response?.data?.message || 'Failed to delete commitment'
  }
}
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center py-16">
    <Spinner size="lg" />
  </div>

  <div v-else-if="error" class="text-center py-16">
    <p class="text-red-600 text-lg">{{ error }}</p>
    <Button variant="primary" class="mt-4" @click="router.push('/commitments')">
      Back to Commitments
    </Button>
  </div>

  <div v-else-if="commitment" class="max-w-4xl mx-auto space-y-6">
    <!-- Header Card -->
    <Card variant="default" padding="md">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-3 mb-2">
            <h1 class="text-2xl font-bold text-neutral-900">{{ commitment.title }}</h1>
            <Badge :variant="commitment.completedToday ? 'success' : 'neutral'">
              {{ commitment.completedToday ? 'Completed Today' : 'Pending Today' }}
            </Badge>
          </div>
          <div class="flex flex-wrap gap-4 text-sm text-neutral-600">
            <span>
              <strong>Schedule:</strong> {{ getScheduleLabel(commitment.scheduledDays) }}
            </span>
            <span>
              <strong>Created:</strong> {{ formatDateTime(commitment.createdAt) }}
            </span>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <Button variant="primary" size="sm" @click="showLogModal = true">
            Log Activity
          </Button>
          <Button
            variant="ghost"
            size="sm"
            @click="showEditModal = true"
          >
            Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            class="text-red-600 hover:text-red-700"
            @click="handleDelete"
          >
            Delete
          </Button>
        </div>
      </div>
    </Card>

    <!-- Activity Logs -->
    <Card variant="default" padding="md">
      <h2 class="text-lg font-semibold text-neutral-900 mb-4">Activity History</h2>

      <div v-if="logsLoading" class="flex items-center justify-center py-8">
        <Spinner size="md" />
      </div>

      <div v-else-if="logs.length === 0" class="text-center py-8 text-neutral-500">
        <p>No activity logged yet. Click "Log Activity" to start tracking!</p>
      </div>

      <div v-else class="space-y-3">
        <div
          v-for="log in logs"
          :key="log.id"
          class="p-4 bg-neutral-50 rounded-lg border border-neutral-200"
        >
          <div class="flex items-start justify-between mb-2">
            <span class="text-sm font-medium text-primary-600">
              {{ formatDateTime(log.completedAt) }}
            </span>
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

    <!-- Log Activity Modal -->
    <LogCommitmentModal
      v-model:open="showLogModal"
      :commitment-title="commitment.title"
      :submitting="logging"
      @submit="handleLogActivity"
    />

    <!-- Edit Commitment Modal -->
    <EditCommitmentModal
      v-if="commitment"
      v-model:open="showEditModal"
      :commitment="commitment"
      @save="handleUpdate"
    />
  </div>
</template>
