// src/features/league/store.ts — недельная лига пользователя
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import * as api from './api.ts'
import type { League } from './types.ts'

export const LEAGUE_TIERS = 7

export const useLeagueStore = defineStore('league', () => {
  // ── State ─────────────────────────────────────────────────────────────
  const league = ref<League | null>(null)
  const isLoading = ref(false)
  const errorMessage = ref('')

  // ── Getters ───────────────────────────────────────────────────────────
  const me = computed(() => league.value?.me ?? null)
  const isTopTier = computed(() => (league.value?.tier ?? 0) >= LEAGUE_TIERS - 1)

  // ── Actions ───────────────────────────────────────────────────────────
  async function fetchLeague() {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const { data } = await api.getMyLeague()
      league.value = data
    } catch (e: any) {
      errorMessage.value = e?.response?.data?.detail ?? e?.message ?? ''
    } finally {
      isLoading.value = false
    }
  }

  return { league, isLoading, errorMessage, me, isTopTier, fetchLeague }
})
