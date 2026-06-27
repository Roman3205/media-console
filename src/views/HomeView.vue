<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { POSTS_QUERY, CATEGORIES_QUERY, POST_CREATED_SUBSCRIPTION } from '@/graphql/operations'
import type { PostEdge, PostsQueryData, PostCreatedSubscriptionData } from '@/types'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()

const { result: postsResult, loading: postsLoading, error: postsError, fetchMore, subscribeToMore } = useQuery<PostsQueryData>(
  POSTS_QUERY,
  {
    first: 5,
    after: null
  },
  {
    notifyOnNetworkStatusChange: true
  }
)

const { result: categoriesResult, loading: categoriesLoading } = useQuery(CATEGORIES_QUERY)

const postsConnection = computed(() => postsResult.value?.posts)
const posts = computed(() => postsConnection.value?.edges || [])
const pageInfo = computed(() => postsConnection.value?.pageInfo)
const totalCount = computed(() => postsConnection.value?.totalCount || 0)
const categories = computed(() => categoriesResult.value?.categories || [])

const handleLoadMore = () => {
  const endCursor = pageInfo.value?.endCursor
  if (!endCursor) return

  fetchMore({
    variables: {
      after: endCursor
    },
    updateQuery: (previousResult, { fetchMoreResult }) => {
      if (!fetchMoreResult) return previousResult

      return {
        posts: {
          ...previousResult.posts,
          totalCount: fetchMoreResult.posts.totalCount,
          pageInfo: fetchMoreResult.posts.pageInfo,
          edges: [
            ...previousResult.posts.edges,
            ...fetchMoreResult.posts.edges
          ]
        }
      }
    }
  })
}

const toasts = ref<{ id: number; title: string; body: string }[]>([])
let toastIdSeq = 0

