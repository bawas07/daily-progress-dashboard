<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'
import { useDashboard } from '../composables/useDashboard'
import TimelineSection from '../components/TimelineSection.vue'
import EisenhowerMatrix from '../components/EisenhowerMatrix.vue'
import CommitmentsSection from '../components/CommitmentsSection.vue'
import type { DashboardCommitment } from '../types/dashboard.types'

const router = useRouter()
const authStore = useAuthStore()
const {
  dashboardData,
  loading,
  error,
  formattedDate,
  isToday,
  fetchDashboard,
  refresh,
  goToToday,
} = useDashboard()

async function handleLogout() {
  await authStore.logout()
  router.push('/login')
}

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
    <!-- Header -->
    <header class="bg-white shadow">
      <div class="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900" data-testid="dashboard-title">
            Dashboard
          </h1>
          <p class="text-sm text-gray-500 mt-1" data-testid="dashboard-date">
            {{ formattedDate }}
          </p>
        </div>
        <div class="flex items-center gap-3">
          <button
            v-if="!isToday"
            data-testid="today-button"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors"
            @click="goToToday(); fetchDashboard()"
          >
            Today
          </button>
          <button
            data-testid="refresh-button"
            class="inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
            :disabled="loading"
            @click="refresh"
          >
            ↻ Refresh
          </button>
          <button
            data-testid="logout-button"
            @click="handleLogout"
            class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
    </header>

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
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto"></div>
            <p class="mt-3 text-sm text-gray-500">Loading dashboard...</p>
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
              class="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              @click="fetchDashboard"
            >
              Retry
            </button>
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
