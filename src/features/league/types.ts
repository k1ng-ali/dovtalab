// Зеркало app/schemas/league.py (GET /leagues/me)

export type LeagueZone = 'promote' | 'demote'
export type LeagueResult = 'promoted' | 'stayed' | 'demoted'

export interface LeagueMember {
  rank: number
  user_id: number
  first_name: string | null
  username: string | null
  avatar_url: string | null
  points: number              // баллы платформы за эту неделю
  is_me: boolean
  zone: LeagueZone | null     // где окажется по итогам недели
}

export interface LeagueLastWeek {
  week_start: string
  tier: number
  tier_name: string
  rank: number
  points: number
  result: LeagueResult
  new_tier: number
  new_tier_name: string
}

export interface League {
  week_start: string          // понедельник (по Душанбе), YYYY-MM-DD
  ends_at: string             // конец недели, ISO UTC
  tier: number                // 0 — Бронза … 6 — Алмаз
  tier_name: string
  joined: boolean             // false — на этой неделе ещё нет баллов
  group_size: number
  promote_count: number
  demote_count: number
  members: LeagueMember[]
  me: LeagueMember | null
  last_week: LeagueLastWeek | null
}
