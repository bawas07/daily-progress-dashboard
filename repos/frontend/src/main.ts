import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from '@/shared/stores'
import './index.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Initialize auth store once at app startup
const authStore = useAuthStore()
authStore.initialize()

app.mount('#app')
