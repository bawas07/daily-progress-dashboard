<script setup lang="ts">
import { ref } from 'vue'

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
    <div v-if="error || validationError" class="text-red-500 text-sm mb-4">
      {{ error || validationError }}
    </div>
    
    <div>
      <label for="name" class="block text-sm font-medium text-gray-700">Name</label>
      <input
        id="name"
        v-model="name"
        type="text"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="John Doe"
      />
    </div>

    <div>
      <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
      <input
        id="email"
        v-model="email"
        type="email"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        placeholder="you@example.com"
      />
    </div>

    <div>
      <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
      <input
        id="password"
        v-model="password"
        type="password"
        class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
      />
    </div>

    <button
      type="submit"
      :disabled="loading"
      class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
    >
      {{ loading ? 'Loading...' : 'Register' }}
    </button>
  </form>
</template>
