import {http} from "@/shared/api/http.ts"
import type { Period} from "@/features/mainPage/leaderboard/types.ts";

export const leaders = (period: Period = "all", limit: number = 50) =>
    http.get(`leaderboard?period=${period}&limit=${limit}`)
