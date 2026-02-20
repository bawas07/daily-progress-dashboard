<script setup lang="ts">
/**
 * CommitmentsView Component
 *
 * Main view for managing commitments with list, create, and actions.
 */
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Button, Card, Spinner, Badge } from '@/components/ui'
import CreateCommitmentForm from '../components/CreateCommitmentForm.vue'
import { useCommitments } from '../composables/useCommitments'
import type { CreateCommitmentDto, Commitment } from '../types/commitment.types'

const router = useRouter()

// State
const showCreateForm = ref(false)

// Composable
const { commitments, fetchCommitments, createCommitment, loading, error } = useCommitments()

// Load commitments on mount
onMounted(async () => {
  try {
    await fetchCommitments()
  } catch (err: any) {
    console.error('Failed to load commitments:', err)
  }
})

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

// Format date
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// Actions
async function handleCreate(dto: CreateCommitmentDto) {
  try {
    await createCommitment(dto)
    showCreateForm.value = false
    // Reload to get fresh data with completedToday
    await fetchCommitments()
  } catch (err: any) {
    console.error('Failed to create commitment:', err)
    // Keep form open on error
  }
}

function viewCommitment(id: string) {
  router.push(`/commitments/${id}`)
}

function createNewCommitment() {
  showCreateForm.value = true
}

function cancelCreate() {
  showCreateForm.value = false
}
</script>

<template>
  <section class="commitments-view space-y-6" aria-labelledby="commitments-title">
    <header class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 id="commitments-title" class="text-3xl font-black tracking-tight text-slate-900">Commitments</h1>
        <p class="text-sm text-slate-600">Track your recurring routines and habits.</p>
      </div>
      <Button
        v-if="!showCreateForm"
        variant="primary"
        data-testid="commitment-create-button"
        @click="createNewCommitment"
      >
        + Create Commitment
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
        <CreateCommitmentForm
          @success="(dto) => handleCreate(dto)"
          @cancel="cancelCreate"
        />
      </div>

      <!-- Commitments List -->
      <div
        v-else-if="commitments.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        data-testid="commitments-list"
      >
        <Card
          v-for="commitment in commitments"
          :key="commitment.id"
          variant="default"
          padding="md"
          class="cursor-pointer hover:shadow-lg transition-shadow"
          data-testid="commitment-card"
          @click="viewCommitment(commitment.id)"
        >
          <div class="flex items-start justify-between mb-3">
            <h3 class="font-semibold text-neutral-900 flex-1 pr-2">
              {{ commitment.title }}
            </h3>
            <Badge
              :variant="commitment.completedToday ? 'success' : 'neutral'"
              size="sm"
            >
              {{ commitment.completedToday ? '✓ Done' : 'Pending' }}
            </Badge>
          </div>

          <div class="space-y-2 text-sm text-neutral-600">
            <div>
              <strong>Schedule:</strong>
              <span class="ml-1">{{ getScheduleLabel(commitment.scheduledDays) }}</span>
            </div>
            <div class="text-xs text-neutral-500">
              Created {{ formatDate(commitment.createdAt) }}
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
        data-testid="commitments-empty-state"
      >
        <div class="py-8">
          <h3 class="text-xl font-semibold text-neutral-900 mb-2">No commitments yet</h3>
          <p class="text-neutral-600 mb-6">
            Create your first commitment to start tracking your recurring routines.
          </p>
          <Button variant="primary" @click="createNewCommitment">
            + Create Your First Commitment
          </Button>
        </div>
      </Card>
    </main>
  </section>
</template>
