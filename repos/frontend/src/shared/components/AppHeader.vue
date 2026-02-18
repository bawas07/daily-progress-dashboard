<script setup lang="ts">
/**
 * AppHeader Component (Redesigned)
 *
 * Fixed top header with logo, search input placeholder, and profile dropdown.
 * Part of the AppShell layout, matches the example dashboard design.
 */
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth.store'

const router = useRouter()
const authStore = useAuthStore()
const showDropdown = ref(false)

function toggleDropdown() {
  showDropdown.value = !showDropdown.value
}

function closeDropdown() {
  showDropdown.value = false
}

async function handleLogout() {
  closeDropdown()
  await authStore.logout()
  router.push('/login')
}
</script>

<template>
  <header
    class="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 px-6 flex items-center justify-between font-display"
    data-testid="app-header"
  >
    <!-- Logo / Brand -->
    <div class="flex items-center gap-3 w-1/4">
      <div class="h-8 w-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-600">
        <span class="material-symbols-outlined text-xl">eco</span>
      </div>
      <h1 class="text-lg font-bold tracking-tight text-slate-900">Daily Progress</h1>
    </div>

    <!-- Search -->
    <div class="flex-1 flex justify-center max-w-xl px-4">
      <div class="relative w-full">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input
          class="w-full bg-slate-100/50 border-none rounded-xl py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:ring-2 focus:ring-primary-500/20 focus:bg-white transition-all outline-none"
          placeholder="Search items, notes, or history..."
          type="text"
          data-testid="header-search"
        />
      </div>
    </div>

    <!-- Profile Dropdown -->
    <div class="flex items-center justify-end gap-4 w-1/4">
      <div class="relative" @mouseleave="closeDropdown">
        <button
          class="flex items-center gap-2 focus:outline-none"
          data-testid="profile-button"
          @click="toggleDropdown"
        >
          <div class="h-9 w-9 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
            <span class="material-symbols-outlined text-slate-500">person</span>
          </div>
        </button>
        <div
          v-show="showDropdown"
          class="absolute right-0 mt-0 w-48 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50"
          data-testid="profile-dropdown"
        >
          <router-link
            to="/settings"
            class="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-colors"
            @click="closeDropdown"
          >
            <span class="material-symbols-outlined text-lg">person</span>
            Profile Settings
          </router-link>
          <div class="h-px bg-slate-100 my-1 mx-4"></div>
          <button
            class="flex items-center gap-3 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors w-full text-left"
            data-testid="logout-button"
            @click="handleLogout"
          >
            <span class="material-symbols-outlined text-lg">logout</span>
            Logout
          </button>
        </div>
      </div>
    </div>
  </header>
</template>
