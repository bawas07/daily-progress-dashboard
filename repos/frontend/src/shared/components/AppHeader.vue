<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

interface Props {
  sidebarOpen?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  sidebarOpen: false,
})

const emit = defineEmits<{
  'toggle-sidebar': []
}>()

const router = useRouter()
const authStore = useAuthStore()
const showDropdown = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

function handleDocumentClick(event: MouseEvent) {
  if (!showDropdown.value || !dropdownRef.value) return
  if (!dropdownRef.value.contains(event.target as Node)) {
    closeDropdown()
  }
}

function handleEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    closeDropdown()
  }
}

async function handleLogout() {
  closeDropdown()
  await authStore.logout()
  router.push('/login')
}

function toggleSidebar() {
  emit('toggle-sidebar')
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<template>
  <header
    class="fixed inset-x-0 top-0 z-50 h-16 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6"
    data-testid="app-header"
  >
    <div class="mx-auto flex h-full max-w-[1440px] items-center justify-between gap-4">
      <div class="flex min-w-0 items-center gap-3">
        <button
          class="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 lg:hidden"
          :aria-expanded="props.sidebarOpen"
          aria-controls="app-sidebar"
          aria-label="Toggle navigation menu"
          data-testid="mobile-menu-toggle"
          @click="toggleSidebar"
        >
          <span class="material-symbols-outlined text-lg">menu</span>
        </button>
        <div class="flex min-w-0 items-center gap-2">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-500/10 text-primary-600">
            <span class="material-symbols-outlined text-xl">eco</span>
          </div>
          <h1 class="truncate text-base font-bold tracking-tight text-slate-900 sm:text-lg">Daily Progress</h1>
        </div>
      </div>

      <div class="hidden flex-1 md:flex md:max-w-xl">
        <label class="relative w-full">
          <span class="sr-only">Search</span>
          <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
            search
          </span>
          <input
            class="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-200"
            placeholder="Search items, notes, or history..."
            type="text"
            data-testid="header-search"
          />
        </label>
      </div>

      <div class="flex items-center justify-end">
        <div ref="dropdownRef" class="relative">
          <button
            class="flex items-center gap-2 rounded-full p-1 focus:outline-none focus:ring-2 focus:ring-primary-500"
            data-testid="profile-button"
            aria-haspopup="menu"
            :aria-expanded="showDropdown"
            aria-label="Open profile menu"
            @click.stop="toggleDropdown"
          >
            <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-slate-200 shadow-sm">
              <span class="material-symbols-outlined text-slate-500">person</span>
            </div>
          </button>

          <div
            v-if="showDropdown"
            class="absolute right-0 mt-2 w-52 rounded-xl border border-slate-200 bg-white py-2 shadow-xl"
            data-testid="profile-dropdown"
            role="menu"
            aria-label="Profile menu"
          >
            <router-link
              to="/settings"
              class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 transition-colors hover:bg-slate-50"
              role="menuitem"
              @click="closeDropdown"
            >
              <span class="material-symbols-outlined text-lg">settings</span>
              Settings
            </router-link>
            <div class="mx-4 my-1 h-px bg-slate-100"></div>
            <button
              class="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
              data-testid="logout-button"
              role="menuitem"
              @click="handleLogout"
            >
              <span class="material-symbols-outlined text-lg">logout</span>
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  </header>
</template>

