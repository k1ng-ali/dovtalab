import { http } from '@/shared/api/http'
import type { UserPassport } from './types'

export const getPassport = () =>
    http.get<UserPassport>('/users/me/passport')
