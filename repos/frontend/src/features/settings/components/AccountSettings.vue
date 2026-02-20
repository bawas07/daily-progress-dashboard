<script setup lang="ts">
import { computed, ref } from 'vue'
import { Button, Card, FormField, Input } from '@/components/ui'
import { settingsApi } from '../services/settings.api'

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const validationErrors = computed(() => {
  const errors: string[] = []

  if (!currentPassword.value) errors.push('Current password is required')
  if (!newPassword.value) errors.push('New password is required')
  if (!confirmPassword.value) errors.push('Confirm password is required')

  if (newPassword.value && newPassword.value.length < 8) {
    errors.push('New password must be at least 8 characters long')
  }
  if (newPassword.value && !/[A-Z]/.test(newPassword.value)) {
    errors.push('New password must contain at least one uppercase letter')
  }
  if (newPassword.value && !/[a-z]/.test(newPassword.value)) {
    errors.push('New password must contain at least one lowercase letter')
  }
  if (newPassword.value && !/[0-9]/.test(newPassword.value)) {
    errors.push('New password must contain at least one number')
  }
  if (newPassword.value && !/[!@#$%^&*(),.?":{}|<>]/.test(newPassword.value)) {
    errors.push('New password must contain at least one special character')
  }
  if (newPassword.value && currentPassword.value && newPassword.value === currentPassword.value) {
    errors.push('New password must be different from current password')
  }
  if (
    newPassword.value &&
    confirmPassword.value &&
    newPassword.value !== confirmPassword.value
  ) {
    errors.push('New password and confirm password must match')
  }

  return errors
})

const canSubmit = computed(() => !submitting.value && validationErrors.value.length === 0)

function resetForm() {
  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
}

async function handleSubmit() {
  successMessage.value = ''
  errorMessage.value = ''

  if (!canSubmit.value) return

  submitting.value = true
  try {
    await settingsApi.changePassword({
      currentPassword: currentPassword.value,
      newPassword: newPassword.value,
    })

    successMessage.value = 'Password updated successfully.'
    resetForm()
  } catch (error: unknown) {
    const fallback = 'Unable to update password. Please try again.'
    if (typeof error === 'object' && error && 'response' in error) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message
      errorMessage.value = message || fallback
    } else {
      errorMessage.value = fallback
    }
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Card variant="default" padding="md">
    <h2 class="text-xl font-semibold text-neutral-900 mb-4" data-testid="account-settings-title">
      Account Security
    </h2>
    <p class="text-sm text-neutral-600 mb-5">
      Update your password regularly to keep your account secure.
    </p>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div
        v-if="errorMessage"
        class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
        role="alert"
        data-testid="account-settings-error"
      >
        {{ errorMessage }}
      </div>

      <div
        v-if="successMessage"
        class="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-700"
        role="status"
        data-testid="account-settings-success"
      >
        {{ successMessage }}
      </div>

      <div
        v-if="validationErrors.length > 0"
        class="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700"
        data-testid="account-settings-validation"
      >
        <ul class="list-disc pl-5">
          <li v-for="error in validationErrors" :key="error">{{ error }}</li>
        </ul>
      </div>

      <FormField label="Current Password" required>
        <template #default="{ id }">
          <Input
            :id="id"
            v-model="currentPassword"
            type="password"
            autocomplete="current-password"
            data-testid="current-password-input"
          />
        </template>
      </FormField>

      <FormField label="New Password" required>
        <template #default="{ id }">
          <Input
            :id="id"
            v-model="newPassword"
            type="password"
            autocomplete="new-password"
            data-testid="new-password-input"
          />
        </template>
      </FormField>

      <FormField label="Confirm New Password" required>
        <template #default="{ id }">
          <Input
            :id="id"
            v-model="confirmPassword"
            type="password"
            autocomplete="new-password"
            data-testid="confirm-password-input"
          />
        </template>
      </FormField>

      <div class="flex items-center gap-3 pt-2">
        <Button
          type="submit"
          :disabled="!canSubmit"
          data-testid="change-password-button"
        >
          {{ submitting ? 'Updating...' : 'Change Password' }}
        </Button>
      </div>
    </form>
  </Card>
</template>

