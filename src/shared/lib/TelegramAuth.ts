import { registerPlugin } from '@capacitor/core';

export interface TelegramAuthResult {
    /** true — авторизация успешна, false — ошибка или отмена */
    success: boolean;
    /** JWT от Telegram (присутствует только при success = true) */
    idToken?: string;
    /** Описание ошибки (присутствует только при success = false) */
    error?: string;
}

export interface TelegramAuthPlugin {
    login(): Promise<TelegramAuthResult>;
}

export const TelegramAuth = registerPlugin<TelegramAuthPlugin>('TelegramAuth');
