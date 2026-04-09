export interface UserStats{
    total_quizzes_completed: number,
    total_questions_answered: number,
    correct_answers: number,
    accuracy_percent: number,
}

export interface AttemptStat {
    quiz_attempt_id: number,
    quiz_id: number,
    quiz_title: string,
    correct_count?: number,
    total_count?: number,
    score?: number,
    duration_sec?: number,
    started_at: Date,
    finished_at?: Date,
    accuracy_percent?: number
    questions_count?: number,
}
