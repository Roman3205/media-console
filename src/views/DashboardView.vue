<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { 
  USER_DASHBOARD_QUERY, 
  CREATE_DRAFT_MUTATION, 
  PUBLISH_POST_MUTATION, 
  DELETE_POST_MUTATION,
  CREATE_ARTICLE_MUTATION,
  TAGS_QUERY
} from '@/graphql/operations'
import type { DashboardPost, DashboardData } from '@/types'

const activeTab = ref('posts')

const postTitle = ref('')
const postContent = ref('')
const postSuccessMsg = ref('')
const postErrorMsg = ref('')

const articleTitle = ref('')
const articleContent = ref('')
const selectedTags = ref<number[]>([])
const articleSuccessMsg = ref('')
const articleErrorMsg = ref('')

let postSuccessTimeout: ReturnType<typeof setTimeout> | undefined
let postErrorTimeout: ReturnType<typeof setTimeout> | undefined
let articleSuccessTimeout: ReturnType<typeof setTimeout> | undefined
let articleErrorTimeout: ReturnType<typeof setTimeout> | undefined

watch(activeTab, () => {
  if (postSuccessTimeout) clearTimeout(postSuccessTimeout)
  if (postErrorTimeout) clearTimeout(postErrorTimeout)
  if (articleSuccessTimeout) clearTimeout(articleSuccessTimeout)
  if (articleErrorTimeout) clearTimeout(articleErrorTimeout)

  postSuccessMsg.value = ''
  postErrorMsg.value = ''
  articleSuccessMsg.value = ''
  articleErrorMsg.value = ''
})

const { result: dashboardResult, loading: dashboardLoading, error: dashboardError, refetch: refetchDashboard } = useQuery(
  USER_DASHBOARD_QUERY,
  {},
  { fetchPolicy: 'cache-and-network' }
)

const { result: tagsResult, loading: tagsLoading } = useQuery(TAGS_QUERY)

const dashboard = computed(() => dashboardResult.value?.userDashboard)
const tags = computed(() => tagsResult.value?.tags || [])

const expandedPosts = ref<Record<string, boolean>>({})
const expandedArticles = ref<Record<string, boolean>>({})

const togglePostExpand = (id: string) => {
  expandedPosts.value[id] = !expandedPosts.value[id]
}

const toggleArticleExpand = (id: string) => {
  expandedArticles.value[id] = !expandedArticles.value[id]
}

const { mutate: createDraftMutate, loading: draftLoading } = useMutation(CREATE_DRAFT_MUTATION, {
  update: (cache, { data }) => {
    const newDraft = data?.createDraft
    if (!newDraft) return

    try {
      const cachedData = cache.readQuery<DashboardData>({ query: USER_DASHBOARD_QUERY })
      if (cachedData?.userDashboard) {
        const updatedDashboard = {
          ...cachedData.userDashboard,
          totalPosts: cachedData.userDashboard.totalPosts + 1,
          recentPosts: [newDraft, ...cachedData.userDashboard.recentPosts]
        }
        cache.writeQuery({
          query: USER_DASHBOARD_QUERY,
          data: { userDashboard: updatedDashboard }
        })
      }
    } catch (err) {
      console.warn('Cache update for createDraft failed:', err)
    }
  }
})

const { mutate: publishPostMutate, loading: publishLoading } = useMutation(PUBLISH_POST_MUTATION, {
  update: (cache, { data }) => {
    const publishedPost = data?.publishPost
    if (!publishedPost) return

    try {
      const cachedData = cache.readQuery<DashboardData>({ query: USER_DASHBOARD_QUERY })
      if (cachedData?.userDashboard) {
        const updatedPosts = cachedData.userDashboard.recentPosts.map((post: DashboardPost) => 
          post.id === publishedPost.id ? { ...post, published: true } : post
        )
        const updatedDashboard = {
          ...cachedData.userDashboard,
          publishedPosts: cachedData.userDashboard.publishedPosts + 1,
          recentPosts: updatedPosts
        }
        cache.writeQuery({
          query: USER_DASHBOARD_QUERY,
          data: { userDashboard: updatedDashboard }
        })
      }
    } catch (err) {
      console.warn('Cache update for publishPost failed:', err)
    }
  }
})

