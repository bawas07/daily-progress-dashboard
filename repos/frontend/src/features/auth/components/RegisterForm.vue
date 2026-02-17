<script setup lang="ts">
import { ref, computed } from 'vue'
import { Button, Input, FormField } from '@/components/ui'

interface Props {
  loading?: boolean
  error?: string | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'submit', payload: { name: string; email: string; password: string }): void
}>()

const name = ref('')
const email = ref('')
const password = ref('')
const validationError = ref('')

const displayError = computed(() => props.error || validationError.value)

const validate = () => {
  validationError.value = ''

  if (!name.value) {
    validationError.value = 'Name is required'
    return false
  }

  if (!email.value) {
    validationError.value = 'Email is required'
    return false
  }

  if (!password.value) {
    validationError.value = 'Password is required'
    return false
  }

  if (password.value.length < 8) {
    validationError.value = 'Password must be at least 8 characters'
    return false
  }

  if (!/[a-z]/.test(password.value)) {
    validationError.value = 'Password must contain at least one lowercase letter'
    return false
  }

  if (!/[A-Z]/.test(password.value)) {
    validationError.value = 'Password must contain at least one uppercase letter'
    return false
  }

  if (!/[0-9]/.test(password.value)) {
    validationError.value = 'Password must contain at least one number'
    return false
  }

  return true
}

const handleSubmit = () => {
  if (validate()) {
    emit('submit', {
      name: name.value,
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

    <FormField label="Name" required>
      <template #default="{ id }">
        <Input
          :id="id"
          v-model="name"
          type="text"
          placeholder="John Doe"
          :error="Boolean(validationError && !name)"
        />
      </template>
    </FormField>

    <FormField label="Email" required help="We'll never share your email with anyone else">
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

    <FormField label="Password" required help="Must be at least 8 characters with uppercase, lowercase, and number">
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
      {{ loading ? 'Creating account...' : 'Register' }}
    </Button>
  </form>
</template>
