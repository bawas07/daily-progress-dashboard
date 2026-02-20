<script setup lang="ts">
/**
 * Modal Component
 *
 * A dialog component with overlay, focus trap, and accessibility features.
 * Uses teleport to render at body level and manages focus within the modal.
 *
 * @example
 * <Modal v-model:open="isOpen" title="Confirm Action">
 *   <p>Are you sure you want to proceed?</p>
 *   <template #footer>
 *     <Button @click="isOpen = false">Cancel</Button>
 *     <Button variant="primary" @click="confirm">Confirm</Button>
 *   </template>
 * </Modal>
 *
 * Common Patterns:
 * - Use v-model:open for two-way binding
 * - Provide title for accessibility
 * - Use footer slot for action buttons
 * - Close is triggered by ESC key or backdrop click
 */
import { computed, watch, nextTick, ref, onUnmounted } from 'vue'

interface Props {
  open?: boolean
  title?: string
  closeOnBackdrop?: boolean
  closeOnEsc?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  closeOnBackdrop: true,
  closeOnEsc: true,
})

const emit = defineEmits<{
  'update:open': [value: boolean]
  'close': []
}>()

// Track trigger element for focus restoration
const triggerElement = ref<HTMLElement | null>(null)
// Reference to modal content for proper focus management
const modalContent = ref<HTMLElement | null>(null)

// Computed open state for two-way binding
const isOpen = computed({
  get: () => props.open,
  set: (value) => emit('update:open', value),
})

// Close modal
function close() {
  emit('close')
  isOpen.value = false
}

// Handle backdrop click
function handleBackdropClick(event: MouseEvent) {
  if (props.closeOnBackdrop && event.target === event.currentTarget) {
    close()
  }
}

// Handle ESC key
function handleKeydown(event: KeyboardEvent) {
  if (props.closeOnEsc && event.key === 'Escape') {
    close()
    return
  }

  if (event.key !== 'Tab' || !modalContent.value) return

  const focusable = modalContent.value.querySelectorAll<HTMLElement>(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  )

  if (focusable.length === 0) {
    event.preventDefault()
    return
  }

  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  const active = document.activeElement as HTMLElement | null

  if (event.shiftKey && active === first) {
    event.preventDefault()
    last.focus()
    return
  }

  if (!event.shiftKey && active === last) {
    event.preventDefault()
    first.focus()
  }
}

// Manage focus and body scroll
watch(isOpen, async (newValue) => {
  if (newValue) {
    // Store trigger element
    triggerElement.value = document.activeElement as HTMLElement
    
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    
    // Wait for DOM to update then focus modal content
    await nextTick()
    const firstFocusable = modalContent.value?.querySelector<HTMLElement>(
      'button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    )
    firstFocusable?.focus() || modalContent.value?.focus()
  } else {
    // Restore body scroll
    document.body.style.overflow = ''
    
    // Return focus to trigger element
    triggerElement.value?.focus()
  }
})

// Cleanup on unmount to prevent memory leak
onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="title ? 'modal-title' : undefined"
        tabindex="-1"
        @click="handleBackdropClick"
        @keydown="handleKeydown"
      >
        <Transition
          enter-active-class="transition-all duration-300"
          enter-from-class="opacity-0 scale-95"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition-all duration-200"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-95"
        >
          <div
            v-if="isOpen"
            ref="modalContent"
            class="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            tabindex="-1"
            @click.stop
          >
            <!-- Header -->
            <div v-if="title || $slots.header" class="flex items-center justify-between p-6 border-b border-neutral-200">
              <h2 v-if="title" id="modal-title" class="text-lg font-semibold text-neutral-900">
                {{ title }}
              </h2>
              <slot name="header" />
              <button
                v-if="!$slots.header"
                type="button"
                class="text-neutral-400 hover:text-neutral-600 transition-colors"
                @click="close"
                aria-label="Close modal"
              >
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <!-- Body -->
            <div class="p-6">
              <slot />
            </div>

            <!-- Footer -->
            <div v-if="$slots.footer" class="flex items-center justify-end gap-3 p-6 border-t border-neutral-200 bg-neutral-50 rounded-b-lg">
              <slot name="footer" />
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
