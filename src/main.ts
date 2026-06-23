import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css'
import { DefaultApolloClient } from '@vue/apollo-composable'
import { apolloClient, setRouterInstance } from './apollo'

setRouterInstance(router)

const app = createApp(App)
app.provide(DefaultApolloClient, apolloClient)

app.use(router)

app.mount('#app')

