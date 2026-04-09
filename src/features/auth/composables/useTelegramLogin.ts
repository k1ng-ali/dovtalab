// features/auth/composables/useTelegramLogin.ts
import { ref } from 'vue'
import {
    generateNonce, storeNonce,
    generateCodeVerifier, generateCodeChallenge, storeCodeVerifier
} from '@/shared/lib/pkce.ts'

export function useTelegramLogin() {
    const isLoading = ref(false)

    const openLoginPopup = async (): Promise<{ code: string; nonce: string; code_verifier: string }> => {
        isLoading.value = true

        try {
            const nonce = generateNonce()
            const state = generateNonce() // случайная строка для защиты
            const codeVerifier = await generateCodeVerifier()
            const codeChallenge = await generateCodeChallenge(codeVerifier)

            // Сохраняем в sessionStorage — переживут редирект
            storeNonce(nonce)
            storeCodeVerifier(codeVerifier)
            sessionStorage.setItem('tg_auth_state', state)

            const params = new URLSearchParams({
                client_id: import.meta.env.VITE_TELEGRAM_CLIENT_ID,
                redirect_uri: import.meta.env.VITE_TELEGRAM_REDIRECT_URI,
                response_type: 'code',
                scope: 'openid profile',
                state,
                nonce,
                code_challenge: codeChallenge,
                code_challenge_method: 'S256',
            })

            // Открываем popup
            return await new Promise((resolve, reject) => {
                const authUrl = `https://oauth.telegram.org/auth?${params}`
                const popup = window.open(authUrl, 'telegram-auth', 'width=550,height=650')

                if (!popup) {
                    reject(new Error('Popup заблокирован браузером'))
                    return
                }

                // Слушаем postMessage от нашей callback-страницы
                const handler = (event: MessageEvent) => {
                    if (event.origin !== window.location.origin) return
                    if (event.data?.type !== 'telegram-auth-callback') return

                    window.removeEventListener('message', handler)

                    const { code, state: returnedState } = event.data
                    const savedState = sessionStorage.getItem('tg_auth_state')
                    sessionStorage.removeItem('tg_auth_state')

                    if (returnedState !== savedState) {
                        reject(new Error('State mismatch — возможна CSRF атака'))
                        return
                    }

                    const savedNonce = sessionStorage.getItem('tg_auth_nonce')
                    sessionStorage.removeItem('tg_auth_nonce')
                    const savedVerifier = sessionStorage.getItem('tg_code_verifier')
                    sessionStorage.removeItem('tg_code_verifier')

                    resolve({
                        code,
                        nonce: savedNonce!,
                        code_verifier: savedVerifier!,
                    })
                }

                window.addEventListener('message', handler)

                // Таймаут если юзер закрыл popup
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

    return { isLoading, openLoginPopup }
}