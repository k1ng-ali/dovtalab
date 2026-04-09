import type { User } from "@/features/user/type.ts"

export interface TelegramDataTest {
    id: number
    first_name: string
    last_name?: string
    username?: string
    photo_url?: string
    auth_date: number
    hash: string
}


// --- Telegram OIDC ---

/** Payload из id_token (после декодирования на бэке) */
export interface TelegramIdTokenClaims {
    iss: string                   // "https://oauth.telegram.org"
    aud: string                   // ваш client_id
    sub: string                   // уникальный Telegram user ID (строка)
    iat: number
    exp: number
    id?: number                   // числовой Telegram ID
    name?: string
    preferred_username?: string
    picture?: string
    phone_number?: string
}

export interface TelegramCallbackData  {
    id_token?: string
    user?: User
    error?: string
}

export interface TelegramInitOptions {
    client_id: number
    request_access?: ('phone' | 'write')[]
    lang?: string
    nonce?: string
}

// ─── Window augmentation ──────────────────────────────────────────────────────

declare global {
    interface Window {
        Telegram: {
            Login: {
                init: (options: TelegramInitOptions, callback: (data: TelegramCallbackData) => void) => void
                open: (callback?: (data: TelegramCallbackData) => void) => void
                auth: (options: TelegramInitOptions, callback: (data: TelegramCallbackData) => void) => void
            }
        }
    }
}


// ─── API Request / Response ───────────────────────────────────────────────────

export interface TelegramLoginRequest {
    id_token: string
    nonce: string
}

export interface AuthTokensResponse {
    access_token: string
    refresh_token: string
    token_type: 'bearer'
    expires_in: number           // секунды до истечения access_token
    user: User
}

export interface RefreshRequest {
    refresh_token: string
}

// ─── Store State ──────────────────────────────────────────────────────────────

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'error'

export interface AuthState {
    status: AuthStatus
    accessToken: string | null
    user: User | null
    error: string | null
}

