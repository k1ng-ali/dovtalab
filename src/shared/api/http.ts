import { useAuthStore } from "@/features/auth/store.ts"
import axios from "axios"
import { message } from 'ant-design-vue'

const BASE_URL = `${import.meta.env.VITE_API_URL ?? "https://api.dovtalab.app"}/api/v1`

export const http = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000,
})

// Отдельный чистый инстанс для служебных запросов авторизации
const authHttp = axios.create({
    baseURL: BASE_URL,
    withCredentials: true,
    timeout: 10000,
})

http.interceptors.request.use((config) => {
    const auth = useAuthStore()
    if (auth.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`
    }
    return config
})

// Переменные для блокировки повторных параллельных рефрешей
let isRefreshing = false
let failedQueue: Array<{
    resolve: (token: string) => void
    reject: (error: any) => void
}> = []

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else if (token) {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

http.interceptors.response.use(
    response => response,
    async error => {
        const auth = useAuthStore()
        const originalRequest = error.config

        // 1. Ошибки сети
        if (!error.response || error.code === 'ERR_NETWORK') {
            message.destroy()
            if (error.code === 'ECONNABORTED') {
                message.error('Время ожидания запроса истекло. Проверьте интернет.')
            } else {
                message.error('Ошибка сети. Проверьте подключение к интернету.')
            }
            return Promise.reject(error)
        }

        // 2. Игнорируем запросы к авторизации, чтобы избежать зацикливания
        if (
            originalRequest.url?.includes("/auth/refresh") ||
            originalRequest.url?.includes("/auth/telegram/webapp")
        ) {
            return Promise.reject(error)
        }

        // 3. Обработка 401 Unauthorized
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                // Если рефреш уже идет — ставим параллельный запрос в очередь
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return http(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                // Проверяем, в среде Telegram мы или нет
                const twa = (window as any)?.Telegram?.WebApp
                const initData = twa?.initData

                let newToken = ''

                if (initData && initData.length > 0) {
                    // В Telegram WebApp надежнее обновиться через initData
                    const { data } = await authHttp.post("/auth/telegram/webapp", { init_data: initData })
                    newToken = data.access_token
                } else {
                    // В обычном браузере — через куку
                    const { data } = await authHttp.post<{ access_token: string }>("/auth/refresh")
                    newToken = data.access_token
                }

                auth.accessToken = newToken
                localStorage.setItem('access_token', newToken)
                auth.status = 'authenticated'

                processQueue(null, newToken)

                originalRequest.headers.Authorization = `Bearer ${newToken}`
                return http(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                auth.logout()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    }
)