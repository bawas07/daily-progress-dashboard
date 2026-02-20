<script setup lang="ts">
/**
 * PreferencesForm Component
 *
 * Form for editing user preferences with immediate theme preview.
 */
import { ref, computed, onMounted, watch } from 'vue'
import { Button, Card, FormField } from '@/components/ui'
import { useUserPreferencesStore } from '@/shared/stores/user-preferences.store'
import type { UpdatePreferencesData } from '@/shared/types'
import type { DayOfWeek } from '@/features/settings/types/settings.types'

const emit = defineEmits<{
  save: [data: UpdatePreferencesData]
  cancel: []
  preview: [data: { theme: 'auto' | 'light' | 'dark' }]
}>()

// Store
const preferencesStore = useUserPreferencesStore()

// Form state
const defaultActiveDays = ref<DayOfWeek[]>(['mon', 'tue', 'wed', 'thu', 'fri'])
const theme = ref<'auto' | 'light' | 'dark'>('auto')
const timezone = ref('UTC')
const enableNotifications = ref(true)
const saving = ref(false)
const validationError = ref('')

// Day options
const dayOptions: { value: DayOfWeek; label: string }[] = [
  { value: 'mon', label: 'Mon' },
  { value: 'tue', label: 'Tue' },
  { value: 'wed', label: 'Wed' },
  { value: 'thu', label: 'Thu' },
  { value: 'fri', label: 'Fri' },
  { value: 'sat', label: 'Sat' },
  { value: 'sun', label: 'Sun' },
]

// Common timezones
const timezoneOptions: { value: string; label: string; offset: string }[] = [
  { value: 'UTC', label: 'UTC', offset: 'GMT+0' },
  { value: 'America/New_York', label: 'Eastern Time', offset: 'GMT-5' },
  { value: 'America/Chicago', label: 'Central Time', offset: 'GMT-6' },
  { value: 'America/Denver', label: 'Mountain Time', offset: 'GMT-7' },
  { value: 'America/Los_Angeles', label: 'Pacific Time', offset: 'GMT-8' },
  { value: 'Europe/London', label: 'London', offset: 'GMT+0' },
  { value: 'Europe/Paris', label: 'Paris', offset: 'GMT+1' },
  { value: 'Europe/Berlin', label: 'Berlin', offset: 'GMT+1' },
  { value: 'Asia/Tokyo', label: 'Tokyo', offset: 'GMT+9' },
  { value: 'Asia/Shanghai', label: 'Shanghai', offset: 'GMT+8' },
  { value: 'Australia/Sydney', label: 'Sydney', offset: 'GMT+10' },
]

// Validation
const isValid = computed(() => {
  return defaultActiveDays.value.length > 0
})

function syncFromStore() {
  if (!preferencesStore.preferences) return

  defaultActiveDays.value = [...preferencesStore.defaultActiveDays] as DayOfWeek[]
  theme.value = preferencesStore.theme
  timezone.value = preferencesStore.timezone
  enableNotifications.value = preferencesStore.enableNotifications
}

// Initialize form with store values
onMounted(() => {
  syncFromStore()
})

watch(
  () => preferencesStore.preferences,
  () => {
    syncFromStore()
  }
)

function toggleDay(day: DayOfWeek) {
  const index = defaultActiveDays.value.indexOf(day)
  if (index === -1) {
    defaultActiveDays.value.push(day)
  } else {
    // Prevent deselecting all days
    if (defaultActiveDays.value.length > 1) {
      defaultActiveDays.value.splice(index, 1)
    }
  }
}

function isDaySelected(day: DayOfWeek) {
  return defaultActiveDays.value.includes(day)
}

function handleThemeChange(newTheme: 'auto' | 'light' | 'dark') {
  theme.value = newTheme
  // Emit preview event for immediate theme application
  emit('preview', { theme: newTheme })
}

