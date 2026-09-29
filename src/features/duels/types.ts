export interface DuelParticipant {
  user_id: number
  status: string
  is_ready: boolean
}

export interface DuelRoom {
  id: number
  quiz_id: number
  quiz_title: string
  creator_id: number
  status: 'waiting' | 'ready' | 'active' | 'finished' | 'cancelled' | string
  question_count: number
  participant_count: number
  participants: DuelParticipant[]
  created_at: string
  expires_at: string | null
}

export interface DuelCreatePayload {
  quiz_id: number
  question_count: number
}

export interface DuelQuestion {
  id: number
  text: string
  type: string
  payload: Record<string, unknown>
  order: number | null
  round_number: number
  total_questions: number
}

export interface DuelGameState {
  duel: DuelRoom
  question: DuelQuestion
}

export interface DuelSubmitResult {
  is_correct: boolean
  response_time_ms: number
  waiting_for_opponent: boolean
  duel: DuelRoom
  question: DuelQuestion | null
  final_result: DuelResult | null
}

export interface DuelScore {
  user_id: number
  correct_count: number
  total_response_time_ms: number
  rank: number
}

export interface DuelResult {
  duel_id: number
  winner_user_id: number | null
  scores: DuelScore[]
}