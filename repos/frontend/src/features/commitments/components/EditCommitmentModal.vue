<script setup lang="ts">
/**
 * EditCommitmentModal Component
 *
 * Modal wrapper for CreateCommitmentForm to edit existing commitments.
 */
import { ref, watch, computed } from 'vue'
import CreateCommitmentForm from './CreateCommitmentForm.vue'
import type { Commitment, CreateCommitmentDto } from '../types/commitment.types'

interface Props {
  open: boolean
  commitment: Commitment
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  save: [id: string, dto: CreateCommitmentDto]
}>()

const localOpen = ref(props.open)

watch(() => props.open, (newValue) => {
  localOpen.value = newValue
})

watch(localOpen, (newValue) => {
  emit('update:open', newValue)
})

const initialValues = computed<CreateCommitmentDto>(() => ({
  title: props.commitment.title,
  scheduledDays: props.commitment.scheduledDays,
}))

function handleSuccess(dto: CreateCommitmentDto) {
  emit('save', props.commitment.id, dto)
}

function handleCancel() {
  localOpen.value = false
}
</script>

<template>
  <div v-if="localOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
    <!-- Using a slightly wider max-width for the form -->
    <div class="bg-white rounded-lg shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6">
        <CreateCommitmentForm
          :initial-values="initialValues"
          :is-editing="true"
          @success="handleSuccess"
          @cancel="handleCancel"
        />
      </div>
    </div>
  </div>
</template>
