import { defineStore } from 'pinia'
import * as api from './api.ts'
import { logout as authLogout } from '@/features/auth/api.ts'
import { useAuthStore } from '@/features/auth/store.ts'
import type { User, Config, UserProfile, UserRole } from './type.ts'
import { setLocale, type AppLocale } from '@/shared/i18n'

export const useUserStore = defineStore("user", {
    state: () => ({
        profile: null as UserProfile | null,
        loading: false,
    }),

    getters: {
      user: (state): User | null => state.profile?.user ?? null,
      config: (state): Config | null => state.profile?.config ?? null,
      roles: (state): UserRole[] => state.profile?.roles ?? [],

      is_creator: (state) => state.profile?.roles.includes("creator") ?? false,
      is_pro: (): boolean => {
        const authStore = useAuthStore()
        const token = authStore.accessToken
        if (!token) return false
        try {
          const parts = token.split('.')
          if (parts.length < 2) return false
          const payload = JSON.parse(atob(parts[1]!))
          return payload.subs === 'pro' || payload.subs === 'creator'
        } catch {
          return false
        }
      },
      is_admin: (state) => state.profile?.roles.includes("admin") ?? false,

      subscription: (): string | null => {
        const authStore = useAuthStore()
        const token = authStore.accessToken
        if (!token) return null
        try {
          const parts = token.split('.')
          if (parts.length < 2) return null
          const payload = JSON.parse(atob(parts[1]!))
          return payload.subs ?? null
        } catch {
          return null
        }
      },
    },

    actions: {
        async fetchProfile(force = false) {
            if (this.profile && !force) return this.profile

            this.loading = true
            try {
                const { data } = await api.profile()
                //console.log(data)
                this.profile = data as UserProfile

                // Sync i18n locale with user config from backend
                if (this.profile.config?.language) {
                    setLocale(this.profile.config.language as AppLocale)
                }

                return this.profile
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.loading = false
            }
        },

        async patchConfig(updated: Partial<Config>) {
            if (!this.profile) return

            // Оптимистичное обновление
            const previous = { ...this.profile.config }
            this.profile.config = { ...this.profile.config, ...updated }

            // Sync locale immediately on optimistic update
            if (updated.language) {
                setLocale(updated.language as AppLocale)
            }

            try {
                const { data } = await api.updateConfig(updated)
                this.profile.config = { ...this.profile.config, ...(data as Partial<Config>) }
                return this.profile.config
            } catch (error) {
                // Откат
                this.profile.config = previous
                // Revert locale on error
                if (updated.language && previous.language) {
                    setLocale(previous.language as AppLocale)
                }
                console.error(error)
                throw error
            }
        },

        async logout() {
            if (!this.profile) return
            await authLogout()
            this.profile = null
        },

        clearProfile() {
            this.profile = null
        },
    },
})