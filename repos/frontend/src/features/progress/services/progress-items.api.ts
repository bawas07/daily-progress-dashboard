/**
 * Progress Items API Service
 */
import { apiClient } from '@/shared/api'
import type {
  ProgressItem,
  CreateProgressItemDto,
  UpdateProgressItemDto,
  ProgressLog,
  CreateProgressLogDto,
  ProgressItemListResponse,
} from '../types/progress.types'

const API_BASE = '/progress-items'

export const progressItemsApi = {
  /**
   * Get all progress items with pagination
   */
  async getAll(params?: { page?: number; limit?: number; activeDay?: string }): Promise<ProgressItemListResponse> {
    const response = await apiClient.get(API_BASE, { params })
    return response.data
  },

  /**
   * Get a single progress item by ID
   */
  async getById(id: string): Promise<ProgressItem> {
    const response = await apiClient.get(`${API_BASE}/${id}`)
    // Single item responses use createSuccessResponse: { data, message, code }
    return response.data.data
  },

  /**
   * Create a new progress item
   */
  async create(dto: CreateProgressItemDto): Promise<ProgressItem> {
    console.log('API Client: POST', API_BASE, dto)
    const response = await apiClient.post(API_BASE, dto)
    console.log('API Client: Response', response.data)
    // Single item responses use createSuccessResponse: { data, message, code }
    return response.data.data
  },

  /**
   * Update a progress item
   */
  async update(id: string, dto: UpdateProgressItemDto): Promise<ProgressItem> {
    const response = await apiClient.put(`${API_BASE}/${id}`, dto)
    // Single item responses use createSuccessResponse: { data, message, code }
    return response.data.data
  },

  /**
   * Settle (delete) a progress item
   */
  async settle(id: string): Promise<void> {
    await apiClient.delete(`${API_BASE}/${id}`)
  },

  /**
   * Log progress for an item
   */
  async logProgress(id: string, dto: CreateProgressLogDto): Promise<ProgressLog> {
    const response = await apiClient.post(`${API_BASE}/${id}/logs`, dto)
    // Single item responses use createSuccessResponse: { data, message, code }
    return response.data.data
  },

  /**
   * Get progress logs for an item
   */
  async getLogs(id: string): Promise<ProgressLog[]> {
    const response = await apiClient.get(`${API_BASE}/${id}/logs`)
    // Paginated responses: { data: { data: items, pagination }, message, code }
    return response.data.data.data
  },
}
