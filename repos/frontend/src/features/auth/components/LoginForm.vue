<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button, Input, FormField } from '@/components/ui'

interface Props {
  loading?: boolean
  error?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit', payload: { email: string; password: string }): void
}>()

const email = ref('')
const password = ref('')
const validationError = ref('')

const displayError = computed(() => props.error || validationError.value)

const validate = () => {
  validationError.value = ''

  if (!email.value) {
    validationError.value = 'Email is required'
    return false
  }

  if (!password.value) {
    validationError.value = 'Password is required'
    return false
  }

  return true
}

const handleSubmit = () => {
  if (validate()) {
    emit('submit', {
      email: email.value,
      password: password.value
    })
  }
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-4">
    <div v-if="displayError" class="text-red-600 text-sm mb-4" role="alert">
      {{ displayError }}
    </div>

    <FormField label="Email" required>
      <template #default="{ id }">
        <Input
          :id="id"
          v-model="email"
          type="email"
          placeholder="you@example.com"
          :error="Boolean(validationError && !email)"
        />
      </template>
    </FormField>

    <FormField label="Password" required>
      <template #default="{ id }">
        <Input
          :id="id"
          v-model="password"
          type="password"
          :error="Boolean(validationError && !password)"
        />
      </template>
    </FormField>

    <Button
      type="submit"
      variant="primary"
      :disabled="loading"
      class="w-full"
    >
      {{ loading ? 'Signing in...' : 'Sign in' }}
    </Button>
  </form>
</template>
