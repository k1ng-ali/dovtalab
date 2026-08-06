export interface WeeklyActivity {
    correct: number[]   // 7 элементов: [6 дней назад ... сегодня]
    incorrect: number[] // 7 элементов
}

export interface UserStats {
    total_quizzes_completed: number
    total_questions_answered: number
    correct_answers: number
    accuracy_percent: number
    total_points: number
    streak_days: number
    weekly_activity: WeeklyActivity
}

export interface AttemptStat {
    quiz_attempt_id: number
    quiz_id: number
    quiz_title: string
    correct_count?: number
    total_count?: number
    score?: number
    duration_sec?: number
    started_at: string
    finished_at?: string
    accuracy_percent?: number
    questions_count?: number
}
