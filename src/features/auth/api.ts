import {http} from "@/shared/api/http.ts";
import type {
    AuthTokensResponse,
} from "@/features/auth/types.ts";

// guest_token — токен гостевого аккаунта: при входе его попытки и избранное переходят в аккаунт
type GuestMerge = { guest_token?: string }

// Telegram WebApp initData
export const telegramAuth = (data: { init_data: string } & GuestMerge) =>
    http.post<AuthTokensResponse>('/auth/telegram/webapp', data)

// Telegram OAuth 2.0 (code + PKCE)
export const telegramLogin = (payload: {
    code: string
    nonce: string
    code_verifier: string
    redirect_uri?: string
} & GuestMerge) => http.post<AuthTokensResponse>('/auth/telegram', payload)

// Гостевой аккаунт без входа: каталог и тесты вне рейтинга
export const guestLogin = () =>
    http.post<AuthTokensResponse>('/auth/guest')

// Refresh token (httpOnly cookie)
export const refreshToken = () =>
    http.post<{ access_token: string }>('/auth/refresh')

// Logout
export const logout = () =>
    http.post('/auth/logout')

// Dev-mode login (только в development)
export const devLogin = () =>
    http.post<AuthTokensResponse>('/auth/dev-login')

// Access code login
export const accessCode = (data: { access_code: string }) =>
    http.post<AuthTokensResponse>('/auth/code-access', data)

// Telegram Native Login (idToken JWT)
export const nativeLogin = (data: { id_token: string } & GuestMerge) =>
    http.post<AuthTokensResponse>('/auth/telegram/native', data)
