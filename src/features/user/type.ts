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
    is_pro: boolean,
    timer: boolean,
    is_creator: boolean,
    quiz_time: number,
    quiz_count: number,
    joined_at: Date
}
export interface UserProfile {
    user: User,
    config: Config,
}