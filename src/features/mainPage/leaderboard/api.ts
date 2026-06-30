import {http} from "@/shared/api/http.ts"
import type { Period, LeaderboardItem } from "@/features/mainPage/leaderboard/types.ts";

export const leaders = (period: Period = "all", limit: number = 50) =>
    http.get<LeaderboardItem[]>(`/leaderboard?period=${period}&limit=${limit}`)

export const quizLeaderboard = (quizId: number) =>
    http.get<LeaderboardItem[]>(`/quizzes/${quizId}/leaderboard`)
