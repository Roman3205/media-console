import { ApolloClient, createHttpLink, InMemoryCache, split } from '@apollo/client/core'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { createClient } from 'graphql-ws'
import { getMainDefinition } from '@apollo/client/utilities'
import { onError } from '@apollo/client/link/error'
import { currentUser } from './utils/authStore'

import type { Router } from 'vue-router'

// Reference to the Vue router instance to perform programmatical redirects on auth errors
let routerInstance: Router | null = null

export function setRouterInstance(router: Router) {
  routerInstance = router
}

// Setting credentials to 'include' ensures that cross-origin cookies are sent in CORS mode.
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_HTTP_URL || 'http://localhost:4000/graphql',
  credentials: 'include',
})

// Handles global GraphQL and network errors.
const errorLink = onError(({ graphQLErrors }) => {
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (err.extensions?.code === 'UNAUTHENTICATED') {
        currentUser.value = null

        if (routerInstance && routerInstance.currentRoute.value.meta.requiresAuth) {
          routerInstance.push({ name: 'auth' })
        }
        break
      }
    }
  }
})

// Lazy connection initialization is enabled so the WebSocket is only opened when a component subscribes.
export const wsClient = createClient({
  url: import.meta.env.VITE_GRAPHQL_WS_URL || 'ws://localhost:4000/graphql',
  lazy: true,
})

interface RestartableClient {
  restart(): void
}

// Required when logging in/out because the browser's session cookies change.
// Restarting the WebSocket forces it to reconnect and perform a fresh handshake with new cookie credentials.
export function restartWebsocket() {
  if (wsClient) {
    const client = wsClient as unknown as RestartableClient
    if (typeof client.restart === 'function') {
      client.restart()
    }
  }
}

const wsLink = new GraphQLWsLink(wsClient)

// If the operation is a subscription, it goes through the WebSocket link (wsLink).
// Queries and mutations go through the error interceptor followed by the HTTP link.
const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  errorLink.concat(httpLink)
)

const cache = new InMemoryCache()

export const apolloClient = new ApolloClient({
  link,
  cache,
  connectToDevTools: import.meta.env.DEV,
})

