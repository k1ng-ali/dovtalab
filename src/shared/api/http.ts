import {useAuthStore} from "@/features/auth/store.ts";
import axios from "axios";

export const http = axios.create({
    baseURL: "https://api.dovtalab.app/",
    withCredentials: true,
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


