<script setup lang="ts">
/**
 * AppSidebar Component
 *
 * Persistent left sidebar with navigation links and daily quote widget.
 * Part of the AppShell layout, matches the example dashboard design.
 */
import { useRoute } from 'vue-router'

const route = useRoute()

const navLinks = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/history', label: 'History', icon: 'calendar_today' },
  { to: '/progress', label: 'Progress', icon: 'analytics' },
  { to: '/commitments', label: 'Commitments', icon: 'star' },
  { to: '/timeline', label: 'Timeline', icon: 'schedule' },
]

function isActive(to: string): boolean {
  return route.path === to
}
</script>

<template>
  <aside
    class="w-64 border-r border-slate-200 bg-white flex flex-col fixed h-[calc(100vh-64px)]"
    data-testid="app-sidebar"
  >
    <nav class="flex-1 px-4 py-6 space-y-2">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors"
        :class="isActive(link.to)
          ? 'bg-primary-500/10 text-primary-600 font-medium'
          : 'text-slate-600 hover:bg-slate-100'"
        :data-testid="`sidebar-link-${link.label.toLowerCase()}`"
      >
        <span class="material-symbols-outlined">{{ link.icon }}</span>
        <span class="text-sm">{{ link.label }}</span>
      </router-link>
    </nav>

    <div class="p-4 mt-auto">
      <div class="bg-primary-500/5 rounded-xl p-4 border border-primary-500/10">
        <p class="text-xs font-medium text-primary-600 uppercase tracking-wider mb-2">Daily Quote</p>
        <p class="text-sm italic text-slate-600">"Nature does not hurry, yet everything is accomplished."</p>
      </div>
    </div>
  </aside>
</template>
