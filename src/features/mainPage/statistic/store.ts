import {defineStore} from "pinia";
import * as api from "@/features/mainPage/statistic/api.ts"
import type {UserStats, AttemptStat} from "@/features/mainPage/statistic/type.ts";

export const useStats = defineStore("statistic", {
    state: () => ({
       stats: null as UserStats | null,
        attempts: [] as AttemptStat[],
    }),

    getters: {
        statistic: (state): UserStats | null =>
            state.stats ?? null,
        attemptsHistory: (state): AttemptStat[] | null => {
            if (state.attempts?.length > 0) {
                return state.attempts
            } else return null
        }
    },

    actions: {
        async fetchStats() {
            try {
                const {data} = await api.stats()
                this.stats = data as UserStats
            } catch (error) {
                console.error(error)
            }
        },

        async fetchAttemptsHistory(skip: number, limit: number) {
            try {
                const {data} = await api.attemptHistory(skip, limit)
                this.attempts = data as AttemptStat[]
            } catch (error) {
                console.error(error)
            }
        }
    }
})