import {defineStore} from "pinia";
import * as api from "./api";
import type {AuthStatus, AuthTokensResponse} from "@/features/auth/types.ts";


// ----- Store----------------
export const useAuthStore = defineStore("auth", {
    // ------ State -------------
    state: () => ({
        status: 'idle' as AuthStatus | 'idle',
        accessToken: null as string | null,
        error: null as string | null,
    }),

    getters: {
      isAuthenticated: (state): boolean => state.status === 'authenticated',
      isLoading: (state):boolean =>state.status === 'loading',
    },

    actions: {
        async login(tg_data: string) {
            try {
                const { data } = await api.telegramAuth({ init_data: tg_data })
                this.accessToken = data.access_token
                this.status = 'authenticated'
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

        // --- Login Widget -----

        async loginWithTelegram(payload: { code: string; nonce: string; code_verifier: string }) {
            this.status = 'loading'
            try {
                const { data } = await api.telegramLogin(payload)
                this.applyTokens(data)
                console.log("Succes", data)
            } catch (e) {
                this.setError(e)
                throw e
            }
        },

        async refresh() {
            const {data} = await api.refreshToken();
            this.accessToken = data.access_token
            this.status = 'authenticated'
        },

        logout() {
            this.accessToken = null;
            this.status = 'idle'
            this.error = null as string | null
        },

        // --- Internal Helpers ----
        applyTokens(data: AuthTokensResponse) {
            this.accessToken = data.access_token
            this.status = 'authenticated'
            this.error = null;
        },

        setError(e: unknown) {
            const msg = e instanceof Error
                ? e.message
                : (e as any)?.response?.data?.detail ?? 'Неизвестная ошибка'
            this.error = msg
            this.status = 'error'
            console.error('[AuthStore]', msg)
        }
    },

})