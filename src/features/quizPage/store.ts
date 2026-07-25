import { defineStore } from "pinia";
import * as api from "@/features/quizPage/api.ts";
import type {
    QuizIn, QuestionPublic, ContextIn, QuizStat,
    SubmitAnswer, SubmitIn
} from "@/features/quizPage/types.ts"

export const useQuiz = defineStore("quiz", {
    state: ()=> ({
        quizzes: [] as QuizIn[],
        topQuizzes: [] as QuizIn[],
        questions: [] as QuestionPublic[],
        contexts:  [] as ContextIn[],
        quiz_stats: [] as QuizStat[],
        favorites: [] as QuizIn[],
    }),

    getters: {
        quiz: (state) => (id: number): QuizIn | null =>
            state.quizzes.find(q => q.id === id) ?? null,

        questionsByQuiz: (state) => (quiz_id: number): QuestionPublic[] =>
            state.questions.filter(q => (q as any).quiz_id === quiz_id),

        contextsByQuiz: (state) => (quiz_id: number): ContextIn[] =>
            state.contexts.filter(c => (c as any).quiz_id === quiz_id),

        quizStat: (state) => (quiz_id: number): QuizStat | null =>
            state.quiz_stats.find(s => (s as any).quiz_id === quiz_id) ?? null,
    },

    actions: {
        // ─── Quiz ────────────────────────────────────────────────────────────
        async fetchQuizzes(skip = 0, limit = 20) {
            const { data } = await api.quizzes(skip, limit);
            if (skip === 0) {
                this.quizzes = data;
            } else {
                this.quizzes = [...this.quizzes, ...data];
            }
            return data;
        },

        async fetchTopQuizzes(limit = 3) {
            const { data } = await api.topQuizzes(limit);
            this.topQuizzes = data;
            return data;
        },

        async searchQuizzes(q: string, skip = 0, limit = 10) {
            const { data } = await api.searchQuizzes(q, skip, limit);
            return data;
        },

        async getQuiz(quiz_id: number) {
            const { data } = await api.getQuiz(quiz_id);
            // обновляем в сторе, чтобы геттер тоже вернул полные данные
            const idx = this.quizzes.findIndex(q => q.id === quiz_id)
            if (idx !== -1) this.quizzes[idx] = data
            return data as QuizIn
        },

        async startQuiz(quiz_id: number, context_id?: number, mode: string = 'practice', question_limit?: number, cluster_id?: number): Promise<QuestionPublic> {
            const { data } = await api.startQuiz(quiz_id, context_id, mode, question_limit, cluster_id);
            return data
        },

        // ─── Questions ────────────────────────────────────────────────────────

        async nextQuestion(quiz_attempt_id: number) {
            const { data } = await api.nextQuestion(quiz_attempt_id);
            return data as QuestionPublic
        },

        async submitAnswer(submit_answer: SubmitAnswer) {
            console.log("seubmitted")
            const {data} = await api.submitAnswer(submit_answer)
            console.log(data)
            return data as SubmitIn
        },

        // ─── Contexts ────────────────────────────────────────────────────────
        async fetchContexts(quiz_id: number): Promise<ContextIn[]> {
            const { data } = await api.getContexts(quiz_id);
            this.contexts = data;
            return data;
        },

        // ─── Stats ────────────────────────────────────────────────────────
        async fetchQuizStat(quiz_id: number): Promise<QuizStat> {
            const { data } = await api.myStat(quiz_id);

            const idx = this.quiz_stats.findIndex(s => s.quiz_id === quiz_id)

            if (idx !== -1) {
                this.quiz_stats[idx] = data
            } else {
                this.quiz_stats.push(data)
            }

            console.log(data)
            return data as QuizStat;
        },

        // ─── Adaptive ─────────────────────────────────────────────────────────
        async checkAdaptiveAvailable(quiz_id: number): Promise<{ available: boolean; clustered_questions: number }> {
            const { data } = await api.checkAdaptiveAvailable(quiz_id);
            return data;
        },

        // ─── Favorites ────────────────────────────────────────────────────────
        async fetchFavorites() {
            const { data } = await api.favorites();
            this.favorites = data as QuizIn[];
        },

        async addFavorite(quiz_id: number) {
            await api.add_favorite(quiz_id);
            await this.fetchFavorites();
        },

        async deleteFavorite(quiz_id: number) {
            await api.dell_favorite(quiz_id);
            await this.fetchFavorites();
        }
    }


})