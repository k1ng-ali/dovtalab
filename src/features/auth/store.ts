import {defineStore} from "pinia";
import * as api from "./api";
import type {AuthStatus, AuthTokensResponse, SuperUser} from "@/features/auth/types.ts";
import i18n from '@/shared/i18n'

const { t } = i18n.global

const savedToken = localStorage.getItem('access_token')

/** Роли из payload JWT (без проверки подписи — только для интерфейса, права проверяет сервер). */
export function tokenRoles(token: string | null): string[] {
    if (!token) return []
    try {
        const part = (token.split('.')[1] ?? '').replace(/-/g, '+').replace(/_/g, '/')
        const payload = JSON.parse(atob(part.padEnd(part.length + (4 - part.length % 4) % 4, '=')))
        return Array.isArray(payload.roles) ? payload.roles : []
    } catch {
        return []
    }
}

// ----- Store----------------
export const useAuthStore = defineStore("auth", {
    // ------ State -------------
    state: () => ({
    status: (savedToken ? 'authenticated' : 'idle') as AuthStatus | 'idle',
    accessToken: savedToken as string | null,
    error: null as string | null,
    // Окно входа поверх приложения (гость открыл раздел только для вошедших)
    loginPromptOpen: false,
    // Куда перейти после входа из этого окна
    loginRedirect: null as string | null,
    }),

    getters: {
      isAuthenticated: (state): boolean => state.status === 'authenticated',
      isLoading: (state):boolean =>state.status === 'loading',
      isGuest: (state): boolean => tokenRoles(state.accessToken).includes('guest'),
    },

    actions: {
        // --- Telegram WebApp (initData) ---
        async login(tg_data: string) {
            try {
                const { data } = await api.telegramAuth({ init_data: tg_data, ...this.guestMerge() })
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
            this.startLoading()
            try {
                const { data } = await api.telegramLogin({ ...payload, ...this.guestMerge() })
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
            this.startLoading()
            try {
                const { data } = await api.nativeLogin({ ...payload, ...this.guestMerge() })
                this.applyTokens(data)
            } catch (e) {
                this.setError(e)
                throw e
            }
        },

        // --- Гостевой режим ---
        async loginAsGuest() {
            const { data } = await api.guestLogin()
            this.applyTokens(data)
        },

        /** Открыть окно входа; redirect — путь, куда перейти после входа. */
        promptLogin(redirect: string | null = null) {
            this.loginRedirect = redirect
            this.loginPromptOpen = true
        },

        closeLoginPrompt() {
            this.loginPromptOpen = false
            this.loginRedirect = null
        },

        async logout() {
            try {
                await api.logout()
            } catch (error) {
                // Локальную сессию всё равно нужно закрыть, даже если сервер недоступен.
                console.warn('[AuthStore] Server logout failed:', error)
            } finally {
                this.accessToken = null
                this.status = 'idle'
                this.error = null
                localStorage.removeItem('access_token')
            }
        },

        // --- Internal Helpers ----
        applyTokens(data: AuthTokensResponse) {
            this.accessToken = data.access_token
            this.status = 'authenticated'
            this.error = null
            localStorage.setItem('access_token', data.access_token)
            if (!this.isGuest) this.loginPromptOpen = false
        },

        // Гость входит в аккаунт — сервер переносит его данные по токену
        guestMerge(): { guest_token?: string } {
            return this.isGuest && this.accessToken ? { guest_token: this.accessToken } : {}
        },

        // Гость остаётся в приложении, пока идёт вход: окно входа поверх, а не экран загрузки
        startLoading() {
            if (!this.isGuest) this.status = 'loading'
        },

        setError(e: unknown) {
            const msg = e instanceof Error
                ? e.message
                : (e as any)?.response?.data?.detail ?? t('common.unknownError')
            this.error = msg
            // Гость при неудачном входе остаётся в приложении
            if (!this.isGuest) this.status = 'error'
            console.error('[AuthStore]', msg)
        }
    },
})
