import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface User {
  id: string
  name: string
  email: string
}

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null)
  const isCheckingAuth = ref(false)

  const isLoggedIn = computed(() => !!currentUser.value)

  return {
    currentUser,
    isCheckingAuth,
    isLoggedIn,
  }
})
