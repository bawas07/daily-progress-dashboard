<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboard } from '../composables/useDashboard'
import { Button, Spinner } from '@/components/ui'
import AppHeader from '@/shared/components/AppHeader.vue'
import TimelineSection from '../components/TimelineSection.vue'
import EisenhowerMatrix from '../components/EisenhowerMatrix.vue'
import CommitmentsSection from '../components/CommitmentsSection.vue'
import type { DashboardCommitment } from '../types/dashboard.types'

const {
  dashboardData,
  loading,
  error,
  fetchDashboard,
} = useDashboard()

function handleCommitmentToggle(commitment: DashboardCommitment) {
  // TODO: Wire to commitment log API in task 3.3
  console.log('Toggle commitment:', commitment.id)
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <div class="dashboard-view min-h-screen bg-gray-50">
    <AppHeader
      title="Dashboard"
      show-refresh
      show-today
    />

    <!-- Main Content -->
    <main>
      <div class="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">

        <!-- Loading State -->
        <div
          v-if="loading && !dashboardData"
          class="flex items-center justify-center py-16"
          data-testid="dashboard-loading"
        >
          <div class="text-center">
            <Spinner size="lg" label="Loading dashboard" />
            <p class="mt-3 text-sm text-neutral-500">Loading dashboard...</p>
          </div>
        </div>

        <!-- Error State -->
        <div
          v-else-if="error"
          class="flex items-center justify-center py-16"
          data-testid="dashboard-error"
        >
          <div class="text-center">
            <p class="text-red-600 text-base font-medium">{{ error }}</p>
            <Button
              data-testid="retry-button"
              variant="primary"
              class="mt-4"
              @click="fetchDashboard"
            >
              Retry
            </Button>
          </div>
        </div>

        <!-- Dashboard Sections -->
        <div v-else-if="dashboardData" class="space-y-4" data-testid="dashboard-sections">
          <TimelineSection :events="dashboardData.timeline.events" />
          <EisenhowerMatrix :progressItems="dashboardData.progressItems" />
          <CommitmentsSection
            :commitments="dashboardData.commitments"
            @toggle="handleCommitmentToggle"
          />
        </div>
      </div>
    </main>
  </div>
</template>
