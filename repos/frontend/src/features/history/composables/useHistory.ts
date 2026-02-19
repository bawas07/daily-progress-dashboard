import { computed, ref } from 'vue'
import { historyApi } from '../services/history.api'
import type {
  AllItemsData,
  HistoryTab,
  MonthlyHistoryData,
  TodayHistoryData,
  WeeklyHistoryData,
} from '../types/history.types'

function getDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function useHistory() {
  const selectedTab = ref<HistoryTab>('today')
  const selectedDate = ref(getDateKey(new Date()))

  const loading = ref(false)
  const error = ref<string | null>(null)

  const todayData = ref<TodayHistoryData | null>(null)
  const weeklyData = ref<WeeklyHistoryData | null>(null)
  const monthlyData = ref<MonthlyHistoryData | null>(null)
  const allItemsData = ref<AllItemsData | null>(null)

  async function fetchForCurrentTab() {
    loading.value = true
    error.value = null

    try {
      if (selectedTab.value === 'today') {
        todayData.value = await historyApi.getToday(selectedDate.value)
        return
      }

      if (selectedTab.value === 'week') {
        weeklyData.value = await historyApi.getWeek(selectedDate.value)
        return
      }

      if (selectedTab.value === 'month') {
        monthlyData.value = await historyApi.getMonth(selectedDate.value)
        return
      }

      allItemsData.value = await historyApi.getAllItems(selectedDate.value)
    } catch (err: unknown) {
      error.value = err instanceof Error ? err.message : 'Failed to fetch history data'
      throw err
    } finally {
      loading.value = false
    }
  }

  function setTab(tab: HistoryTab) {
    selectedTab.value = tab
  }

  function setDate(date: string) {
    selectedDate.value = date
  }

  return {
    selectedTab: computed(() => selectedTab.value),
    selectedDate: computed(() => selectedDate.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    todayData: computed(() => todayData.value),
    weeklyData: computed(() => weeklyData.value),
    monthlyData: computed(() => monthlyData.value),
    allItemsData: computed(() => allItemsData.value),
    fetchForCurrentTab,
    setTab,
    setDate,
  }
}
