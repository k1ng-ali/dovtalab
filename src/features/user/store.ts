import { defineStore } from 'pinia'
import * as api from './api.ts'
import type { User, Config } from './type.ts'

export const useUserStore = defineStore("user", {
    state: () => ({
        user:   null as User   | null,
        config: null as Config | null,
    }),

    actions: {
        async fetchMe() {
            // Не делаем повторный запрос если данные уже есть
            if (this.user) return this.user

            try {
                const { data } = await api.getMe()
                this.user = data as User
                return data as User
            } catch (error) {
                console.error(error)
            }
        },

        async fetchConfig() {
            // Не делаем повторный запрос если данные уже есть
            if (this.config) return this.config

            try {
                const { data } = await api.config()
                this.config = data as Config
                return data as Config
            } catch (error) {
                console.error(error)
            }
        },

        async patchConfig(updated: Config) {
            // Сохраняем предыдущее состояние для отката
            const previous = this.config ? { ...this.config } : null

            // Оптимистичное обновление — UI меняется мгновенно
            this.config = { ...this.config, ...updated }

            try {
                const { data } = await api.updateConfig(updated)
                // Merge: сервер может вернуть неполный объект —
                // сохраняем все имеющиеся поля и поверх кладём ответ
                this.config = { ...this.config, ...(data as Partial<Config>) }
                return this.config as Config
            } catch (error) {
                // Откат при ошибке
                this.config = previous
                console.error(error)
                throw error
            }
        },

        /** Принудительное обновление (например, pull-to-refresh) */
        async forceRefreshConfig() {
            try {
                const { data } = await api.config()
                this.config = data as Config
                return data as Config
            } catch (error) {
                console.error(error)
            }
        },
    },
})