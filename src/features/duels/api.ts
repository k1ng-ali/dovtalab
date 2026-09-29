import { http } from '@/shared/api/http.ts'
import type { UserAnswerPayload } from '@/features/quizPage/types.ts'
import type { DuelCreatePayload, DuelGameState, DuelResult, DuelRoom, DuelSubmitResult } from './types.ts'

export const listDuels = (limit = 50) =>
  http.get<DuelRoom[]>('/duels/', { params: { limit } })

export const createDuel = (payload: DuelCreatePayload) =>
  http.post<DuelRoom>('/duels/', payload)

export const getDuel = (duelId: number) =>
  http.get<DuelRoom>(`/duels/${duelId}`)

export const joinDuel = (duelId: number) =>
  http.post<DuelRoom>(`/duels/${duelId}/join`)

export const leaveDuel = (duelId: number) =>
  http.post<void>(`/duels/${duelId}/leave`)

export const surrenderDuel = (duelId: number) =>
  http.post<DuelResult>(`/duels/${duelId}/surrender`)

export const startDuel = (duelId: number) =>
  http.post<DuelGameState>(`/duels/${duelId}/start`)

export const currentDuel = (duelId: number) =>
  http.get<DuelGameState>(`/duels/${duelId}/current`)

export const submitDuelAnswer = (duelId: number, answer: UserAnswerPayload) =>
  http.post<DuelSubmitResult>(`/duels/${duelId}/answer`, { answer })

export const getDuelResult = (duelId: number) =>
  http.get<DuelResult>(`/duels/${duelId}/result`)