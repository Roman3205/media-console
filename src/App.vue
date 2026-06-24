<script setup lang="ts">
import { RouterView, useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { LOGOUT_MUTATION } from './graphql/operations'
import { useAuthStore } from './stores/auth'
import { restartWebsocket } from './apollo'

const router = useRouter()
const authStore = useAuthStore()

const { mutate: logoutMutate } = useMutation(LOGOUT_MUTATION)

const handleLogout = async () => {
  try {
    await logoutMutate()
  } catch (err) {
    console.error('Logout error:', err)
  } finally {
    authStore.currentUser = null
    restartWebsocket()
    router.push({ name: 'auth' })
  }
}

</script>

<template>
  <div class="flex flex-col min-h-screen bg-[#fafafa] text-zinc-900 antialiased font-body animate-slide-up">
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <router-link to="/" class="flex items-center gap-2 font-heading font-bold text-sm tracking-tight text-zinc-900 uppercase">
          <span class="bg-zinc-300 text-white rounded p-1 text-xs">✏️</span> Media Console
        </router-link>
        
        <div class="flex items-center gap-8">
          <div class="flex items-center gap-6">
            <router-link to="/" class="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider" exact-active-class="text-zinc-955 font-bold">Feed</router-link>
            <router-link v-if="authStore.isLoggedIn" to="/search" class="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider" exact-active-class="text-zinc-955 font-bold">Search</router-link>
            <router-link v-if="authStore.isLoggedIn" to="/dashboard" class="text-xs font-semibold text-zinc-500 hover:text-zinc-900 transition-colors uppercase tracking-wider" exact-active-class="text-zinc-955 font-bold">Dashboard</router-link>
          </div>
          
          <div class="flex items-center gap-4">
            <span v-if="authStore.isLoggedIn && authStore.currentUser" class="hidden sm:inline-flex bg-zinc-100 text-zinc-700 px-3 py-1 rounded-md text-xs font-semibold">
              {{ authStore.currentUser.name }}
            </span>
            <button 
              v-if="authStore.isLoggedIn" 
              @click="handleLogout" 
              class="text-xs font-semibold text-zinc-400 hover:text-zinc-900 transition-colors cursor-pointer uppercase tracking-wider"
            >
              Sign Out
            </button>
            <router-link 
              v-else 
              :to="{ name: 'auth' }" 
              class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-4 py-2 rounded-md shadow-sm transition-colors uppercase tracking-wider"
            >
              Sign In
            </router-link>
          </div>
        </div>
      </div>
    </nav>

    <main class="flex-1 max-w-5xl w-full mx-auto px-6 py-8">
      <RouterView />
    </main>

    <div v-if="authStore.isCheckingAuth" class="fixed inset-0 z-[9999] bg-white/40 backdrop-blur-[1px] cursor-not-allowed flex items-center justify-center">
      <div class="bg-white rounded-xl p-4 shadow-lg border border-zinc-200/60 flex items-center gap-3">
        <span class="w-4 h-4 border-2 border-zinc-800 border-l-transparent rounded-full animate-spin"></span>
        <span class="text-xs font-semibold text-zinc-800 uppercase tracking-wider">Verifying authentication...</span>
      </div>
    </div>
  </div>
</template>