async function handleSave() {
  validationError.value = ''

  if (!isValid.value) {
    validationError.value = 'Please select at least one active day'
    return
  }

  saving.value = true

  try {
    const data: UpdatePreferencesData = {
      defaultActiveDays: defaultActiveDays.value,
      theme: theme.value,
      timezone: timezone.value,
      enableNotifications: enableNotifications.value,
    }

    emit('save', data)
  } catch (err: any) {
    validationError.value = err.response?.data?.message || 'Failed to update preferences'
  } finally {
    saving.value = false
  }
}

function handleCancel() {
  emit('cancel')
}
</script>

<template>
  <Card variant="default" padding="md">
    <h2 class="text-xl font-semibold text-neutral-900 mb-4">Preferences</h2>

    <form @submit.prevent="handleSave" class="space-y-6">
      <!-- Error Display -->
      <div v-if="validationError" class="text-red-600 text-sm" role="alert">
        {{ validationError }}
      </div>

      <!-- Default Active Days -->
      <div data-testid="default-active-days-section">
        <FormField
          label="Default Active Days"
          required
          help="These days will be pre-selected when creating new progress items"
        >
          <div class="flex flex-wrap gap-2" role="group" aria-label="Default active day selection">
            <button
              v-for="day in dayOptions"
              :key="day.value"
              :data-testid="`day-button-${day.value}`"
              type="button"
              :aria-pressed="isDaySelected(day.value)"
              :class="[
                'px-3 py-1.5 text-sm rounded-md border transition-colors',
                isDaySelected(day.value)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-neutral-700 border-neutral-300 hover:border-primary-500'
              ]"
              @click="toggleDay(day.value)"
            >
              {{ day.label }}
            </button>
          </div>
        </FormField>
      </div>

      <!-- Theme Selection -->
      <div data-testid="theme-section">
        <FormField
          label="Theme"
          help="Choose your preferred color scheme (Auto follows system preference)"
        >
          <fieldset class="space-y-2" aria-label="Theme selection">
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                :data-testid="'theme-radio-auto'"
                type="radio"
                name="theme"
                value="auto"
                :checked="theme === 'auto'"
                @change="handleThemeChange('auto')"
                class="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-neutral-700">Auto (System)</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                :data-testid="'theme-radio-light'"
                type="radio"
                name="theme"
                value="light"
                :checked="theme === 'light'"
                @change="handleThemeChange('light')"
                class="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-neutral-700">Light</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input
                :data-testid="'theme-radio-dark'"
                type="radio"
                name="theme"
                value="dark"
                :checked="theme === 'dark'"
                @change="handleThemeChange('dark')"
                class="w-4 h-4 text-primary-600 focus:ring-primary-500"
              />
              <span class="text-neutral-700">Dark</span>
            </label>
          </fieldset>
        </FormField>
      </div>

      <!-- Timezone Selection -->
      <div data-testid="timezone-section">
        <FormField label="Timezone" help="Used for calculating day boundaries">
          <select
            :data-testid="'timezone-select'"
            v-model="timezone"
            class="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          >
            <option v-for="tz in timezoneOptions" :key="tz.value" :value="tz.value">
              {{ tz.label }} ({{ tz.offset }})
            </option>
          </select>
        </FormField>
      </div>

      <!-- Notifications Toggle -->
      <div data-testid="notifications-section">
        <FormField
          label="Notifications"
          help="Enable daily reminder notifications (coming in Phase 2)"
        >
          <label class="flex items-center gap-2 cursor-pointer">
            <input
              :data-testid="'notifications-toggle'"
              type="checkbox"
              v-model="enableNotifications"
              class="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span class="text-neutral-700">Enable notifications</span>
          </label>
        </FormField>
      </div>

      <!-- Actions -->
      <div class="flex items-center gap-3 pt-4">
        <Button
          :data-testid="'save-button'"
          type="submit"
          variant="primary"
          :disabled="saving || !isValid"
        >
          {{ saving ? 'Saving...' : 'Save Changes' }}
        </Button>
        <Button
          :data-testid="'cancel-button'"
          type="button"
          variant="secondary"
          @click="handleCancel"
          :disabled="saving"
        >
          Cancel
        </Button>
      </div>
    </form>
  </Card>
</template>
