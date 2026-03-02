import {defineStore} from "pinia";
import * as api from "./api";

export const useAuthStore = defineStore("auth", {
    state: () => ({
        accessToken: null as string | null,
    }),

    actions: {
        async login(tg_data: string) {
            try {
                const { data } = await api.telegramAuth({ init_data: tg_data })
                this.accessToken = data.access_token
                localStorage.setItem('refresh_token', data.refresh_token)
            } catch (e: any) {
                console.error('login error:', e)
                // Добавь это чтобы видеть в дебаг оверлее
                throw new Error(e?.response?.data?.detail ?? e?.message ?? JSON.stringify(e))
            }
        },

        async testLogin() {
            try {
                const { data } = await api.testLogin()
                this.accessToken = data.access_token
                localStorage.setItem('refresh_token', data.refresh_token)
            } catch (e: any) {
                console.error('login error:', e)
                // Добавь это чтобы видеть в дебаг оверлее
                throw new Error(e?.response?.data?.detail ?? e?.message ?? JSON.stringify(e))
            }
        },

        async refresh() {
            const {data} = await api.refreshToken();
            this.accessToken = data.access_token
        },

        logout() {
            this.accessToken = null;
            localStorage.removeItem('refresh_token');
        }
    }
})