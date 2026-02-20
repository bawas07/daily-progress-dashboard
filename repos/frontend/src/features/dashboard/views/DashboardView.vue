<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDashboard } from '../composables/useDashboard'
import TimelineSection from '../components/TimelineSection.vue'
import EisenhowerMatrix from '../components/EisenhowerMatrix.vue'
import CommitmentsSection from '../components/CommitmentsSection.vue'
import DailyFlowWidget from '../components/DailyFlowWidget.vue'
import type { DashboardCommitment } from '../types/dashboard.types'

const router = useRouter()
const {
  dashboardData,
  loading,
  error,
  selectedDate,
  formattedDate,
  isToday,
  setDate,
  goToToday,
  fetchDashboard,
} = useDashboard()

function handleCommitmentToggle(commitment: DashboardCommitment) {
  router.push(`/commitments/${commitment.id}`)
}

function handleDateChange(event: Event) {
  const target = event.target as HTMLInputElement
  setDate(target.value)
  fetchDashboard()
}

function handleGoToToday() {
  goToToday()
  fetchDashboard()
}

onMounted(() => {
  fetchDashboard()
})
</script>

<template>
  <section class="dashboard-view" aria-labelledby="dashboard-title">
    <!-- Page Header -->
    <header
      class="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-end lg:justify-between"
      data-testid="dashboard-header"
    >
      <div class="space-y-1">
        <h1 id="dashboard-title" class="text-3xl font-black text-slate-900 tracking-tight sm:text-4xl">Today's Awareness</h1>
        <p class="text-lg text-slate-500 mt-2 font-light">Gently moving forward, one step at a time.</p>
        <p class="text-sm font-medium text-slate-600" data-testid="dashboard-current-date">{{ formattedDate }}</p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 text-sm text-slate-700">
          <span class="font-medium">Date</span>
          <input
            class="rounded-md border border-slate-300 px-2.5 py-1.5 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
            type="date"
            :value="selectedDate"
            data-testid="dashboard-date-input"
            @change="handleDateChange"
          />
        </label>
        <button
          class="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="isToday"
          data-testid="dashboard-today-button"
          @click="handleGoToToday"
        >
          Today
        </button>
        <button
          class="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-600/20 font-medium"
          data-testid="log-progress-button"
          @click="router.push('/progress')"
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
      role="status"
      aria-live="polite"
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
      role="alert"
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
  </section>
</template>
