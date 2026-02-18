<script setup lang="ts">
/**
 * App component with AppShell layout for authenticated routes
 */
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppShell from '@/shared/components/AppShell.vue'

const route = useRoute()

// Routes that don't use the AppShell layout (auth pages)
const noShellRoutes = ['/login', '/register']

const showShell = computed(() => {
  return !noShellRoutes.includes(route.path) && route.meta.requiresAuth !== false
})
</script>

<template>
  <div id="app">
    <AppShell v-if="showShell">
      <RouterView />
    </AppShell>
    <RouterView v-else />
  </div>
</template>