const { mutate: deletePostMutate, loading: deleteLoading } = useMutation(DELETE_POST_MUTATION, {
  update: (cache, { data }) => {
    const deletedPost = data?.deletePost
    if (!deletedPost) return

    try {
      const cachedData = cache.readQuery<DashboardData>({ query: USER_DASHBOARD_QUERY })
      if (cachedData?.userDashboard) {
        const targetPost = cachedData.userDashboard.recentPosts.find((p: DashboardPost) => p.id === deletedPost.id)
        const wasPublished = targetPost?.published || false

        const updatedPosts = cachedData.userDashboard.recentPosts.filter((post: DashboardPost) => post.id !== deletedPost.id)
        const updatedDashboard = {
          ...cachedData.userDashboard,
          totalPosts: Math.max(0, cachedData.userDashboard.totalPosts - 1),
          publishedPosts: wasPublished ? Math.max(0, cachedData.userDashboard.publishedPosts - 1) : cachedData.userDashboard.publishedPosts,
          recentPosts: updatedPosts
        }
        cache.writeQuery({
          query: USER_DASHBOARD_QUERY,
          data: { userDashboard: updatedDashboard }
        })
      }
    } catch (err) {
      console.warn('Cache update for deletePost failed:', err)
    }
  }
})

const { mutate: createArticleMutate, loading: articleLoading } = useMutation(CREATE_ARTICLE_MUTATION, {
  update: (cache, { data }) => {
    const newArticle = data?.createArticle
    if (!newArticle) return

    try {
      const cachedData = cache.readQuery<DashboardData>({ query: USER_DASHBOARD_QUERY })
      if (cachedData?.userDashboard) {
        const updatedDashboard = {
          ...cachedData.userDashboard,
          totalArticles: cachedData.userDashboard.totalArticles + 1,
          recentArticles: [newArticle, ...cachedData.userDashboard.recentArticles]
        }
        cache.writeQuery({
          query: USER_DASHBOARD_QUERY,
          data: { userDashboard: updatedDashboard }
        })
      }
    } catch (err) {
      console.warn('Cache update for createArticle failed:', err)
    }
  }
})

const handleCreateDraft = async () => {
  postErrorMsg.value = ''
  postSuccessMsg.value = ''
  try {
    await createDraftMutate({
      title: postTitle.value,
      content: postContent.value
    })
    postSuccessMsg.value = 'Draft post created successfully!'
    postTitle.value = ''
    postContent.value = ''
    postSuccessTimeout = setTimeout(() => {
      postSuccessMsg.value = ''
    }, 4000)
  } catch (err: unknown) {
    postErrorMsg.value = err instanceof Error ? err.message : 'Failed to create draft.'
    postErrorTimeout = setTimeout(() => {
      postErrorMsg.value = ''
    }, 4000)
  }
}

const handleCreateArticle = async () => {
  articleErrorMsg.value = ''
  articleSuccessMsg.value = ''
  try {
    await createArticleMutate({
      title: articleTitle.value,
      content: articleContent.value,
      tagIds: selectedTags.value.map(Number)
    })
    articleSuccessMsg.value = 'Article created successfully!'
    articleTitle.value = ''
    articleContent.value = ''
    selectedTags.value = []
    articleSuccessTimeout = setTimeout(() => {
      articleSuccessMsg.value = ''
    }, 4000)
  } catch (err: unknown) {
    articleErrorMsg.value = err instanceof Error ? err.message : 'Failed to create article.'
    articleErrorTimeout = setTimeout(() => {
      articleErrorMsg.value = ''
    }, 4000)
  }
}

const publishPost = async (id: string) => {
  if (confirm('Are you sure you want to publish this post?')) {
    try {
      await publishPostMutate({ id })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Publishing failed.')
    }
  }
}

const deletePost = async (id: string) => {
  if (confirm('Are you sure you want to delete this post?')) {
    try {
      await deletePostMutate({ id })
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Deletion failed.')
    }
  }
}

