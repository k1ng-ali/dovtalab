export interface LeaderboardItem {
    rank: number,
    user_id: number,
    first_name: string,
    username: string,
    avatar_url: string,
    total_points: number
}

export interface Leaderboard {
    leaders: LeaderboardItem[];
}

export type Period = "all" | "month" | "week"
