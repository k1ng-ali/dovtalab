import { http } from "@/shared/api/http.ts"

export interface ReviewPending {
    pending: number
    total_in_queue: number
    quiz_id: number
}

export const getReviewPending = (quizId: number) =>
    http.get<ReviewPending>(`/review/pending`, { params: { quiz_id: quizId } })

export const startReview = (quizId: number) =>
    http.get(`/review/start`, { params: { quiz_id: quizId } })
