import {defineStore} from "pinia";
import * as api from './api.ts'
import type {LeaderboardItem} from "./types";


export const useLeadersStore = defineStore("leaderboard", {
    state: () => ({
        leaders: null as LeaderboardItem[] | null,
        loading: false,
    }),

    getters: {
        getLeaders: (state): LeaderboardItem[] | null => {
            if (state.leaders && state.leaders.length > 0) {return state.leaders}
            return null;
        },
        first: (state): LeaderboardItem | null =>
            state.leaders?.find(s => s.rank === 1) ?? null,

        second: (state): LeaderboardItem | null =>
            state.leaders?.find(s => s.rank === 2) ?? null,

        third: (state): LeaderboardItem | null =>
            state.leaders?.find(s => s.rank === 3) ?? null,

    },

    actions: {
        async fetchLeaders() {
            this.loading = true
            try {
                const { data } = await api.leaders();
                this.leaders = data as LeaderboardItem[]
                console.log(data)
            } catch (error) {
                console.error(error)
                throw error
            } finally {
                this.loading = false
            }
        }
    }
});