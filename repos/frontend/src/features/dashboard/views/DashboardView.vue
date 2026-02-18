<script setup lang="ts">
import { onMounted } from 'vue'
import { useDashboard } from '../composables/useDashboard'
import TimelineSection from '../components/TimelineSection.vue'
import EisenhowerMatrix from '../components/EisenhowerMatrix.vue'
import CommitmentsSection from '../components/CommitmentsSection.vue'
import DailyFlowWidget from '../components/DailyFlowWidget.vue'
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
  <div class="dashboard-view">
    <!-- Page Header -->
    <header class="flex justify-between items-end mb-10" data-testid="dashboard-header">
      <div>
        <h2 class="text-4xl font-black text-slate-900 tracking-tight">Today's Awareness</h2>
        <p class="text-lg text-slate-500 mt-2 font-light">Gently moving forward, one step at a time.</p>
      </div>
      <div class="flex gap-4">
        <button
          class="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 font-medium"
          data-testid="log-progress-button"
        >
          <span class="material-symbols-outlined text-lg">add</span>
          <span>Log Progress</span>
        </button>
      </div>
    </header>

    <!-- Loading State -->
    <div
      v-if="loading && !dashboardData"
      class="flex items-center justify-center py-16"
      data-testid="dashboard-loading"
    >
      <div class="text-center">
        <span class="material-symbols-outlined text-4xl text-primary-500 animate-spin">progress_activity</span>
        <p class="mt-3 text-sm text-slate-500">Loading dashboard...</p>
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
        <button
          data-testid="retry-button"
          class="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          @click="fetchDashboard"
        >
          Retry
        </button>
      </div>
    </div>

    <!-- Dashboard Content: Two Column Grid -->
    <div v-else-if="dashboardData" class="grid grid-cols-12 gap-8" data-testid="dashboard-sections">
      <!-- Left Column: Matrix + Timeline -->
      <div class="col-span-12 lg:col-span-8 space-y-10">
        <EisenhowerMatrix :progressItems="dashboardData.progressItems" />
        <TimelineSection :events="dashboardData.timeline.events" />
      </div>

      <!-- Right Column: Commitments + Daily Flow -->
      <div class="col-span-12 lg:col-span-4 space-y-8">
        <CommitmentsSection
          :commitments="dashboardData.commitments"
          @toggle="handleCommitmentToggle"
        />
        <DailyFlowWidget
          :commitments="dashboardData.commitments"
          :progressItems="dashboardData.progressItems"
        />
      </div>
    </div>
  </div>
</template>
