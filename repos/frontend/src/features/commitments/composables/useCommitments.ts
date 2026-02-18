/**
 * Composable for managing commitments
 */
import { ref, computed } from 'vue'
import { commitmentsApi } from '../services/commitments.api'
import type { Commitment, CreateCommitmentDto } from '../types/commitment.types'

export function useCommitments() {
    const commitments = ref<Commitment[]>([])
    const loading = ref(false)
    const error = ref<string | null>(null)

    /**
     * Fetch all commitments
     */
    async function fetchCommitments() {
        loading.value = true
        error.value = null
        try {
            commitments.value = await commitmentsApi.getAll()
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to fetch commitments'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Create a new commitment
     */
    async function createCommitment(dto: CreateCommitmentDto) {
        loading.value = true
        error.value = null
        try {
            const newCommitment = await commitmentsApi.create(dto)
            commitments.value.unshift(newCommitment)
            return newCommitment
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to create commitment'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Update an existing commitment
     */
    async function updateCommitment(id: string, dto: CreateCommitmentDto) {
        loading.value = true
        error.value = null
        try {
            const updated = await commitmentsApi.update(id, dto)
            // Update in list if present
            const index = commitments.value.findIndex(c => c.id === id)
            if (index !== -1) {
                commitments.value[index] = updated
            }
            return updated
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to update commitment'
            throw err
        } finally {
            loading.value = false
        }
    }

    /**
     * Delete a commitment
     */
    async function deleteCommitment(id: string) {
        loading.value = true
        error.value = null
        try {
            await commitmentsApi.delete(id)
            commitments.value = commitments.value.filter((c) => c.id !== id)
        } catch (err: any) {
            error.value = err.response?.data?.message || 'Failed to delete commitment'
            throw err
        } finally {
            loading.value = false
        }
    }

    return {
        commitments: computed(() => commitments.value),
        loading: computed(() => loading.value),
        error: computed(() => error.value),
        fetchCommitments,
        createCommitment,
        updateCommitment,
        deleteCommitment,
    }
}
