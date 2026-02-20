<script setup lang="ts">
/**
 * LogCommitmentModal Component
 *
 * Modal for logging commitment completion with optional notes.
 */
import { ref, watch } from 'vue'

interface Props {
  open: boolean
  commitmentTitle: string
  submitting?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  submit: [dto: { note?: string }]
}>()

const note = ref('')
const localOpen = ref(props.open)

const MAX_NOTE_LENGTH = 1000

watch(() => props.open, (newValue) => {
  localOpen.value = newValue
  if (newValue) {
    note.value = ''
  }
})

watch(localOpen, (newValue) => {
  emit('update:open', newValue)
})

const handleSubmit = () => {
  const dto = {
    note: note.value.trim() || undefined,
  }
  emit('submit', dto)
}

const handleClose = () => {
  localOpen.value = false
}

const remainingChars = () => MAX_NOTE_LENGTH - note.value.length
</script>

<template>
  <div
    v-if="localOpen"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    role="dialog"
    aria-modal="true"
    data-testid="commitment-log-modal"
  >
    <div class="bg-white rounded-lg shadow-xl max-w-lg w-full">
      <div class="flex items-center justify-between p-6 border-b">
        <h2 class="text-lg font-semibold" data-testid="commitment-log-title">Log Activity: {{ commitmentTitle }}</h2>
        <button @click="handleClose" class="text-gray-400 hover:text-gray-600" aria-label="Close log activity modal">✕</button>
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
            placeholder="Add notes about this activity..."
            data-testid="commitment-log-note"
          />
        </div>

        <div class="flex justify-end gap-3 pt-4">
          <button
            type="button"
            @click="handleClose"
            :disabled="submitting"
            class="px-4 py-2 border border-gray-300 rounded-md"
            data-testid="commitment-log-cancel"
          >
            Cancel
          </button>
          <button
            type="submit"
            :disabled="submitting || note.length > MAX_NOTE_LENGTH"
            class="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            data-testid="commitment-log-submit"
          >
            {{ submitting ? 'Logging...' : 'Log Activity' }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>
