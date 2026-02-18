/**
 * Composable for managing commitment logs
 */
import { ref } from 'vue'
import { commitmentsApi } from '../services/commitments.api'
import type { CommitmentLog, CreateCommitmentLogDto } from '../types/commitment.types'

export function useCommitmentLogs() {
    const logs = ref<CommitmentLog[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    /**
     * Fetch logs for a specific commitment
     */
    async function fetchLogs(commitmentId: string) {
        loading.value = true
        error.value = null
        try {
            const response = await commitmentsApi.getLogs(commitmentId)
            logs.value = response
            return response
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch commitment logs'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Log commitment activity
     */
    async function logActivity(commitmentId: string, dto: CreateCommitmentLogDto) {
        loading.value = true
        error.value = null
        try {
            const newLog = await commitmentsApi.logActivity(commitmentId, dto)
            logs.value.unshift(newLog)
            return newLog
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to log commitment activity'
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
        logActivity,
    }
}
