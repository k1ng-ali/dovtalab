import { defineStore } from 'pinia'
import * as api from './api.ts'
import type { User, Config, UserProfile, UserRole } from './type.ts'

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
      is_pro: (state) => state.profile?.roles.includes("pro") ?? false,
      is_admin: (state) => state.profile?.roles.includes("admin") ?? false,
    },

    actions: {
        async fetchProfile(force = false) {
            if (this.profile && !force) return this.profile

            this.loading = true
            try {
                const { data } = await api.profile()
                //console.log(data)
                this.profile = data as UserProfile
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

            try {
                const { data } = await api.updateConfig(updated)
                this.profile.config = { ...this.profile.config, ...(data as Partial<Config>) }
                return this.profile.config
            } catch (error) {
                // Откат
                this.profile.config = previous
                console.error(error)
                throw error
            }
        },

        async logout() {
            if (!this.profile) return
            await api.logout()
            this.profile = null
        },

        clearProfile() {
            this.profile = null
        },
    },
})