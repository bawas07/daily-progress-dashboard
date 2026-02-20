<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Button, Spinner, Toast } from '@/components/ui'
import { useUserPreferencesStore } from '@/shared/stores/user-preferences.store'
import { applyTheme } from '@/composables/useTheme'
import PreferencesForm from '../components/PreferencesForm.vue'
import AccountSettings from '../components/AccountSettings.vue'
import type { UpdatePreferencesData } from '@/shared/types'

interface ToastMessage {
  id: string
  message: string
  variant?: 'success' | 'error' | 'warning' | 'info'
  duration?: number
}

const preferencesStore = useUserPreferencesStore()
const toasts = ref<ToastMessage[]>([])
const bootstrapped = ref(false)

const isLoading = computed(() => preferencesStore.loading && !preferencesStore.preferences)
const hasError = computed(() => Boolean(preferencesStore.error) && !preferencesStore.preferences)

function addToast(message: string, variant: ToastMessage['variant'] = 'info', duration = 3000) {
  toasts.value.push({
    id: `${Date.now()}-${Math.random()}`,
    message,
    variant,
    duration,
  })
}

function removeToast(id: string | number) {
  toasts.value = toasts.value.filter((toast) => toast.id !== id)
}

async function bootstrapSettings() {
  preferencesStore.clearError()
  const loadedFromStorage = preferencesStore.initializeFromStorage()

  if (!loadedFromStorage) {
    try {
      await preferencesStore.fetchPreferences()
    } catch {
      // Error surfaced in store state/UI.
    }
  }

  applyTheme(preferencesStore.theme)
  bootstrapped.value = true
}

function handleThemePreview(data: { theme: 'auto' | 'light' | 'dark' }) {
  applyTheme(data.theme)
}

async function handlePreferencesSave(data: UpdatePreferencesData) {
  try {
    await preferencesStore.updatePreferences(data)
    applyTheme(preferencesStore.theme)
    addToast('Preferences updated.', 'success')
  } catch {
    addToast(preferencesStore.error || 'Unable to update preferences.', 'error', 5000)
  }
}

function handlePreferencesCancel() {
  applyTheme(preferencesStore.theme)
  addToast('Changes discarded.', 'info')
}

onMounted(() => {
  bootstrapSettings()
})
</script>

<template>
  <section class="settings-view space-y-6" aria-labelledby="settings-title" data-testid="settings-view">
    <header class="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 id="settings-title" class="text-3xl font-black tracking-tight text-slate-900">Settings</h1>
        <p class="text-sm text-slate-600">Manage your preferences and account security.</p>
      </div>
    </header>

    <div v-if="isLoading && !bootstrapped" class="flex items-center justify-center py-16" data-testid="settings-loading">
      <Spinner size="lg" />
    </div>

    <div
      v-else-if="hasError"
      class="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700"
      role="alert"
      data-testid="settings-error"
    >
      <p>{{ preferencesStore.error }}</p>
      <Button class="mt-3" size="sm" @click="bootstrapSettings">Retry</Button>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 xl:grid-cols-2">
      <PreferencesForm
        @save="handlePreferencesSave"
        @cancel="handlePreferencesCancel"
        @preview="handleThemePreview"
      />
      <AccountSettings />
    </div>

    <Toast :toasts="toasts" @close="removeToast" />
  </section>
</template>

