// Shared TypeScript Types & Interfaces

// Post related interfaces
export interface PostNode {
  id: string
  title: string
  content: string | null
  published: boolean
  createdAt: string
  author: {
    id: string
    name: string
  } | null
  categories: Array<{ id: string; name: string }>
}

export interface PostEdge {
  cursor: string
  node: PostNode
  __typename?: string
}

export interface PostsQueryData {
  posts: {
    __typename?: string
    edges: PostEdge[]
    pageInfo: {
      hasNextPage: boolean
      hasPreviousPage: boolean
      startCursor: string | null
      endCursor: string | null
    }
    totalCount: number
  }
}

export interface PostCreatedSubscriptionData {
  postCreated: PostNode
}

// PostDetail related interfaces
export interface PostComment {
  id: string
  body: string
  createdAt: string
  author: {
    id: string
    name: string
  }
}

export interface PostDetailData {
  post: {
    id: string
    title: string
    content: string | null
    published: boolean
    createdAt: string
    author: {
      id: string
      name: string
      email: string
    } | null
    categories: Array<{ id: string; name: string }>
    comments: PostComment[]
  } | null
}

// Dashboard related interfaces
export interface DashboardPost {
  id: string
  title: string
  content: string | null
  published: boolean
  createdAt: string
  __typename?: string
}

export interface DashboardArticle {
  id: string
  title: string
  content: string | null
  createdAt: string
  tags?: Array<{ id: string; name: string }>
  __typename?: string
}

export interface DashboardComment {
  id: string
  body: string
  createdAt: string
  post: {
    id: string
    title: string
  }
}

export interface DashboardData {
  userDashboard: {
    user: {
      id: string
      name: string
      email: string
    }
    totalPosts: number
    totalComments: number
    totalArticles: number
    publishedPosts: number
    recentPosts: DashboardPost[]
    recentArticles: DashboardArticle[]
    recentComments: DashboardComment[]
    mostCommentedPost: {
      id: string
      title: string
      comments: Array<{ id: string }>
    } | null
  }
}
