import gql from 'graphql-tag'

// ==========================================
// 1. QUERIES
// ==========================================

// Get currently logged-in user profile
export const ME_QUERY = gql`
  query GetMe {
    me {
      id
      name
      email
      createdAt
    }
  }
`

// Get posts with cursor-based pagination
export const POSTS_QUERY = gql`
  query GetPosts($first: Int, $after: String) {
    posts(first: $first, after: $after) {
      edges {
        cursor
        node {
          id
          title
          content
          published
          createdAt
          author {
            id
            name
          }
          categories {
            id
            name
          }
        }
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`

// Get single post by ID
export const POST_QUERY = gql`
  query GetPost($id: ID!) {
    post(id: $id) {
      id
      title
      content
      published
      createdAt
      author {
        id
        name
        email
      }
      categories {
        id
        name
      }
      comments {
        id
        body
        createdAt
        author {
          id
          name
        }
      }
    }
  }
`

// Get all tags
export const TAGS_QUERY = gql`
  query GetTags {
    tags {
      id
      name
    }
  }
`

// Get all categories
export const CATEGORIES_QUERY = gql`
  query GetCategories {
    categories {
      id
      name
    }
  }
`

// Search (demonstrates Union type parsing on SearchResult)
export const SEARCH_QUERY = gql`
  query Search($text: String!) {
    search(text: $text) {
      ... on Post {
        __typename
        id
        title
        content
        createdAt
        author {
          name
        }
      }
      ... on Article {
        __typename
        id
        title
        content
        createdAt
        author {
          name
        }
      }
      ... on Comment {
        __typename
        id
        body
        createdAt
        author {
          name
        }
        post {
          id
          title
        }
      }
    }
  }
`

// Get user activity statistics for the dashboard
export const USER_DASHBOARD_QUERY = gql`
  query GetUserDashboard {
    userDashboard {
      user {
        id
        name
        email
      }
      totalPosts
      totalComments
      totalArticles
      publishedPosts
      recentPosts {
        id
        title
        content
        published
        createdAt
      }
      recentComments {
        id
        body
        createdAt
        post {
          id
          title
        }
      }
      recentArticles {
        id
        title
        content
        createdAt
        tags {
          id
          name
        }
      }
      mostCommentedPost {
        id
        title
        comments {
          id
        }
      }
    }
  }
`

// ==========================================
// 2. MUTATIONS
// ==========================================

export const SIGNUP_MUTATION = gql`
  mutation Signup($email: String!, $name: String!, $password: String!) {
    signup(data: { email: $email, name: $name, password: $password }) {
      user {
        id
        name
        email
      }
    }
  }
`

export const LOGIN_MUTATION = gql`
  mutation Login($email: String!, $password: String!) {
    login(data: { email: $email, password: $password }) {
      user {
        id
        name
        email
      }
    }
  }
`

export const CREATE_DRAFT_MUTATION = gql`
  mutation CreateDraft($title: String!, $content: String) {
    createDraft(data: { title: $title, content: $content }) {
      id
      title
      content
      published
      createdAt
      author {
        id
        name
      }
      categories {
        id
        name
      }
    }
  }
`

export const PUBLISH_POST_MUTATION = gql`
  mutation PublishPost($id: ID!) {
    publishPost(id: $id) {
      id
      published
    }
  }
`

export const DELETE_POST_MUTATION = gql`
  mutation DeletePost($id: ID!) {
    deletePost(id: $id) {
      id
    }
  }
`

export const CREATE_COMMENT_MUTATION = gql`
  mutation CreateComment($postId: Int!, $body: String!) {
    createComment(data: { postId: $postId, body: $body }) {
      id
      body
      createdAt
      author {
        id
        name
      }
    }
  }
`

export const CREATE_ARTICLE_MUTATION = gql`
  mutation CreateArticle($title: String!, $content: String, $tagIds: [Int!]) {
    createArticle(data: { title: $title, content: $content, tagIds: $tagIds }) {
      id
      title
      content
      createdAt
      author {
        id
        name
      }
      tags {
        id
        name
      }
    }
  }
`

export const ADD_CATEGORY_TO_POST_MUTATION = gql`
  mutation AddCategoryToPost($postId: ID!, $categoryId: ID!) {
    addCategoryToPost(postId: $postId, categoryId: $categoryId) {
      id
      categories {
        id
        name
      }
    }
  }
`

// ==========================================
// 3. SUBSCRIPTIONS
// ==========================================

export const POST_CREATED_SUBSCRIPTION = gql`
  subscription OnPostCreated {
    postCreated {
      id
      title
      content
      published
      createdAt
      author {
        id
        name
      }
      categories {
        id
        name
      }
    }
  }
`

export const LOGOUT_MUTATION = gql`
  mutation Logout {
    logout
  }
`
