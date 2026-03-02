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
    score?: number
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

// ─── Quiz response ────────────────────────────────────────────────────────────

export interface QuizIn {
    id: number
    hash_code: string
    title: string
    description: string
    time_limit: number
    contexts?: ContextIn[]
    created_at: string
    details?: {
        type?: "single_choice" | "multiple_choice" | "matching" | "input"
        total?: number
        completed?: number
    }
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