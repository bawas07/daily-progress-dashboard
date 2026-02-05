import { apiClient } from './axios.config'

/**
 * Composable wrapper for API client
 * Provides a consistent interface for making API calls
 */
export function useApiClient() {
    return {
        post: apiClient.post.bind(apiClient),
        get: apiClient.get.bind(apiClient),
    }
}
