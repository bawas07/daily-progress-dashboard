<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { Button, Spinner } from '@/components/ui'
import HistoryTabs from '../components/HistoryTabs.vue'
import TodayHistoryView from '../components/TodayHistoryView.vue'
import WeeklyHistoryView from '../components/WeeklyHistoryView.vue'
import MonthlyHistoryView from '../components/MonthlyHistoryView.vue'
import AllItemsView from '../components/AllItemsView.vue'
import { useHistory } from '../composables/useHistory'
import type { HistoryTab } from '../types/history.types'

const tab = ref<HistoryTab>('today')

const {
  selectedDate,
  loading,
  error,
  todayData,
  weeklyData,
  monthlyData,
  allItemsData,
  fetchForCurrentTab,
  setTab,
  setDate,
} = useHistory()

onMounted(async () => {
  await fetchForCurrentTab()
})

watch(tab, async (nextTab) => {
  setTab(nextTab)
  await fetchForCurrentTab()
})

async function handleDateChange(event: Event) {
  const target = event.target as HTMLInputElement
  setDate(target.value)
  await fetchForCurrentTab()
}
</script>

<template>
  <div class="history-view min-h-screen bg-gray-50" data-testid="history-view">
    <header class="max-w-6xl mx-auto pt-8 px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 class="text-3xl font-bold text-neutral-900">History</h1>
          <p class="text-neutral-600 mt-1">Review your progress and routines over time.</p>
        </div>

        <div class="flex items-center gap-2">
          <input
            :value="selectedDate"
            type="date"
            class="px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="history-date-input"
            @change="handleDateChange"
          />
          <Button variant="secondary" data-testid="history-refresh-button" @click="fetchForCurrentTab">
            Refresh
          </Button>
        </div>
      </div>

      <div class="mt-6">
        <HistoryTabs v-model="tab" />
      </div>
    </header>

    <main class="max-w-6xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
      <div v-if="error" class="mb-4 p-4 rounded-md bg-red-50 border border-red-200 text-red-700" role="alert">
        {{ error }}
      </div>

      <div v-if="loading" class="flex justify-center py-12" data-testid="history-loading">
        <Spinner size="lg" />
      </div>

      <TodayHistoryView v-else-if="tab === 'today'" :data="todayData" />
      <WeeklyHistoryView v-else-if="tab === 'week'" :data="weeklyData" />
      <MonthlyHistoryView v-else-if="tab === 'month'" :data="monthlyData" />
      <AllItemsView v-else :data="allItemsData" />
    </main>
  </div>
</template>
