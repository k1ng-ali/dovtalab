import { http } from '@/shared/api/http.ts'
import type { League } from './types.ts'

export const getMyLeague = () => http.get<League>('/leagues/me')
