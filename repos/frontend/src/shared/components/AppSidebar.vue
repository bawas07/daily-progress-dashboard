<script setup lang="ts">
import { useRoute } from 'vue-router'

interface Props {
  open?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
})

const emit = defineEmits<{
  close: []
}>()

const route = useRoute()

const navLinks = [
  { to: '/', label: 'Dashboard', icon: 'dashboard' },
  { to: '/history', label: 'History', icon: 'calendar_today' },
  { to: '/progress', label: 'Progress', icon: 'analytics' },
  { to: '/commitments', label: 'Commitments', icon: 'star' },
  { to: '/timeline', label: 'Timeline', icon: 'schedule' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

function isActive(to: string): boolean {
  return route.path === to
}

function closeSidebar() {
  emit('close')
}
</script>

<template>
  <aside
    id="app-sidebar"
    class="fixed bottom-0 left-0 top-16 z-40 flex w-72 flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:w-64"
    :class="props.open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
    data-testid="app-sidebar"
    aria-label="Primary navigation"
  >
    <div class="flex items-center justify-between border-b border-slate-100 px-4 py-3 lg:hidden">
      <p class="text-sm font-semibold text-slate-700">Navigation</p>
      <button
        class="inline-flex h-8 w-8 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Close navigation menu"
        @click="closeSidebar"
      >
        <span class="material-symbols-outlined text-lg">close</span>
      </button>
    </div>

    <nav class="flex-1 space-y-2 px-4 py-6">
      <router-link
        v-for="link in navLinks"
        :key="link.to"
        :to="link.to"
        class="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500"
        :class="
          isActive(link.to)
            ? 'bg-primary-500/10 font-medium text-primary-700'
            : 'text-slate-600 hover:bg-slate-100'
        "
        :data-testid="`sidebar-link-${link.label.toLowerCase()}`"
        @click="closeSidebar"
      >
        <span class="material-symbols-outlined">{{ link.icon }}</span>
        <span class="text-sm">{{ link.label }}</span>
      </router-link>
    </nav>

    <div class="mt-auto p-4">
      <div class="rounded-xl border border-primary-500/10 bg-primary-500/5 p-4">
        <p class="mb-2 text-xs font-medium uppercase tracking-wider text-primary-700">Daily Quote</p>
        <p class="text-sm italic text-slate-600">"Nature does not hurry, yet everything is accomplished."</p>
      </div>
    </div>
  </aside>
</template>

