/**
 * Composable for managing progress items
 */
import { ref, computed } from 'vue'
import { progressItemsApi } from '../services/progress-items.api'
import type { ProgressItem, CreateProgressItemDto, UpdateProgressItemDto } from '../types/progress.types'

export function useProgressItems() {
  const items = ref<ProgressItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    total: 0,
    perPage: 10,
    currentPage: 1,
    lastPage: 1,
  })

  /**
   * Fetch all progress items
   */
  async function fetchItems(params?: { page?: number; limit?: number; activeDay?: string }) {
    loading.value = true
    error.value = null
    try {
      const response = await progressItemsApi.getAll(params)
      items.value = response.data
      pagination.value = response.meta
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch progress items'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Create a new progress item
   */
  async function createItem(dto: CreateProgressItemDto) {
    loading.value = true
    error.value = null
    try {
      const newItem = await progressItemsApi.create(dto)
      items.value.unshift(newItem)
      return newItem
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to create progress item'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Update a progress item
   */
  async function updateItem(id: string, dto: UpdateProgressItemDto) {
    loading.value = true
    error.value = null
    try {
      const updatedItem = await progressItemsApi.update(id, dto)
      const index = items.value.findIndex((item) => item.id === id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      return updatedItem
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to update progress item'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Settle a progress item
   */
  async function settleItem(id: string) {
    loading.value = true
    error.value = null
    try {
      await progressItemsApi.settle(id)
      items.value = items.value.filter((item) => item.id !== id)
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to settle progress item'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Get a single item by ID
   */
  async function fetchItem(id: string): Promise<ProgressItem> {
    loading.value = true
    error.value = null
    try {
      const item = await progressItemsApi.getById(id)
      return item
    } catch (err: any) {
      error.value = err.response?.data?.message || 'Failed to fetch progress item'
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    items: computed(() => items.value),
    loading: computed(() => loading.value),
    error: computed(() => error.value),
    pagination: computed(() => pagination.value),
    fetchItems,
    createItem,
    updateItem,
    settleItem,
    fetchItem,
  }
}
