// ─── Start Quiz response ──────────────────────────────────────────────────────

export interface StartQuizResponse {
    quiz_attempt_id: number
}

// ─── Quiz Mode ────────────────────────────────────────────────────────────────

export type QuizMode = 'practice' | 'exam' | 'adaptive'

// ─── Context response ─────────────────────────────────────────────────────────

export interface ContextIn {
    id: number
    title: string
    text: string
    rule?: string
    order: number
    detail?: {
        questions: number
    }
}

// ─── Attempt ───────────────────────────────────────────────────

export interface AttemptResult {
    is_correct: boolean
    correct_answer?: UserAnswerPayload
    explanation?: string
}

// UserAnswerPayload — то что фронт шлёт на POST /attempts/{id}/submit
// Поля должны точно совпадать с Pydantic-схемами бэкенда (SingleChoice, MultipleChoice, Matching, InputText)
export type UserAnswerPayload =
    | {
    type: "single_choice"
    selected_option_id: number
}
    | {
    type: "multiple_choice"
    selected_option_ids: number[]
}
    | {
    type: "matching"
    pairs: Record<string, number>
}
    | {
    // InputText на бэкенде: поле называется answer_text, не value
    type: "input"
    answer_text: string
}

export const isInputAnswer = (a?: UserAnswerPayload): a is Extract<UserAnswerPayload, { type: 'input' }> =>
    a?.type === 'input'

export const isMatchingAnswer = (a?: UserAnswerPayload): a is Extract<UserAnswerPayload, { type: 'matching' }> =>
    a?.type === 'matching'

export const isMultipleAnswer = (a?: UserAnswerPayload): a is Extract<UserAnswerPayload, { type: 'multiple_choice' }> =>
    a?.type === 'multiple_choice'

export const isSingleAnswer = (a?: UserAnswerPayload): a is Extract<UserAnswerPayload, { type: 'single_choice' }> =>
    a?.type === 'single_choice'

export interface SubmitAnswer {
    id: number // attempt_id
    answer: UserAnswerPayload
}

export interface QuestionAttemptOut {
    id: number
    quiz_attempt_id: number
    question_id: number
    attempt_at: string
    answered_at?: string
    answer?: UserAnswerPayload
    result?: AttemptResult
}

export interface Progress {
    correct_count: number
    earned_points: number
    is_finished: boolean
    score: number
    total_count: number
    total_questions: number
}

export interface SubmitIn {
    attempt: QuestionAttemptOut
    progress: Progress
}

// ─── Quiz response ────────────────────────────────────────────────────────────

export interface UserProgressSummary {
    total_questions: number
    answered_count: number       // всего отвечено в текущей попытке
    correct_count: number        // правильных в текущей попытке
    completed_attempts: number   // сколько раз полностью завершён
    best_score: number | null    // лучший score (0–100)
}

export interface QuizIn {
    id: number
    hash_code: string
    title: string
    description: string
    time_limit: number
    contexts?: ContextIn[]
    created_at: string
    on_fav?: boolean,
    details?: {
        type?: "single_choice" | "multiple_choice" | "matching" | "input"
        stat?: AttemptStat,
        total_questions?: number
        contexts_count?: number
        progress?: UserProgressSummary
    }
}

// --- QUIZ STAT ----------------------------------------------

export interface AttemptStat {
    quiz_attempt_id: number,
    quiz_id: number,
    quiz_title: string,
    correct_count: number,
    total_count: number,
    score: number,
    duration_sec: number,
    started_at: Date,
    finished_at: Date,
    accuracy_percent: number
}

export interface QuizStat {
    quiz_id: number,
    total_questions: number,
    current_attempt_stat: AttemptStat,
    completed_attempt_stats: [AttemptStat],
}

// ─── Question payload types ───────────────────────────────────────────────────

export type QuestionType =
    | "single_choice"
    | "multiple_choice"
    | "matching"
    | "input"

export interface QuestionBase {
    id: number
    text: string
    type: QuestionType
    context_id?: number | null
    image_url?: string
    order: number
}

// Payload-интерфейсы совпадают с QuestionPayloadOut бэкенда:
// бэкенд всегда шлёт обёртку { single_choice: {...} | null, multiple_choice: {...} | null, ... }
export interface QuestionPayloadPublic {
    single_choice?: {
        options: { id: number; text: string; image_url?: string }[]
        shuffle?: boolean
    }
    multiple_choice?: {
        options: { id: number; text: string; image_url?: string }[]
        min_choices?: number
        max_choices?: number
        shuffle?: boolean
    }
    matching?: {
        left:  { id: number; text: string }[]
        right: { id: number; text: string }[]
    }
    input?: {
        numeric: boolean
        case_sensitive?: boolean
    }
}

export interface QuestionPublic extends QuestionBase {
    payload: QuestionPayloadPublic
    attempt: QuestionAttemptOut
}