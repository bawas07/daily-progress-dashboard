/**
 * Composable for managing progress logs
 */
import { ref } from 'vue'
import { progressItemsApi } from '../services/progress-items.api'
import type { ProgressLog, CreateProgressLogDto } from '../types/progress.types'

export function useProgressLogs() {
  const logs = ref<ProgressLog[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Fetch logs for a specific item
   */
  async function fetchLogs(itemId: string) {
    loading.value = true
    error.value = null
    try {
      const response = await progressItemsApi.getLogs(itemId)
      // Paginated response: { data: { data: logs, pagination }, message, code }
      logs.value = response
      return response
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch progress logs'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new progress log
   */
  async function createLog(itemId: string, dto: CreateProgressLogDto) {
    loading.value = true
    error.value = null
    try {
      const newLog = await progressItemsApi.logProgress(itemId, dto)
      logs.value.unshift(newLog)
      return newLog
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to log progress'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    logs,
    loading,
    error,
    fetchLogs,
    createLog,
  }
}
