// src/features/auth/composables/useTelegramEnv.ts

export function useTelegramEnv() {
    const twa = (window as any)?.Telegram?.WebApp

    // Telegram Mini App или встроенный браузер — initData будет непустым
    const isTelegramEnv = Boolean(twa?.initData && twa.initData.length > 0)

    const getInitData = (): string | null => twa?.initData ?? null

    return { isTelegramEnv, getInitData }
}