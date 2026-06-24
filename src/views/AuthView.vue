<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useMutation } from '@vue/apollo-composable'
import { LOGIN_MUTATION, SIGNUP_MUTATION } from '@/graphql/operations'
import { useAuthStore } from '@/stores/auth'
import { restartWebsocket } from '@/apollo'

const router = useRouter()
const authStore = useAuthStore()
const isLogin = ref(true)

const name = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')

const { mutate: loginMutate, loading: loginLoading } = useMutation(LOGIN_MUTATION)
const { mutate: signupMutate, loading: signupLoading } = useMutation(SIGNUP_MUTATION)

const handleAuth = async () => {
  errorMsg.value = ''
  
  if (isLogin.value) {
    if (!email.value || !password.value) {
      errorMsg.value = 'Please fill in all fields'
      return
    }
    
    try {
      const response = await loginMutate({
        email: email.value,
        password: password.value
      })
      
      if (response?.data?.login) {
        const { user } = response.data.login
        
        authStore.currentUser = user
        restartWebsocket()
        
        router.push({ name: 'dashboard' })
      }
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : 'Login failed. Please check your credentials.'
    }
  } else {
    if (!email.value || !name.value || !password.value) {
      errorMsg.value = 'Please fill in all fields'
      return
    }
    
    try {
      const response = await signupMutate({
        email: email.value,
        name: name.value,
        password: password.value
      })
      
      if (response?.data?.signup) {
        const { user } = response.data.signup
        
        authStore.currentUser = user
        restartWebsocket()
        
        router.push({ name: 'dashboard' })
      }
    } catch (err: unknown) {
      errorMsg.value = err instanceof Error ? err.message : 'Registration failed.'
    }
  }
}

const toggleMode = () => {
  isLogin.value = !isLogin.value
  errorMsg.value = ''
}
</script>

<template>
  <div class="flex items-center justify-center py-16 px-4">
    <div class="max-w-md w-full bg-white rounded-xl p-8 border border-zinc-200/60 shadow-xs">
      <div class="text-left mb-6 space-y-1">
        <h2 class="font-heading font-extrabold text-2xl text-zinc-950 tracking-tight">
          {{ isLogin ? 'Sign In' : 'Create Account' }}
        </h2>
        <p class="text-xs text-zinc-500 font-medium">
          {{ isLogin ? 'Sign in to the Media Console' : 'Register a new user account' }}
        </p>
      </div>

      <div v-if="errorMsg" class="bg-rose-50 text-rose-700 border border-rose-100 text-xs py-3 px-4 rounded-lg mb-6 text-center font-medium">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleAuth" class="space-y-4">
        <div v-if="!isLogin">
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5" for="name">Full Name</label>
          <input 
            v-model="name"
            class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors" 
            type="text" 
            id="name" 
            placeholder="John Doe" 
            required
          />
        </div>

        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5" for="email">Email Address</label>
          <input 
            v-model="email"
            class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors" 
            type="email" 
            id="email" 
            placeholder="name@company.com" 
            required
          />
        </div>

        <div>
          <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5" for="password">Password</label>
          <input 
            v-model="password"
            class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors" 
            type="password" 
            id="password" 
            placeholder="••••••••" 
            required
          />
        </div>

        <button 
          type="submit" 
          class="w-full bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs py-3 px-4 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          :disabled="loginLoading || signupLoading"
        >
          <span v-if="loginLoading || signupLoading" class="w-4 h-4 border-2 border-white/20 border-l-white rounded-full animate-spin"></span>
          <span v-else>{{ isLogin ? 'Sign In' : 'Register' }}</span>
        </button>
      </form>

      <div class="mt-6 pt-5 border-t border-zinc-100 text-center flex items-center justify-center gap-1 text-xs text-zinc-500 font-medium">
        <span>{{ isLogin ? "First time?" : 'Have an account?' }}</span>
        <a href="#" @click.prevent="toggleMode" class="font-bold text-zinc-900 hover:text-zinc-600 transition-colors">
          {{ isLogin ? 'Create one now' : 'Sign in here' }}
        </a>
      </div>
    </div>
  </div>
</template>
