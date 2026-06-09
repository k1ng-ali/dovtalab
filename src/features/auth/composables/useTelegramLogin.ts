// features/auth/composables/useTelegramLogin.ts
import { ref } from 'vue'
import { Capacitor } from '@capacitor/core'
import { Browser } from '@capacitor/browser'
import {
    generateNonce,
    generateCodeVerifier,
    generateCodeChallenge,
} from '@/shared/lib/pkce.ts'

// localStorage-ключи — переживают переход браузер → приложение
const LS_NONCE         = 'tg_auth_nonce'
const LS_STATE         = 'tg_auth_state'
const LS_CODE_VERIFIER = 'tg_code_verifier'

/** Сохранить PKCE-параметры перед редиректом */
export function storePkceParams(params: { nonce: string; state: string; codeVerifier: string }) {
    localStorage.setItem(LS_NONCE,         params.nonce)
    localStorage.setItem(LS_STATE,         params.state)
    localStorage.setItem(LS_CODE_VERIFIER, params.codeVerifier)
}

/** Прочитать и очистить PKCE-параметры */
export function consumePkceParams() {
    const nonce        = localStorage.getItem(LS_NONCE)         ?? ''
    const state        = localStorage.getItem(LS_STATE)         ?? ''
    const codeVerifier = localStorage.getItem(LS_CODE_VERIFIER) ?? ''
    localStorage.removeItem(LS_NONCE)
    localStorage.removeItem(LS_STATE)
    localStorage.removeItem(LS_CODE_VERIFIER)
    return { nonce, state, codeVerifier }
}

/** Собрать URL для Telegram OAuth */
async function buildAuthUrl(): Promise<{ url: string; nonce: string; state: string; codeVerifier: string }> {
    const nonce        = generateNonce()
    const state        = generateNonce()
    const codeVerifier = await generateCodeVerifier()
    const codeChallenge = await generateCodeChallenge(codeVerifier)

    const redirectUri = Capacitor.isNativePlatform()
        ? import.meta.env.VITE_TELEGRAM_REDIRECT_URI_NATIVE   // e.g. com.mycompany.myapp://auth/callback
        : import.meta.env.VITE_TELEGRAM_REDIRECT_URI          // e.g. https://yourapp.com/auth/callback

    const params = new URLSearchParams({
        client_id:             import.meta.env.VITE_TELEGRAM_CLIENT_ID,
        redirect_uri:          redirectUri,
        response_type:         'code',
        scope:                 'openid profile',
        state,
        nonce,
        code_challenge:        codeChallenge,
        code_challenge_method: 'S256',
    })

    return {
        url: `https://oauth.telegram.org/auth?${params}`,
        nonce,
        state,
        codeVerifier,
    }
}

export function useTelegramLogin() {
    const isLoading = ref(false)

    /**
     * Web-флоу: открывает popup, ждёт postMessage от callback-страницы.
     * Возвращает Promise<{ code, nonce, code_verifier }>.
     */
    const openLoginPopup = async (): Promise<{ code: string; nonce: string; code_verifier: string }> => {
        isLoading.value = true
        try {
            const { url, nonce, state, codeVerifier } = await buildAuthUrl()

            // sessionStorage достаточно — popup живёт в том же контексте
            sessionStorage.setItem(LS_STATE,         state)
            sessionStorage.setItem(LS_NONCE,         nonce)
            sessionStorage.setItem(LS_CODE_VERIFIER, codeVerifier)

            return await new Promise((resolve, reject) => {
                const popup = window.open(url, 'telegram-auth', 'width=550,height=650')

                if (!popup) {
                    reject(new Error('Popup заблокирован браузером'))
                    return
                }

                const handler = (event: MessageEvent) => {
                    if (event.origin !== window.location.origin) return
                    if (event.data?.type !== 'telegram-auth-callback') return

                    window.removeEventListener('message', handler)
                    clearInterval(timer)

                    const { code, state: returnedState } = event.data
                    const savedState    = sessionStorage.getItem(LS_STATE)         ?? ''
                    const savedNonce    = sessionStorage.getItem(LS_NONCE)         ?? ''
                    const savedVerifier = sessionStorage.getItem(LS_CODE_VERIFIER) ?? ''

                    sessionStorage.removeItem(LS_STATE)
                    sessionStorage.removeItem(LS_NONCE)
                    sessionStorage.removeItem(LS_CODE_VERIFIER)

                    if (returnedState !== savedState) {
                        reject(new Error('State mismatch — возможна CSRF атака'))
                        return
                    }

                    resolve({ code, nonce: savedNonce, code_verifier: savedVerifier })
                }

                window.addEventListener('message', handler)

                const timer = setInterval(() => {
                    if (popup.closed) {
                        clearInterval(timer)
                        window.removeEventListener('message', handler)
                        reject(new Error('Окно авторизации закрыто'))
                    }
                }, 500)
            })
        } finally {
            isLoading.value = false
        }
    }

    /**
     * Native-флоу (Capacitor): открывает Telegram OAuth в системном браузере,
     * сохраняет PKCE-параметры в localStorage, затем возвращает управление.
     * Результат будет обработан в App.vue через appUrlOpen.
     */
    const openLoginRedirect = async (): Promise<void> => {
        isLoading.value = true
        try {
            const { url, nonce, state, codeVerifier } = await buildAuthUrl()

            // localStorage — переживёт переход между браузером и приложением
            storePkceParams({ nonce, state, codeVerifier })

            await Browser.open({ url, windowName: '_self' })
        } finally {
            // Не сбрасываем isLoading — приложение уходит в фон
            // Сброс произойдёт в App.vue после возврата
        }
    }

    return { isLoading, openLoginPopup, openLoginRedirect }
}