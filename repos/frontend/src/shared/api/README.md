# User Preferences API Client

## Overview

This module provides a TypeScript API client for managing user preferences in the Daily Progress Dashboard frontend application.

## Files

- `user-preferences.api.ts` - User preferences API client
- `../utils/http-client.ts` - Axios instance configuration with JWT token handling

## Usage

### Importing the API Client

```typescript
// Import the singleton instance
import { userPreferencesApi } from '@/shared/api/user-preferences.api'

// Or import the class if you need multiple instances
import { UserPreferencesApi } from '@/shared/api'
```

### Getting User Preferences

```typescript
import { userPreferencesApi } from '@/shared/api'

try {
  const preferences = await userPreferencesApi.getPreferences()
  console.log('Theme:', preferences.theme)
  console.log('Timezone:', preferences.timezone)
} catch (error) {
  console.error('Failed to fetch preferences:', error.message)
}
```

### Updating User Preferences

```typescript
import { userPreferencesApi } from '@/shared/api'

try {
  const updated = await userPreferencesApi.updatePreferences({
    theme: 'dark',
    enableNotifications: true,
  })
  console.log('Preferences updated:', updated)
} catch (error) {
  console.error('Failed to update preferences:', error.message)
}
```

## API Methods

### `getPreferences(): Promise<UserPreferences>`

Fetches the current user's preferences from the backend.

**Endpoint:** `GET /api/user/preferences`

**Returns:** `Promise<UserPreferences>` - User preferences object

**Throws:** `ApiError` - If the request fails

### `updatePreferences(data: UpdatePreferencesData): Promise<UserPreferences>`

Updates the current user's preferences.

**Endpoint:** `PUT /api/user/preferences`

**Parameters:**
- `data` - Partial preferences object with fields to update

**Returns:** `Promise<UserPreferences>` - Updated preferences object

**Throws:** `ApiError` - If the request fails

## TypeScript Types

### UserPreferences

```typescript
interface UserPreferences {
  id: string
  userId: string
  defaultActiveDays: string[]      // Array of day abbreviations: 'mon', 'tue', etc.
  theme: 'auto' | 'light' | 'dark'
  timezone: string
  enableNotifications: boolean
  createdAt: string
  updatedAt: string
}
```

### UpdatePreferencesData

```typescript
type UpdatePreferencesData = Partial<{
  theme: 'auto' | 'light' | 'dark'
  timezone: string
  defaultActiveDays: string[]
  enableNotifications: boolean
}>
```

## Authentication

The API client automatically includes JWT tokens in the Authorization header:

1. Token is retrieved from `localStorage.getItem('auth_token')`
2. Added as `Bearer ${token}` in the Authorization header
3. Automatic handling of 401 errors (token expires/invalid):
   - Token is cleared from localStorage
   - User is redirected to `/login`

## Error Handling

All API errors are transformed into a standardized `ApiError` format:

```typescript
interface ApiError {
  code: string                      // Error code (e.g., 'E001', 'E002', etc.)
  message: string                   // Human-readable error message
  details?: Array<{                 // Validation error details (optional)
    field: string
    message: string
  }>
}
```

### Common Error Codes

- `E001` - Validation Error
- `E002` - Authentication Error
- `E003` - Not Found
- `E004` - Server Error

## Environment Configuration

The API base URL is configured via environment variable:

```bash
# .env
VITE_API_URL=http://localhost:3001/api
```

If not set, defaults to `/api` (uses Vite proxy in development).

## Testing

Unit tests are located in `user-preferences.api.test.ts`.

Run tests:

```bash
npm test
npm run test:run
npm run test:coverage
```

## Integration with Components

Example usage in a Vue component:

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userPreferencesApi } from '@/shared/api'
import type { UserPreferences } from '@/shared/types'

const preferences = ref<UserPreferences | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

async function loadPreferences() {
  loading.value = true
  error.value = null

  try {
    preferences.value = await userPreferencesApi.getPreferences()
  } catch (err: any) {
    error.value = err.message
  } finally {
    loading.value = false
  }
}

async function updateTheme(theme: 'auto' | 'light' | 'dark') {
  try {
    preferences.value = await userPreferencesApi.updatePreferences({ theme })
  } catch (err: any) {
    error.value = err.message
  }
}

onMounted(() => {
  loadPreferences()
})
</script>
```

## Integration with Pinia Store

For better state management, integrate with a Pinia store:

```typescript
// stores/preferences.store.ts
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userPreferencesApi } from '@/shared/api'
import type { UserPreferences } from '@/shared/types'

export const usePreferencesStore = defineStore('preferences', () => {
  const preferences = ref<UserPreferences | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetchPreferences() {
    loading.value = true
    error.value = null

    try {
      preferences.value = await userPreferencesApi.getPreferences()
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updatePreferences(data: UpdatePreferencesData) {
    loading.value = true
    error.value = null

    try {
      preferences.value = await userPreferencesApi.updatePreferences(data)
    } catch (err: any) {
      error.value = err.message
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    preferences,
    loading,
    error,
    fetchPreferences,
    updatePreferences,
  }
})
```
