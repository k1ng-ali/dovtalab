import {http} from "@/shared/api/http.ts";
import type {
    AuthTokensResponse,
} from "@/features/auth/types.ts";

// Telegram WebApp initData
export const telegramAuth = (data: { init_data: string }) =>
    http.post<AuthTokensResponse>('/auth/telegram/webapp', data)

// Telegram OAuth 2.0 (code + PKCE)
export const telegramLogin = (payload: {
    code: string
    nonce: string
    code_verifier: string
    redirect_uri?: string
}) => http.post<AuthTokensResponse>('/auth/telegram', payload)

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
export const nativeLogin = (data: { id_token: string }) =>
    http.post<AuthTokensResponse>('/auth/telegram/native', data)
