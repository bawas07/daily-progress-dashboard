<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'

const route = useRoute()
const sidebarOpen = ref(false)

function toggleSidebar() {
  sidebarOpen.value = !sidebarOpen.value
}

function closeSidebar() {
  sidebarOpen.value = false
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeSidebar()
  }
}

watch(
  () => route.fullPath,
  () => {
    closeSidebar()
  }
)

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <div class="min-h-screen bg-background-light font-display antialiased" data-testid="app-shell">
    <a
      href="#main-content"
      class="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary-700 focus:shadow"
    >
      Skip to main content
    </a>

    <AppHeader :sidebar-open="sidebarOpen" @toggle-sidebar="toggleSidebar" />

    <div
      v-if="sidebarOpen"
      class="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
      aria-hidden="true"
      @click="closeSidebar"
    ></div>

    <div class="flex min-h-screen pt-16">
      <AppSidebar :open="sidebarOpen" @close="closeSidebar" />
      <main
        id="main-content"
        class="ml-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:ml-64 lg:p-10"
        tabindex="-1"
      >
        <slot />
      </main>
    </div>
  </div>
</template>
