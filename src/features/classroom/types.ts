// ─── Классы и задания учителя — зеркало app/schemas/classroom.py ──────────────
import type { QuestionPayloadPublic, QuestionPublic, UserAnswerPayload } from '@/features/quizPage/types.ts'

export type StudentAssignmentStatus = 'not_started' | 'in_progress' | 'completed' | 'late' | 'missed'
export type ShowAnswers = 'immediately' | 'after_finish' | 'after_due' | 'never'

export interface StudentClassroom {
    id: number
    title: string
    description: string | null
    teacher_name: string | null
    teacher_avatar_url: string | null
    joined_at: string
    pending_assignments_count: number
}

export interface ClassroomPreview {
    id: number
    title: string
    description: string | null
    teacher_name: string | null
    students_count: number
    is_member: boolean
}

export interface StudentAssignment {
    id: number
    classroom_id: number
    classroom_title: string
    teacher_name: string | null
    quiz_id: number
    quiz_title: string | null
    title: string
    description: string | null
    mode: 'exam' | 'practice'
    question_limit: number | null
    time_limit_min: number | null
    max_attempts: number | null
    starts_at: string | null
    due_at: string | null
    allow_late: boolean
    show_answers: ShowAnswers
    total_questions: number
    student_status: StudentAssignmentStatus
    attempts_used: number
    best_score: number | null
    can_start: boolean
    can_view_result: boolean
    active_attempt_id: number | null
    active_attempt_expires_at: string | null
    last_finished_at: string | null
}

export interface AssignmentQuestion extends QuestionPublic {
    assignment_id: number
    expires_at: string | null
    hide_feedback: boolean
    answered_count: number
}

export interface AssignmentFinish {
    assignment_id: number
    quiz_attempt_id: number
    correct_count: number | null
    total_count: number
    total_questions: number
    score: number | null
    can_view_result: boolean
}

export interface AnswerReviewItem {
    question_id: number
    order: number | null
    text: string
    type: string
    image_url: string | null
    payload: QuestionPayloadPublic
    answer: UserAnswerPayload | null
    is_correct: boolean | null
    correct_answer: UserAnswerPayload | null
    answered_at: string | null
}

export interface AttemptReview {
    assignment_id: number
    quiz_attempt_id: number
    user_id: number
    student_name: string | null
    score: number | null
    correct_count: number | null
    total_count: number | null
    total_questions: number
    duration_sec: number | null
    started_at: string | null
    finished_at: string | null
    is_late: boolean
    items: AnswerReviewItem[]
}
