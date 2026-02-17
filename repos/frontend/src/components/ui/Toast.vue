<script setup lang="ts">
/**
 * Toast Component
 *
 * A notification component that displays temporary messages with auto-dismiss.
 * Supports multiple toasts with stacking and different variants.
 *
 * @example
 * <Toast :toasts="notifications" @close="removeNotification" />
 *
 * Common Patterns:
 * - Use composable to manage toast state
 * - Auto-dismiss after 3-5 seconds
 * - Support multiple simultaneous toasts
 * - Position in corner of screen
 */
import { computed, watch, onUnmounted } from 'vue'

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string | number
  message: string
  variant?: ToastVariant
  duration?: number
}

interface Props {
  toasts: Toast[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'close': [id: string | number]
}>()

// Track timers for each toast
const timers = new Map<string | number, ReturnType<typeof setTimeout>>()

// Schedule auto-dismiss for a toast
function scheduleAutoDismiss(toast: Toast) {
  if (toast.duration && toast.duration > 0) {
    const timer = setTimeout(() => {
      closeToast(toast.id)
    }, toast.duration)
    timers.set(toast.id, timer)
  }
}

// Close toast and clear timer
function closeToast(id: string | number) {
  const timer = timers.get(id)
  if (timer) {
    clearTimeout(timer)
    timers.delete(id)
  }
  emit('close', id)
}

// Watch for new toasts and schedule their auto-dismiss
watch(() => props.toasts, (newToasts, oldToasts) => {
  // Schedule dismissal for new toasts
  newToasts.forEach(toast => {
    if (!timers.has(toast.id)) {
      scheduleAutoDismiss(toast)
    }
  })
  
  // Clean up timers for removed toasts
  if (oldToasts) {
    const oldIds = new Set(oldToasts.map(t => t.id))
    newToasts.forEach(toast => {
      oldIds.delete(toast.id)
    })
    oldIds.forEach(id => {
      const timer = timers.get(id)
      if (timer) {
        clearTimeout(timer)
        timers.delete(id)
      }
    })
  }
}, { deep: true })

// Clean up all timers on unmount
onUnmounted(() => {
  timers.forEach(timer => clearTimeout(timer))
  timers.clear()
})

// Variant styles using Tailwind classes
const variantClasses = computed(() => ({
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
}))

// Icon for each variant
const variantIcons = computed(() => ({
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
}))
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
      <TransitionGroup
        enter-active-class="transition-all duration-300"
        enter-from-class="opacity-0 translate-x-full"
        enter-to-class="opacity-100 translate-x-0"
        leave-active-class="transition-all duration-200"
        leave-from-class="opacity-100 translate-x-0"
        leave-to-class="opacity-0 translate-x-full"
      >
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="[
            'flex items-start gap-3 p-4 rounded-lg border shadow-lg',
            variantClasses[toast.variant || 'info']
          ]"
          role="alert"
          :aria-live="toast.variant === 'error' ? 'assertive' : 'polite'"
        >
          <span class="flex-shrink-0 text-lg" aria-hidden="true">
            {{ variantIcons[toast.variant || 'info'] }}
          </span>
          
          <p class="flex-1 text-sm font-medium">
            {{ toast.message }}
          </p>
          
          <button
            type="button"
            class="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition-opacity"
            @click="closeToast(toast.id)"
            :aria-label="`Close ${toast.variant || 'info'} notification`"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
