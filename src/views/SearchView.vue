<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLazyQuery } from '@vue/apollo-composable'
import { SEARCH_QUERY } from '../graphql/operations'

const searchQuery = ref('')
const searchAttempted = ref(false)

const { load, result, loading, error } = useLazyQuery(SEARCH_QUERY)

const searchResults = computed(() => result.value?.search || [])

const handleSearch = () => {
  const query = searchQuery.value.trim()
  if (!query) return
  
  searchAttempted.value = true
  load(SEARCH_QUERY, { text: query })
}
</script>

<template>
  <div class="space-y-6 max-w-3xl mx-auto">
    <div class="bg-white rounded-xl p-6 border border-zinc-200/60 shadow-xs space-y-4">
      <h2 class="font-heading font-extrabold text-xl text-zinc-955 tracking-tight">Search Content</h2>
      <p class="text-xs text-zinc-400 font-medium">Search for keywords across all posts, articles, and comments</p>
      
      <form @submit.prevent="handleSearch" class="flex gap-2 pt-2">
        <input 
          v-model="searchQuery"
          class="flex-1 bg-white border border-zinc-200 rounded-lg px-4 py-2.5 text-xs text-zinc-900 placeholder-zinc-400 focus:border-zinc-800 focus:ring-1 focus:ring-zinc-800 transition-colors" 
          type="text" 
          placeholder="Keywords (e.g. Vue, typescript, db)..."
          required
        />
        <button type="submit" class="bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-sm transition-colors cursor-pointer" :disabled="loading">
          <span v-if="loading">Searching...</span>
          <span v-else>Search</span>
        </button>
      </form>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <div class="w-8 h-8 border-2 border-zinc-200 border-l-zinc-900 rounded-full animate-spin"></div>
    </div>

    <div v-else-if="error" class="bg-rose-50 text-rose-700 p-5 rounded-xl border border-rose-100 text-center">
      <h3 class="font-heading font-bold text-sm">Search Failed</h3>
      <p class="text-xs mt-1">{{ error.message }}</p>
    </div>

    <div v-else-if="searchAttempted" class="space-y-4 animate-slide-up">
      <div class="flex items-center justify-between">
        <h3 class="font-heading font-bold text-sm text-zinc-550">Results found ({{ searchResults.length }})</h3>
      </div>

      <div v-if="searchResults.length === 0" class="bg-white rounded-xl p-12 text-center border border-zinc-200/60 space-y-3">
        <div class="text-2xl">🔍</div>
        <h4 class="font-heading font-bold text-zinc-855 text-sm">No results found</h4>
        <p class="text-xs text-zinc-500">Modify your search keywords and try again.</p>
      </div>

      <div v-else class="space-y-4">
        <div 
          v-for="item in searchResults" 
          :key="item.id" 
          class="bg-white rounded-xl p-5 border border-zinc-200/60 shadow-xs border-l-4"
          :class="{
            'border-l-zinc-800': item.__typename === 'Post',
            'border-l-emerald-600': item.__typename === 'Article',
            'border-l-amber-600': item.__typename === 'Comment'
          }"
        >
          <template v-if="item.__typename === 'Post'">
            <div class="flex justify-between items-center text-[10px] mb-2 font-semibold">
              <span class="bg-zinc-100 text-zinc-700 px-2 py-0.5 rounded border border-zinc-200 uppercase tracking-wider">Post</span>
              <span class="text-zinc-400">{{ new Date(Number(item.createdAt)).toLocaleDateString() }}</span>
            </div>
            <h3 class="font-heading font-bold text-base text-zinc-950 leading-snug">
              <router-link :to="{ name: 'post-detail', params: { id: item.id } }" class="hover:text-zinc-650 transition-colors">
                {{ item.title }}
              </router-link>
            </h3>
            <p class="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{{ item.content || 'No content provided.' }}</p>
            <div class="mt-4 pt-3 border-t border-zinc-50 text-[10px] text-zinc-400 font-medium">
              <span>By {{ item.author?.name || 'Anonymous' }}</span>
            </div>
          </template>

          <template v-else-if="item.__typename === 'Article'">
            <div class="flex justify-between items-center text-[10px] mb-2 font-semibold">
              <span class="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-100 uppercase tracking-wider">Article</span>
              <span class="text-zinc-400">{{ new Date(Number(item.createdAt)).toLocaleDateString() }}</span>
            </div>
            <h3 class="font-heading font-bold text-base text-zinc-950 leading-snug">{{ item.title }}</h3>
            <p class="text-xs text-zinc-500 mt-2 line-clamp-2 leading-relaxed">{{ item.content || 'No content.' }}</p>
            <div class="mt-4 pt-3 border-t border-zinc-50 text-[10px] text-zinc-400 font-medium">
              <span>By {{ item.author?.name || 'Anonymous' }}</span>
            </div>
          </template>

          <template v-else-if="item.__typename === 'Comment'">
            <div class="flex justify-between items-center text-[10px] mb-2 font-semibold">
              <span class="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100 uppercase tracking-wider">Comment</span>
              <span class="text-zinc-400">{{ new Date(Number(item.createdAt)).toLocaleDateString() }}</span>
            </div>
            <p class="text-zinc-700 text-xs italic bg-zinc-50 border border-zinc-100 p-3 rounded-lg font-medium">"{{ item.body }}"</p>
            <div class="mt-3 text-[10px] text-zinc-400 flex items-center justify-between font-semibold">
              <span>By {{ item.author?.name || 'Anonymous' }}</span>
              <span>
                on Post: 
                <router-link :to="{ name: 'post-detail', params: { id: item.post?.id } }" class="text-zinc-900 hover:text-zinc-500 transition-colors">
                  {{ item.post?.title }}
                </router-link>
              </span>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>
