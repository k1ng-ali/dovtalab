export type UserRole = "creator" | "pro" | "admin"

export interface User {
    id: number
    first_name: string,
    username: string,
    last_name: string,
    avatar_url: string,
}
export interface Config {
    language: string,
    is_active: boolean,
    timer: boolean,
    quiz_time: number,
    quiz_count: number,
    joined_at: Date | string | null,
}

export interface UserProfile {
    user: User,
    config: Config,
    roles: UserRole[],
}