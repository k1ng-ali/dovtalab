import {useAuthStore} from "@/features/auth/store.ts";
import axios from "axios";
import {message} from 'ant-design-vue'

export const http = axios.create({
    baseURL: `${import.meta.env.VITE_API_URL ?? "https://api.dovtalab.app"}/api/v1`,
    withCredentials: true,
    timeout: 10000,
})

http.interceptors.request.use((config) => {
    const auth = useAuthStore()

    if (auth.accessToken) {
        config.headers.Authorization = `Bearer ${auth.accessToken}`
    }
    return config;
})

http.interceptors.response.use(
    response => response,
    async error => {
        const auth = useAuthStore()
        const originalRequest = error.config

        // ── 1. ОБРАБОТКА ОТСУТСТВИЯ ИНТЕРНЕТА ИЛИ ПАДЕНИЯ СЕРВЕРА ──
        if (!error.response || error.code === 'ERR_NETWORK') {
            message.destroy() // Удаляем старые сообщения, чтобы не спамить экран

            if (error.code === 'ECONNABORTED') {
                message.error('Время ожидания запроса истекло. Проверьте интернет.')
            } else {
                message.error('Ошибка сети. Проверьте подключение к интернету или сервер временно недоступен.')
            }

            return Promise.reject(error)
        }

        // ❗ если это уже refresh — не перехватываем
        if (originalRequest.url?.includes("/auth/refresh")) {
            auth.logout()
            return Promise.reject(error)
        }

        // ❗ защита от повторного запуска
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true

            try {
                const { data } = await http.post("/auth/refresh")

                auth.accessToken = data.access_token

                // ДОБАВИТЬ ЭТУ СТРОКУ:
                localStorage.setItem('access_token', data.access_token)

                originalRequest.headers.Authorization =
                    `Bearer ${data.access_token}`

                return http(originalRequest)
            } catch (refreshError) {
                auth.logout()
                return Promise.reject(refreshError)
            }
        }

        return Promise.reject(error)
    }
)


