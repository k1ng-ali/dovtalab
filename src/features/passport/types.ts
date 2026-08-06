export type BadgeType =
    | 'excellent'
    | 'expert'
    | 'marathon'
    | 'speedster'
    | 'beginner'
    | 'top10'
    | 'top100'
    | 'pro'

export interface Badge {
    type: BadgeType
    label: string
    emoji: string
}

export interface UserPassport {
    user_id: number
    display_id: string

    first_name: string
    last_name: string | null
    username: string | null
    avatar_url: string | null

    is_pro: boolean
    is_creator: boolean

    total_points: number
    streak_days: number
    accuracy_percent: number
    total_quizzes_completed: number
    total_questions_answered: number

    rank: number
    total_ranked_users: number
    percentile: number | null

    badges: Badge[]
    joined_at: string | null
}
