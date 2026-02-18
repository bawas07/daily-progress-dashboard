<script setup lang="ts">
import { ref, watch } from 'vue'

interface Props {
  open: boolean
  itemTitle: string
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [dto: { note?: string; isOffDay: boolean }]
}>()

const note = ref('')
const isOffDay = ref(false)
const localOpen = ref(props.open)

const MAX_NOTE_LENGTH = 1000

watch(() => props.open, (newValue) => {
  localOpen.value = newValue
  if (newValue) {
    note.value = ''
    isOffDay.value = false
  }
})

watch(localOpen, (newValue) => {
  emit('update:open', newValue)
})

const handleSubmit = () => {
  const dto = {
    note: note.value.trim() || undefined,
    isOffDay: isOffDay.value,
  }
  emit('submit', dto)
}

const handleClose = () => {
  localOpen.value = false
}

const remainingChars = () => MAX_NOTE_LENGTH - note.value.length
</script>

<template>
  <div v-if="localOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-lg font-semibold">Log Progress: {{ itemTitle }}</h2>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      <form @submit.prevent="handleSubmit" class="p-6 space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Notes</label>
          <p class="text-xs text-gray-500 mb-2">Optional - {{ remainingChars() }} characters remaining</p>
          <textarea
            v-model="note"
            rows="4"
            maxlength="1000"
            class="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="Describe your progress..."
          />
        </div>

        <label class="flex items-center gap-2">
          <input v-model="isOffDay" type="checkbox" class="h-4 w-4" />
          <span class="text-sm">This is an off-day log</span>
        </label>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            @click="handleClose"
            :disabled="submitting"
            class="px-4 py-2 border border-gray-300 rounded-md"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting || note.length > MAX_NOTE_LENGTH"
            class="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {{ submitting ? 'Logging...' : 'Log Progress' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
