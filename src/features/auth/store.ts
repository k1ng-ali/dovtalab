import {defineStore} from "pinia";
import * as api from "./api";
import type {AuthStatus, AuthTokensResponse, SuperUser} from "@/features/auth/types.ts";


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
        // --- Telegram WebApp (initData) ---
        async login(tg_data: string) {
            try {
                const { data } = await api.telegramAuth({ init_data: tg_data })
                this.applyTokens(data)
            } catch (e: any) {
                console.error('login error:', e)
                throw new Error(e?.response?.data?.detail ?? e?.message ?? JSON.stringify(e))
            }
        },

        // --- Telegram OAuth 2.0 (code + PKCE) ---
        async loginWithTelegram(payload: {
            code: string;
            nonce: string;
            code_verifier: string,
            redirect_uri?: string
        }) {
            this.status = 'loading'
            try {
                const { data } = await api.telegramLogin(payload)
                this.applyTokens(data)
                console.log("Success", data)
            } catch (e) {
                this.setError(e)
                throw e
            }
        },

        // --- Silent refresh (httpOnly cookie) ---
        async refresh() {
            const { data } = await api.refreshToken();
            this.accessToken = data.access_token
            localStorage.setItem('access_token', data.access_token)
            this.status = 'authenticated'
        },

        // --- Access code login ---
        async accessPass(payload: SuperUser) {
            this.status = 'loading'
            try {
                const { data } = await api.accessCode(payload)
                this.applyTokens(data)
            } catch (e) {
                this.setError(e)
                throw e
            }
        },

        // --- Telegram Native Login (idToken) ---
        async nativeLogin(payload: { id_token: string }) {
            this.status = 'loading'
            try {
                const { data } = await api.nativeLogin(payload)
                this.applyTokens(data)
            } catch (e) {
                this.setError(e)
                throw e
            }
        },

        logout() {
            this.accessToken = null;
            this.status = 'idle'
            this.error = null as string | null
            localStorage.removeItem('access_token')
        },

        // --- Internal Helpers ----
        applyTokens(data: AuthTokensResponse) {
            this.accessToken = data.access_token
            this.status = 'authenticated'
            this.error = null
            localStorage.setItem('access_token', data.access_token)
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
