import { createRouter, createWebHistory } from 'vue-router'
import { apolloClient } from '../apollo'
import { ME_QUERY } from '../graphql/operations'
import { currentUser, isCheckingAuth } from '../utils/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue'),
    },
    {
      path: '/auth',
      name: 'auth',
      component: () => import('../views/AuthView.vue'),
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/search',
      name: 'search',
      component: () => import('../views/SearchView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/post/:id',
      name: 'post-detail',
      component: () => import('../views/PostDetailView.vue'),
    },
  ],
})

let hasCheckedInitialAuth = false

router.beforeEach(async (to, from, next) => {
  if (!hasCheckedInitialAuth) {
    hasCheckedInitialAuth = true
    isCheckingAuth.value = true
    try {
      const response = await apolloClient.query({
        query: ME_QUERY,
        fetchPolicy: 'network-only',
      })
      
      if (response.data?.me) {
        currentUser.value = response.data.me
      }
    } catch {
      currentUser.value = null
    } finally {
      isCheckingAuth.value = false
    }
  }

  if (to.meta.requiresAuth && !currentUser.value) {
    return next({ name: 'auth' })
  }

  if (to.name === 'auth' && currentUser.value) {
    return next({ name: 'dashboard' })
  }

  next()
})

export default router