subscribeToMore<PostsQueryData, PostCreatedSubscriptionData>({
  document: POST_CREATED_SUBSCRIPTION,
  updateQuery: (previousResult, { subscriptionData }) => {
    if (!subscriptionData.data) return previousResult
    const newPost = subscriptionData.data.postCreated

    // Prevent duplicate entries in the local feed list
    const exists = previousResult.posts.edges.some(
      (edge: PostEdge) => edge.node.id === newPost.id
    )
    if (exists) return previousResult

    // Show toast notifications only to other users/devices (author gets immediate list update)
    if (!authStore.currentUser || String(newPost.author?.id) !== String(authStore.currentUser.id)) {
      const id = toastIdSeq++
      toasts.value.push({
        id,
        title: 'New Post! 📣',
        body: `"${newPost.title.length > 30 ? (newPost.title.substring(0, 30) + '...') : newPost.title}" by ${newPost.author?.name || 'Anonymous'}`
      })

      setTimeout(() => {
        toasts.value = toasts.value.filter(t => t.id !== id)
      }, 6000)
    }

    // Convert cursor database format (cursor:<id>) to base64 string matching Apollo schema standards
    const cursorStr = `cursor:${newPost.id}`
    const newEdge = {
      __typename: 'PostEdge',
      cursor: btoa(cursorStr),
      node: newPost
    }

    return {
      posts: {
        ...previousResult.posts,
        totalCount: previousResult.posts.totalCount + 1,
        edges: [newEdge, ...previousResult.posts.edges]
      }
    }
  }
})
</script><template>
  <div class="space-y-10">
    <div class="text-left border-b border-zinc-100 pb-8 space-y-2">
      <h1 class="font-heading font-extrabold text-3xl text-zinc-955 tracking-tight">Media Feed</h1>
      <p class="text-sm text-zinc-500 font-medium">
        Review articles, posts, and category feeds in real-time.
      </p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-8 items-start">
      <aside class="space-y-6">
        <div class="bg-white rounded-xl p-5 border border-zinc-200/60 space-y-4">
          <h3 class="font-heading font-bold text-zinc-400 text-xs tracking-wider uppercase">Categories</h3>
          <div v-if="categoriesLoading" class="text-xs text-zinc-400 italic">Loading...</div>
          <div v-else-if="categories.length === 0" class="text-xs text-zinc-400 italic">No items.</div>
          <ul v-else class="space-y-2">
            <li v-for="cat in categories" :key="cat.id" class="flex items-center gap-2 text-xs font-semibold text-zinc-700">
              <span class="h-1.5 w-1.5 rounded-full bg-zinc-900"></span>
              <span>{{ cat.name }}</span>
            </li>
          </ul>
        </div>
        <div class="bg-white rounded-xl p-5 border border-zinc-200/60 space-y-4">
          <h3 class="font-heading font-bold text-zinc-400 text-xs tracking-wider uppercase">Live Stats</h3>
          <div class="space-y-2 text-xs">
            <div class="flex justify-between items-center">
              <span class="text-zinc-400">Total Posts:</span>
              <span class="font-bold text-zinc-800 bg-zinc-50 border border-zinc-100 px-1.5 py-0.5 rounded">{{ totalCount }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-zinc-400">Feed Status:</span>
              <span class="font-bold text-zinc-850 flex items-center gap-1.5">
                <span v-if="!postsLoading">Live</span>
                <span v-else-if="postsError">Not live</span>
                <span class="relative flex h-1.5 w-1.5">
                  <span class="absolute inline-flex h-full w-full rounded-full opacity-75" :class="{
                    'bg-emerald-400 animate-ping': !postsLoading,
                    'bg-red-600': postsError
                  }"></span>
                  <span class="relative inline-flex rounded-full h-1.5 w-1.5" :class="{
                    'bg-emerald-400': !postsLoading,
                    'bg-red-600': postsError
                  }"></span>
                </span>
              </span>
            </div>
          </div>
        </div>
      </aside>

      <main class="space-y-6">
        <div class="flex items-center justify-between">
          <h2 class="font-heading font-extrabold text-xl text-zinc-950 tracking-tight">Recent Articles</h2>
          <span v-if="totalCount" class="bg-zinc-100 text-zinc-800 border border-zinc-200/65 text-xs font-semibold px-2 py-0.5 rounded-md">
            {{ totalCount }} posts
          </span>
        </div>

        <div v-if="postsLoading && !posts.length" class="flex justify-center py-12">
          <div class="w-8 h-8 border-2 border-zinc-200 border-l-zinc-900 rounded-full animate-spin"></div>
        </div>

        <div v-else-if="postsError" class="bg-rose-50 text-rose-700 border border-rose-100 p-5 rounded-xl">
          <h3 class="font-heading font-bold text-sm">Failed to load posts</h3>
          <p class="text-xs mt-1">{{ postsError.message }}</p>
        </div>

        <div v-else-if="posts.length === 0" class="bg-white rounded-xl p-12 text-center border border-zinc-200/60 space-y-4">
          <div class="text-3xl">📂</div>
          <h4 class="font-heading font-bold text-base text-zinc-850">Empty Articles Feed</h4>
          <p class="text-xs text-zinc-500 max-w-xs mx-auto">
            Log in to your dashboard to create a post and publish it here.
          </p>
        </div>

        <div v-else class="space-y-4">
          <article 
            v-for="edge in posts" 
            :key="edge.node.id" 
            class="bg-white rounded-xl p-6 border border-zinc-200/60 hover:border-zinc-300 transition-colors space-y-4"
          >
            <div class="flex justify-between items-center">
              <div class="flex flex-wrap gap-1.5">
                <span 
                  v-for="cat in edge.node.categories" 
                  :key="cat.id" 
                  class="bg-zinc-100 text-zinc-800 text-[9px] font-bold px-2 py-0.5 rounded-md border border-zinc-200/50 uppercase tracking-wide"
                >
                  {{ cat.name }}
                </span>
              </div>
              <span class="text-xs text-zinc-400">
                {{ new Date(Number(edge.node.createdAt)).toLocaleDateString() }}
              </span>
            </div>

            <h3 class="font-heading font-bold text-lg text-zinc-950 tracking-tight leading-snug line-clamp-1">
              <router-link :to="{ name: 'post-detail', params: { id: edge.node.id } }" class="hover:text-zinc-650 transition-colors">
                {{ edge.node.title }}
              </router-link>
            </h3>

            <p class="text-zinc-650 text-sm leading-relaxed line-clamp-3">
              {{ edge.node.content || 'This post has no content preview.' }}
            </p>

            <div class="pt-4 border-t border-zinc-100 flex justify-between items-center text-xs">
              <span class="font-semibold text-zinc-500">By {{ edge.node.author?.name || 'Anonymous' }}</span>
              <router-link 
                :to="{ name: 'post-detail', params: { id: edge.node.id } }" 
                class="font-semibold text-zinc-900 hover:text-zinc-500 transition-colors inline-flex items-center gap-0.5"
              >
                Read Article &rarr;
              </router-link>
            </div>
          </article>

          <div class="text-center pt-4">
            <button 
              v-if="pageInfo?.hasNextPage" 
              @click="handleLoadMore" 
              class="w-full max-w-[200px] bg-zinc-900 hover:bg-zinc-800 text-white font-bold text-xs py-2.5 px-4 rounded-xl shadow-sm transition-colors cursor-pointer inline-flex items-center justify-center gap-2" 
              :disabled="postsLoading"
            >
              <span v-if="postsLoading" class="w-4 h-4 border-2 border-white/20 border-l-white rounded-full animate-spin"></span>
              <span v-else>Load More</span>
            </button>
            <p v-else class="text-xs text-zinc-400 italic">End of feed.</p>
          </div>
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div class="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <div 
          v-for="toast in toasts" 
          :key="toast.id" 
          class="pointer-events-auto bg-white rounded-xl p-5 min-w-[320px] max-w-[400px] shadow-lg border border-zinc-200 flex flex-col gap-1.5 animate-slide-up"
        >
          <div class="flex justify-between items-center">
            <span class="font-heading font-bold text-zinc-950 text-xs tracking-tight">{{ toast.title }}</span>
            <span class="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
              <span class="h-1.5 w-1.5 bg-zinc-900 rounded-full animate-ping"></span> Live
            </span>
          </div>
          <div class="text-zinc-500 text-xs leading-relaxed">{{ toast.body }}</div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
