import {http} from "@/shared/api/http.ts";
import type {
    AuthTokensResponse,
} from "@/features/auth/types.ts";

export const telegramAuth = (data: any) =>
    http.post('/auth/telegram/webapp', data)

export const refreshToken = () => {
    return http.post('/auth/refresh')
}

export const testLogin = () => http.get('/auth/test')

export const logout = () =>
    http.post('/auth/logout')

// --------- Telegram OPENID -----
export const telegramLogin = (payload: {
    code: string
    nonce: string
    code_verifier: string
}) => http.post<AuthTokensResponse>('/auth/telegram', payload)