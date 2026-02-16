import { ref, computed } from 'vue'
import { dashboardApi } from '../services/dashboard.api'
import type { DashboardData } from '../types/dashboard.types'

/**
 * Composable for managing dashboard state and data fetching
 */
export function useDashboard() {
    const dashboardData = ref<DashboardData | null>(null)
    const loading = ref(false)
    const error = ref<string | null>(null)
    const selectedDate = ref<string>(formatDate(new Date()))

    const formattedDate = computed(() => {
        const date = new Date(selectedDate.value + 'T00:00:00')
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        })
    })

    const isToday = computed(() => {
        return selectedDate.value === formatDate(new Date())
    })

    async function fetchDashboard() {
        loading.value = true
        error.value = null

        try {
            dashboardData.value = await dashboardApi.getDashboard(selectedDate.value)
        } catch (err) {
            error.value =
                err instanceof Error ? err.message : 'Failed to load dashboard data'
            dashboardData.value = null
        } finally {
            loading.value = false
        }
    }

    async function refresh() {
        await fetchDashboard()
    }

    function setDate(date: string) {
        selectedDate.value = date
    }

    function goToToday() {
        selectedDate.value = formatDate(new Date())
    }

    return {
        dashboardData,
        loading,
        error,
        selectedDate,
        formattedDate,
        isToday,
        fetchDashboard,
        refresh,
        setDate,
        goToToday,
    }
}

/**
 * Format a Date to YYYY-MM-DD string
 */
function formatDate(date: Date): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${year}-${month}-${day}`
}