const toggleTag = (tagId: number) => {
  const numId = Number(tagId)
  if (selectedTags.value.includes(numId)) {
    selectedTags.value = selectedTags.value.filter(id => id !== numId)
  } else {
    selectedTags.value.push(numId)
  }
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    <div v-if="dashboardLoading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-zinc-200 border-l-zinc-900 rounded-full animate-spin"></div>
    </div>
    
    <div v-else-if="dashboardError" class="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-100 text-center space-y-3">
      <h3 class="font-heading font-bold text-sm">Error Loading Dashboard</h3>
      <p class="text-xs">{{ dashboardError.message }}</p>
      <button @click="() => refetchDashboard()" class="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-4 py-2 rounded-lg border border-zinc-200 cursor-pointer">Retry</button>
    </div>

    <div v-else-if="dashboard" class="space-y-6">
      <div class="flex flex-col sm:flex-row justify-between sm:items-center bg-white rounded-xl p-5 border border-zinc-200/60 gap-4 shadow-xs">
        <div class="flex items-center gap-4">
          <div class="h-10 w-10 rounded-md bg-zinc-900 text-white flex items-center justify-center font-heading font-extrabold text-sm uppercase">
            {{ dashboard.user.name.charAt(0).toUpperCase() }}
          </div>
          <div>
            <h2 class="font-heading font-bold text-base text-zinc-955 tracking-tight">Profile: {{ dashboard.user.name }}</h2>
            <p class="text-xs text-zinc-400 font-medium">{{ dashboard.user.email }}</p>
          </div>
        </div>
        <div>
          <button @click="() => refetchDashboard()" class="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-850 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors disabled:opacity-65 disabled:cursor-not-allowed" :disabled="dashboardLoading">Sync Data</button>
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div class="bg-white rounded-xl p-5 border border-zinc-200/60 flex flex-col justify-between shadow-xs">
          <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Total Posts</span>
          <div class="flex items-baseline gap-2 mt-3">
            <span class="font-heading font-extrabold text-2xl text-zinc-955">{{ dashboard.totalPosts }}</span>
            <span class="text-xs text-zinc-500 font-medium">{{ dashboard.publishedPosts }} published</span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-zinc-200/60 flex flex-col justify-between shadow-xs">
          <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Authored Articles</span>
          <div class="flex items-baseline gap-2 mt-3">
            <span class="font-heading font-extrabold text-2xl text-zinc-955">{{ dashboard.totalArticles }}</span>
            <span class="text-xs text-slate-500 font-medium">authored by you</span>
          </div>
        </div>

        <div class="bg-white rounded-xl p-5 border border-zinc-200/60 flex flex-col justify-between shadow-xs">
          <span class="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Total Comments</span>
          <div class="flex items-baseline gap-2 mt-3">
            <span class="font-heading font-extrabold text-2xl text-zinc-955">{{ dashboard.totalComments }}</span>
            <span class="text-xs text-slate-500 font-medium">posted by you</span>
          </div>
        </div>
      </div>

      <div class="bg-zinc-100 rounded-lg p-0.5 flex flex-wrap gap-0.5 max-w-lg">
        <button 
          @click="activeTab = 'posts'" 
          class="flex-1 py-1.5 px-3 text-center text-xs font-semibold rounded-md transition-all cursor-pointer"
          :class="activeTab === 'posts' ? 'bg-white text-zinc-955 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'"
        >
          Posts ({{ dashboard.recentPosts.length }})
        </button>
        <button 
          @click="activeTab = 'articles'" 
          class="flex-1 py-1.5 px-3 text-center text-xs font-semibold rounded-md transition-all cursor-pointer"
          :class="activeTab === 'articles' ? 'bg-white text-zinc-955 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'"
        >
          Articles ({{ dashboard.recentArticles.length }})
        </button>
        <button 
          @click="activeTab = 'create-post'" 
          class="flex-1 py-1.5 px-3 text-center text-xs font-semibold rounded-md transition-all cursor-pointer"
          :class="activeTab === 'create-post' ? 'bg-white text-zinc-955 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'"
        >
          Create Post
        </button>
        <button 
          @click="activeTab = 'create-article'" 
          class="flex-1 py-1.5 px-3 text-center text-xs font-semibold rounded-md transition-all cursor-pointer"
          :class="activeTab === 'create-article' ? 'bg-white text-zinc-955 shadow-xs' : 'text-zinc-500 hover:text-zinc-800'"
        >
          Create Article
        </button>
      </div>

      <div class="animate-slide-up">
        <div v-if="activeTab === 'posts'" class="bg-white rounded-xl p-6 border border-zinc-200/60 space-y-6 shadow-xs">
          <div class="pb-3 border-b border-zinc-100">
            <h3 class="font-heading font-bold text-base text-zinc-900">Recent Post Submissions</h3>
            <p class="text-xs text-zinc-400">View and publish drafts or delete database records</p>
          </div>

          <div v-if="dashboard.recentPosts.length === 0" class="text-center py-10 text-xs text-zinc-400 italic">
            No drafts or posts available.
          </div>

          <div v-else class="divide-y divide-zinc-100">
            <div 
              v-for="post in dashboard.recentPosts" 
              :key="post.id" 
              class="py-4 first:pt-0 last:pb-0 space-y-3"
            >
              <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div class="space-y-0.5">
                  <h4 class="font-heading font-bold text-zinc-905 text-sm leading-snug">{{ post.title }}</h4>
                  <div class="flex items-center gap-3 text-xs text-zinc-450">
                    <span>{{ new Date(Number(post.createdAt)).toLocaleDateString() }}</span>
                    <span 
                      class="text-[9px] font-bold px-1.5 py-0.5 rounded border"
                      :class="post.published ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-zinc-100 text-zinc-650 border-zinc-200'"
                    >
                      {{ post.published ? 'Published' : 'Draft' }}
                    </span>
                  </div>
                </div>
                
                <div class="flex items-center gap-1.5">
                  <button @click="togglePostExpand(post.id)" class="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer">
                    {{ expandedPosts[post.id] ? 'Hide' : 'Expand' }}
                  </button>
                  <router-link :to="{ name: 'post-detail', params: { id: post.id } }" class="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-750 text-xs font-semibold px-2.5 py-1.5 rounded-lg">Details</router-link>
                  <button v-if="!post.published" @click="publishPost(post.id)" class="bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors disabled:opacity-65 disabled:cursor-not-allowed" :disabled="publishLoading || deleteLoading">Publish</button>
                  <button @click="deletePost(post.id)" class="text-rose-600 hover:text-rose-800 hover:bg-rose-50 text-xs font-semibold px-2.5 py-1.5 rounded-lg cursor-pointer disabled:opacity-65 disabled:cursor-not-allowed" :disabled="publishLoading || deleteLoading">Delete</button>
                </div>
              </div>

              <div v-if="expandedPosts[post.id]" class="mt-2 text-xs text-zinc-650 bg-zinc-50 border border-zinc-200/50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap animate-slide-up">
                {{ post.content || 'No content preview available.' }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'articles'" class="bg-white rounded-xl p-6 border border-zinc-200/60 space-y-6 shadow-xs">
          <div class="pb-3 border-b border-zinc-100">
            <h3 class="font-heading font-bold text-base text-zinc-900">Authored Articles</h3>
            <p class="text-xs text-zinc-400">Manage internal assets and view technical drafts</p>
          </div>

          <div v-if="dashboard.recentArticles.length === 0" class="text-center py-10 text-xs text-zinc-400 italic">
            No articles authored.
          </div>

          <div v-else class="divide-y divide-slate-100">
            <div 
              v-for="art in dashboard.recentArticles" 
              :key="art.id" 
              class="py-4 first:pt-0 last:pb-0 space-y-3"
            >
              <div class="flex justify-between items-center gap-4">
                <div>
                  <h4 class="font-heading font-bold text-slate-855 text-base leading-snug">{{ art.title }}</h4>
                  <div class="flex items-center gap-3 text-xs text-slate-400">
                    <span>{{ new Date(Number(art.createdAt)).toLocaleDateString() }}</span>
                    <div class="flex flex-wrap gap-1">
                      <span 
                        v-for="tag in art.tags" 
                        :key="tag.id" 
                        class="bg-zinc-100 text-zinc-800 text-[8px] font-bold px-1.5 py-0.5 rounded border border-zinc-200/50 uppercase tracking-wide"
                      >
                        #{{ tag.name }}
                      </span>
                    </div>
                  </div>
                </div>
                <button @click="toggleArticleExpand(art.id)" class="bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 text-xs font-semibold px-2.5 py-1.5 rounded-lg ring-1 ring-black/5 transition-colors cursor-pointer">
                  {{ expandedArticles[art.id] ? 'Hide Content' : 'View Content' }}
                </button>
              </div>

              <div v-if="expandedArticles[art.id]" class="mt-2 text-xs text-zinc-650 bg-zinc-50 border border-zinc-200/50 p-4 rounded-lg leading-relaxed whitespace-pre-wrap animate-slide-up">
                {{ art.content || 'No article content available.' }}
              </div>
            </div>
          </div>
        </div>

        <div v-if="activeTab === 'create-post'" class="bg-white rounded-xl p-6 border border-zinc-200/60 space-y-6 shadow-xs">
          <div class="pb-3 border-b border-zinc-100">
            <h3 class="font-heading font-bold text-base text-zinc-900">New Post Draft</h3>
            <p class="text-xs text-zinc-400">Save post drafts directly to the database</p>
          </div>

          <div v-if="postSuccessMsg" class="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs py-2.5 px-3 rounded-lg text-center font-medium">{{ postSuccessMsg }}</div>
          <div v-if="postErrorMsg" class="bg-rose-50 text-rose-755 border border-rose-100 text-xs py-2.5 px-3 rounded-lg text-center font-medium">{{ postErrorMsg }}</div>

          <form @submit.prevent="handleCreateDraft" class="space-y-4">
            <div>
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5" for="post-title">Post Title</label>
              <input 
                v-model="postTitle"
                id="post-title" 
                class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors" 
                type="text" 
                placeholder="Topic..."
                required
              />
            </div>
            
            <div>
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5" for="post-content">Post Content</label>
              <textarea 
                v-model="postContent"
                id="post-content" 
                class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors resize-none" 
                rows="6" 
                placeholder="Write text body..."
              ></textarea>
            </div>

            <button type="submit" class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs py-2.5 px-5 rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-65 disabled:cursor-not-allowed" :disabled="draftLoading">
              <span v-if="draftLoading">Saving...</span>
              <span v-else>Save Draft</span>
            </button>
          </form>
        </div>

        <div v-if="activeTab === 'create-article'" class="bg-white rounded-xl p-6 border border-zinc-200/60 space-y-6 shadow-xs">
          <div class="pb-3 border-b border-zinc-100">
            <h3 class="font-heading font-bold text-base text-zinc-900">Write Technical Article</h3>
            <p class="text-xs text-zinc-400">Commit new document guides with custom tags</p>
          </div>

          <div v-if="articleSuccessMsg" class="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs py-2.5 px-3 rounded-lg text-center font-medium">{{ articleSuccessMsg }}</div>
          <div v-if="articleErrorMsg" class="bg-rose-50 text-rose-755 border border-rose-100 text-xs py-2.5 px-3 rounded-lg text-center font-medium">{{ articleErrorMsg }}</div>

          <form @submit.prevent="handleCreateArticle" class="space-y-4">
            <div>
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5" for="art-title">Article Title</label>
              <input 
                v-model="articleTitle"
                id="art-title" 
                class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors" 
                type="text" 
                placeholder="Title..."
                required
              />
            </div>
            
            <div>
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5" for="art-content">Content</label>
              <textarea 
                v-model="articleContent"
                id="art-content" 
                class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors resize-none" 
                rows="6" 
                placeholder="Markdown description..."
              ></textarea>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1.5">Select Tags</label>
              <div v-if="tagsLoading" class="text-xs text-zinc-400 italic">Loading...</div>
              <div v-else class="flex flex-wrap gap-1.5">
                <button
                  v-for="tag in tags"
                  :key="tag.id"
                  type="button"
                  class="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer"
                  :class="selectedTags.includes(Number(tag.id)) ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50'"
                  @click="toggleTag(tag.id)"
                >
                  #{{ tag.name }}
                </button>
              </div>
            </div>

            <button type="submit" class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs py-2.5 px-5 rounded-lg shadow-sm cursor-pointer transition-colors disabled:opacity-65 disabled:cursor-not-allowed" :disabled="articleLoading">
              <span v-if="articleLoading">Publishing...</span>
              <span v-else>Publish Article</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
