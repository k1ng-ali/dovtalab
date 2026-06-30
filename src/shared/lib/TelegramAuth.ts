import { registerPlugin } from '@capacitor/core';

// 1. Описываем то, что возвращает наш Kotlin-код (JSObject)
export interface TelegramAuthResult {
    success: boolean;
    idToken?: string;  // JWT от Telegram
}

// 2. Описываем интерфейс самого плагина (какие методы в нем есть)
export interface TelegramAuthPlugin {
    login(): Promise<TelegramAuthResult>;
}

// 3. Регистрируем плагин, передавая наш интерфейс в <Generic>
export const TelegramAuth = registerPlugin<TelegramAuthPlugin>('TelegramAuth');