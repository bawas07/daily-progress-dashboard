<script setup lang="ts">
/**
 * AppShell Layout Component
 *
 * Provides the app-level shell layout with fixed header, persistent sidebar,
 * and main content area. Used by authenticated routes.
 */
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
</script>

<template>
  <div class="min-h-screen bg-background-light font-display antialiased" data-testid="app-shell">
    <AppHeader />
    <div class="flex min-h-screen pt-16">
      <AppSidebar />
      <main class="ml-64 flex-1 p-8 lg:p-12 overflow-y-auto">
        <slot />
      </main>
    </div>
  </div>
</template>
