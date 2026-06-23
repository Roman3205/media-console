import { ref, computed } from 'vue'

const currentUserVal = ref<{ id: string; name: string; email: string } | null>(null)
export const isCheckingAuth = ref(false)

export const currentUser = computed({
  get: () => currentUserVal.value,
  set: (val: { id: string; name: string; email: string } | null) => {
    currentUserVal.value = val
  }
})

export const isLoggedIn = computed(() => !!currentUser.value)
