// features/auth/pkce.ts

export function generateNonce(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function storeNonce(nonce: string): void {
    sessionStorage.setItem('tg_auth_nonce', nonce)
}

export function consumeNonce(): string | null {
    const nonce = sessionStorage.getItem('tg_auth_nonce')
    sessionStorage.removeItem('tg_auth_nonce')
    return nonce
}

// --- PKCE ---
export async function generateCodeVerifier(): Promise<string> {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return btoa(String.fromCharCode(...array))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export async function generateCodeChallenge(verifier: string): Promise<string> {
    const data = new TextEncoder().encode(verifier)
    const digest = await crypto.subtle.digest('SHA-256', data)
    return btoa(String.fromCharCode(...new Uint8Array(digest)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function storeCodeVerifier(verifier: string): void {
    sessionStorage.setItem('tg_code_verifier', verifier)
}

export function consumeCodeVerifier(): string | null {
    const v = sessionStorage.getItem('tg_code_verifier')
    sessionStorage.removeItem('tg_code_verifier')
    return v
}