import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient, setRouterInstance } from './apollo'
import { createPinia } from 'pinia'

setRouterInstance(router)

const app = createApp(App)
app.use(createPinia())
app.provide(DefaultApolloClient, apolloClient)

app.use(router)

app.mount('#app')

