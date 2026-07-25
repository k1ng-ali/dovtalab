import {http} from "@/shared/api/http.ts"
import type {
    QuizIn, QuestionPublic, QuizStat, SubmitIn,
    ContextIn, SubmitAnswer
} from "@/features/quizPage/types.ts"

export const quizzes = (skip = 0, limit = 20) => http.get<QuizIn[]>('/quizzes/', { params: { skip, limit } })
export const getQuiz = (quiz_id: number) => http.get<QuizIn>(`/quizzes/${quiz_id}`)
export const topQuizzes = (limit = 3) => http.get<QuizIn[]>('/quizzes/top', { params: { limit } })
export const searchQuizzes = (q: string, skip = 0, limit = 10) =>
    http.get<QuizIn[]>('/quizzes/search', { params: { q, skip, limit } })

// Начать квиз → возвращает первый вопрос (QuestionPublic)
export const startQuiz = (quiz_id: number, context_id?: number, mode: string = 'practice', question_limit?: number, cluster_id?: number) => {
    const params = new URLSearchParams()
    if (context_id) params.set('context_id', String(context_id))
    if (mode !== 'practice') params.set('mode', mode)
    if (question_limit) params.set('question_limit', String(question_limit))
    if (cluster_id != null) params.set('cluster_id', String(cluster_id))
    const qs = params.toString()
    return http.get<QuestionPublic>(`/quizzes/${quiz_id}/start${qs ? '?' + qs : ''}`)
}

// Контексты квиза
export const getContexts = (quiz_id: number) =>
    http.get<ContextIn[]>(`/quizzes/${quiz_id}/contexts`)

// ATTEMPTS
export const nextQuestion = (quiz_attempt_id: number) =>
    http.get<QuestionPublic>(`/attempts/${quiz_attempt_id}/next`)

export const submitAnswer = (submit_answer: SubmitAnswer) =>
    http.post<SubmitIn>(`/attempts/${submit_answer.id}/submit`, { answer: submit_answer.answer })

// STATS
export const myStat = (quiz_id: number) =>
    http.get<QuizStat>(`/quizzes/${quiz_id}/my-stat`)

// ADAPTIVE
export const checkAdaptiveAvailable = (quiz_id: number) =>
    http.get<{ available: boolean; clustered_questions: number }>(`/quizzes/${quiz_id}/adaptive-available`)

// FAVORITES
export const favorites = () => http.get<QuizIn[]>('/quizzes/favorites')

export const add_favorite = (quiz_id: number) => http.post(`/quizzes/${quiz_id}/favorite`)

export const dell_favorite = (quiz_id: number) => http.delete(`/quizzes/${quiz_id}/favorite`)
