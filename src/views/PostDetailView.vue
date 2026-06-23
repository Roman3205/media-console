<script setup lang="ts">
import { ref, computed, nextTick } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery, useMutation } from '@vue/apollo-composable'
import { POST_QUERY, CREATE_COMMENT_MUTATION } from '../graphql/operations'

import type { PostDetailData } from '../types'
import { isLoggedIn } from '../utils/authStore'

const route = useRoute()
const postId = ref(route.params.id as string)

const commentBody = ref('')
const errorMsg = ref('')
const successMsg = ref('')

const { result, loading, error, refetch } = useQuery(POST_QUERY, () => ({
  id: postId.value
}), {
  fetchPolicy: 'network-only'
})

const post = computed(() => result.value?.post)

// Manually update the Apollo cache to append the new comment immediately to the UI feed
const { mutate: createCommentMutate, loading: commentLoading } = useMutation(CREATE_COMMENT_MUTATION, {
  update: (cache, { data }) => {
    const newComment = data?.createComment
    if (!newComment) return

    try {
      const cachedData = cache.readQuery<PostDetailData>({
        query: POST_QUERY,
        variables: { id: postId.value }
      })

      if (cachedData?.post) {
        const updatedPost = {
          ...cachedData.post,
          comments: [...cachedData.post.comments, newComment]
        }
        
        cache.writeQuery({
          query: POST_QUERY,
          variables: { id: postId.value },
          data: { post: updatedPost }
        })
      }
    } catch (err) {
      console.warn('Cache update for comment failed:', err)
    }
  }
})

const handleAddComment = async () => {
  errorMsg.value = ''
  successMsg.value = ''
  
  if (!commentBody.value.trim()) {
    errorMsg.value = 'Comment body cannot be empty.'
    return
  }

  try {
    await createCommentMutate({
      postId: Number(postId.value),
      body: commentBody.value
    })
    
    successMsg.value = 'Comment posted!'
    commentBody.value = ''
    
    await nextTick()
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth'
    })
    
    setTimeout(() => {
      successMsg.value = ''
    }, 3000)
  } catch (err: unknown) {
    errorMsg.value = err instanceof Error ? err.message : 'Failed to add comment.'
  }
}
</script>

<template>
  <div class="max-w-3xl mx-auto space-y-6">
    <div>
      <router-link to="/" class="text-xs font-semibold text-zinc-500 hover:text-zinc-955 transition-colors inline-flex items-center gap-1 uppercase tracking-wider">
        &larr; Back to Feed
      </router-link>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-zinc-200 border-l-zinc-900 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="bg-rose-50 text-rose-700 p-6 rounded-xl border border-rose-100 text-center space-y-3">
      <h3 class="font-heading font-bold text-sm">Error Loading Post</h3>
      <p class="text-xs">{{ error.message }}</p>
      <button @click="() => refetch()" class="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-4 py-2 rounded-lg border border-zinc-200 cursor-pointer">Retry</button>
    </div>

    <div v-else-if="!post" class="bg-white rounded-xl p-12 text-center border border-zinc-200/60 shadow-xs">
      <h3 class="font-heading font-bold text-base text-zinc-850">Post Not Found</h3>
      <p class="text-xs text-zinc-500 mt-1">The article you are trying to view does not exist or has been removed.</p>
    </div>

    <div v-else class="space-y-6">
      <article class="bg-white rounded-xl p-6 sm:p-8 border border-zinc-200/60 shadow-xs space-y-6">
        <header class="space-y-3">
          <div class="flex flex-wrap gap-1.5">
            <span 
              v-for="cat in post.categories" 
              :key="cat.id" 
              class="bg-zinc-100 text-zinc-800 text-[9px] font-bold px-2 py-0.5 rounded-md border border-zinc-200/50 uppercase tracking-wide"
            >
              {{ cat.name }}
            </span>
          </div>
          
          <h1 class="font-heading font-extrabold text-2xl sm:text-3xl text-zinc-955 tracking-tight leading-tight line-clamp-3">
            {{ post.title }}
          </h1>

          <div class="flex items-center gap-3 pt-2">
            <div class="h-8 w-8 bg-zinc-100 border border-zinc-d200 rounded-md flex items-center justify-center font-heading font-extrabold text-xs text-zinc-800 uppercase">
              {{ post.author?.name ? post.author.name.charAt(0).toUpperCase() : 'A' }}
            </div>
            <div class="text-xs">
              <p class="font-bold text-zinc-800">By {{ post.author?.name || 'Anonymous' }}</p>
              <p class="text-zinc-400 mt-0.5">Published on {{ new Date(Number(post.createdAt)).toLocaleDateString() }}</p>
            </div>
          </div>
        </header>

        <div class="text-zinc-700 text-sm leading-relaxed whitespace-pre-wrap pt-6 border-t border-zinc-100 font-medium">
          <p v-if="post.content">{{ post.content }}</p>
          
          <p v-else class="italic text-zinc-400">No content is available for this post.</p>
        </div>
      </article>

      <section class="bg-white rounded-xl p-6 sm:p-8 border border-zinc-200/60 shadow-xs space-y-6">
        <h3 class="font-heading font-bold text-base text-zinc-955">
          Comments ({{ post.comments.length }})
        </h3>

        <div v-if="post.comments.length === 0" class="text-center py-6 text-xs text-zinc-400 italic">
          No comments yet. Be the first to start the discussion!
        </div>

        <div v-else class="space-y-4">
          <div 
            v-for="comment in post.comments" 
            :key="comment.id" 
            class="bg-zinc-50 border border-zinc-100 rounded-xl p-4 space-y-1.5"
          >
            <div class="flex justify-between items-center text-[10px] font-semibold">
              <span class="text-zinc-700">{{ comment.author.name }}</span>
              <span class="text-zinc-400 font-medium">{{ new Date(Number(comment.createdAt)).toLocaleDateString() }}</span>
            </div>
            <p class="text-zinc-650 text-xs leading-relaxed font-medium">{{ comment.body }}</p>
          </div>
        </div>

        <div class="bg-zinc-50 rounded-xl border border-zinc-100 p-5 space-y-4">
          <h4 class="font-heading font-bold text-xs text-zinc-800 uppercase tracking-wider">Join discussion</h4>
          
          <div v-if="isLoggedIn" class="space-y-4">
            <div v-if="successMsg" class="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs py-2 px-3 rounded-lg text-center font-medium">{{ successMsg }}</div>
            <div v-if="errorMsg" class="bg-rose-50 text-rose-700 border border-rose-100 text-xs py-2 px-3 rounded-lg text-center font-medium">{{ errorMsg }}</div>

            <form @submit.prevent="handleAddComment" class="space-y-4">
              <textarea 
                v-model="commentBody"
                class="w-full bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-855 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors resize-none" 
                rows="3" 
                placeholder="Write comment..."
                required
              ></textarea>
              <button 
                type="submit" 
                class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs py-2.5 px-4 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-60" 
                :disabled="commentLoading"
              >
                <span v-if="commentLoading">Posting...</span>
                <span v-else>Post Comment</span>
              </button>
            </form>
          </div>
          
          <div v-else class="text-center py-2 space-y-2">
            <p class="text-xs text-zinc-500">You must be signed in to post comments.</p>
            <router-link :to="{ name: 'auth' }" class="bg-white hover:bg-zinc-50 text-zinc-800 text-xs font-semibold px-4 py-2 rounded-lg border border-zinc-200 cursor-pointer inline-block">
              Sign In
            </router-link>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
