/**
 * Commitments API Service
 */
import { apiClient } from '@/shared/api'
import type {
    Commitment,
    CreateCommitmentDto,
    CommitmentLog,
    CreateCommitmentLogDto,
} from '../types/commitment.types'

const API_BASE = '/commitments'

export const commitmentsApi = {
    /**
     * Get all commitments for the current user
     */
    async getAll(): Promise<Commitment[]> {
        const response = await apiClient.get(API_BASE)
        // Response: { data: commitments[], message, code }
        return response.data.data
    },

    /**
     * Create a new commitment
     */
    async create(dto: CreateCommitmentDto): Promise<Commitment> {
        const response = await apiClient.post(API_BASE, dto)
        return response.data.data
    },

    /**
     * Update a commitment
     */
    async update(id: string, dto: CreateCommitmentDto): Promise<Commitment> {
        const response = await apiClient.put(`${API_BASE}/${id}`, dto)
        return response.data.data
    },

    /**
     * Delete a commitment
     */
    async delete(id: string): Promise<void> {
        await apiClient.delete(`${API_BASE}/${id}`)
    },

    /**
     * Log commitment activity
     */
    async logActivity(id: string, dto: CreateCommitmentLogDto): Promise<CommitmentLog> {
        const response = await apiClient.post(`${API_BASE}/${id}/logs`, dto)
        return response.data.data
    },

    /**
     * Get commitment activity logs
     */
    async getLogs(id: string): Promise<CommitmentLog[]> {
        const response = await apiClient.get(`${API_BASE}/${id}/logs`)
        return response.data.data?.data || response.data.data
    },
}
