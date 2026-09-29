// src/features/duels/store.ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useAuthStore } from '@/features/auth/store.ts'
import * as api from './api.ts'
import type { DuelGameState, DuelResult, DuelRoom, DuelCreatePayload } from './types.ts'
import type { UserAnswerPayload } from '@/features/quizPage/types.ts'

export const useDuelsStore = defineStore('duels', () => {
  const authStore = useAuthStore()

  // ── State ─────────────────────────────────────────────────────────────
  const rooms = ref<DuelRoom[]>([])
  const activeRoom = ref<DuelRoom | null>(null)
  const gameState = ref<DuelGameState | null>(null)
  const finalResult = ref<DuelResult | null>(null)
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')

  // ── Getters ───────────────────────────────────────────────────────────
  const currentUserId = computed<number | null>(() => {
    const token = authStore.accessToken
    if (!token) return null
    try {
      const payload = token.split('.')[1]
      if (!payload) return null
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/')
      return Number(JSON.parse(atob(normalized)).sub)
    } catch {
      return null
    }
  })

  const isCreator = computed(() => {
    return currentUserId.value !== null && activeRoom.value?.creator_id === currentUserId.value
  })

  const hasRooms = computed(() => rooms.value.length > 0)
  const opponentFound = computed(() => (activeRoom.value?.participant_count ?? 0) >= 2)

  // ── Actions ───────────────────────────────────────────────────────────
  async function fetchRooms() {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const response = await api.listDuels()
      rooms.value = response.data
    } catch {
      errorMessage.value = 'Не удалось загрузить дуэли'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchRoom(id: number) {
    isLoading.value = true
    errorMessage.value = ''
    try {
      const response = await api.getDuel(id)
      activeRoom.value = response.data

      if (response.data.status === 'active') {
        await fetchGameState(id)
      } else if (response.data.status === 'finished') {
        const res = await api.getDuelResult(id)
        finalResult.value = res.data
      } else {
        finalResult.value = null
      }
    } catch {
      errorMessage.value = 'Не удалось загрузить комнату'
    } finally {
      isLoading.value = false
    }
  }

  async function fetchGameState(id: number) {
    const response = await api.currentDuel(id)
    gameState.value = response.data
    activeRoom.value = response.data.duel
  }

  async function createRoom(payload: DuelCreatePayload) {
    isSubmitting.value = true
    try {
      const res = await api.createDuel(payload)
      rooms.value = [res.data, ...rooms.value]
      return res.data
    } finally {
      isSubmitting.value = false
    }
  }

  async function joinRoom(id: number) {
    isSubmitting.value = true
    try {
      const res = await api.joinDuel(id)
      activeRoom.value = res.data
      return res.data
    } finally {
      isSubmitting.value = false
    }
  }

  async function startRoom(id: number) {
    isSubmitting.value = true
    try {
      const res = await api.startDuel(id)
      gameState.value = res.data
      activeRoom.value = res.data.duel
      finalResult.value = null
    } finally {
      isSubmitting.value = false
    }
  }

  async function submitAnswer(roomId: number, answer: UserAnswerPayload) {
    isSubmitting.value = true
    try {
      const res = await api.submitDuelAnswer(roomId, answer)
      activeRoom.value = res.data.duel
      return res.data
    } finally {
      isSubmitting.value = false
    }
  }

  async function leaveRoom(id: number) {
    isSubmitting.value = true
    try {
      await api.leaveDuel(id)
      resetRoomState()
    } finally {
      isSubmitting.value = false
    }
  }

  async function surrender(id: number) {
    isSubmitting.value = true
    try {
        const res = await api.surrenderDuel(id)
        return res.data
    } finally {
        isSubmitting.value = false
    }
    }

  function resetRoomState() {
    activeRoom.value = null
    gameState.value = null
    finalResult.value = null
  }

  return {
    rooms,
    activeRoom,
    gameState,
    finalResult,
    isLoading,
    isSubmitting,
    errorMessage,
    currentUserId,
    isCreator,
    hasRooms,
    opponentFound,
    fetchRooms,
    fetchRoom,
    fetchGameState,
    createRoom,
    joinRoom,
    startRoom,
    submitAnswer,
    leaveRoom,
    surrender,
    resetRoomState,
  }
})