import { http } from "@/shared/api/http.ts"

export interface DailyChallengeQuestion {
    question_id: number
    quiz_id: number
    source: "review" | "weak" | "explore"
}

export interface DailyChallengeData {
    id: number | null
    question_ids: DailyChallengeQuestion[]
    total_questions: number
    answered_count: number
    correct_count: number
    completed: boolean
    date: string
    streak: number
    empty?: boolean
}

export interface DailyChallengeSubmitResult {
    answered_count: number
    correct_count: number
    total_questions: number
    completed: boolean
}

export const getDailyChallenge = () =>
    http.get<DailyChallengeData>('/daily-challenge/')

export const startDailyChallenge = () =>
    http.get('/daily-challenge/start')

export const submitDailyAnswer = (questionId: number, isCorrect: boolean) =>
    http.post<DailyChallengeSubmitResult>('/daily-challenge/submit', null, {
        params: { question_id: questionId, is_correct: isCorrect }
    })

export const getDailyStreak = () =>
    http.get<{ streak: number }>('/daily-challenge/streak')
