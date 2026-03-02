import { defineStore } from "pinia";
import * as api from "@/features/quizPage/api.ts";
import type {QuizIn, QuestionPublic, ContextIn, QuestionAttemptOut, SubmitAnswer} from "src/features/quizPage/types.ts"

export const useQuiz = defineStore("quiz", {
    state: ()=> ({
        quizzes: [] as QuizIn[],
        questions: [] as QuestionPublic[],
        contexts:  [] as ContextIn[],
    }),

    getters: {
        quiz: (state) => (id: number): QuizIn | null =>
            state.quizzes.find(q => q.id === id) ?? null,

        questionsByQuiz: (state) => (quiz_id: number): QuestionPublic[] =>
            state.questions.filter(q => (q as any).quiz_id === quiz_id),

        contextsByQuiz: (state) => (quiz_id: number): ContextIn[] =>
            state.contexts.filter(c => (c as any).quiz_id === quiz_id),
    },

    actions: {
        // ─── Quiz ────────────────────────────────────────────────────────────
        async fetchQuizzes() {
            const { data } = await api.quizzes();
            this.quizzes = data;
        },

        async startQuiz(quiz_id: number) {
            const { data } = await api.startQuiz(quiz_id);
            return data as QuestionPublic
        },

        // ─── Questions ────────────────────────────────────────────────────────

        async nextQuestion(quiz_attempt_id: number) {
            const { data } = await api.nextQuestion(quiz_attempt_id);
            return data as QuestionPublic
        },

        async submitAnswer(submit_answer: SubmitAnswer) {
            const {data} = await api.submitAnswer(submit_answer)
            return data as QuestionAttemptOut
        },

        // ─── Contexts ────────────────────────────────────────────────────────
        async fetchContexts(quiz_id: number): Promise<ContextIn[]> {
            const { data } = await api.getContexts(quiz_id);
            this.contexts = data;
            return data;
        },
    }


})