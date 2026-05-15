import {http} from "@/shared/api/http.ts"
import type {QuizIn, QuestionPublic,QuizStat, SubmitIn,
    ContextIn, SubmitAnswer} from "@/features/quizPage/types.ts"

export const quizzes = () => http.get<QuizIn[]>('/quizzes/')
export const getQuiz = (quiz_id: number) => http.get<QuizIn>(`/quizzes/${quiz_id}`)

export const startQuiz = (quiz_id: number) => http.get<QuestionPublic>(`/quizzes/${quiz_id}/start`)

// GET /quizzes/{quiz_id}/contexts
export const getContexts = (quiz_id: number) =>
    http.get<ContextIn[]>(`/quizzes/${quiz_id}/contexts`)


// ATTEMPTS
export const nextQuestion = (quiz_attempt_id: number) =>
    http.get<QuestionPublic>(`/attempts/${quiz_attempt_id}/next`)

export const submitAnswer = (submit_answer: SubmitAnswer) =>
    http.post<SubmitIn>(`/attempts/${submit_answer.id}/submit`, submit_answer)

// STATS
export const myStat = (quiz_id: number) =>
    http.get<QuizStat>(`/quizzes/${quiz_id}/my-stat`)


// FAVORITES
export const favorites = () => http.get<QuizIn[]>('/quizzes/favorites')

export const add_favorite = (quiz_id: number) => http.post(`/quizzes/${quiz_id}/favorite`)

export const dell_favorite = (quiz_id: number) => http.delete(`/quizzes/${quiz_id}/favorite`)