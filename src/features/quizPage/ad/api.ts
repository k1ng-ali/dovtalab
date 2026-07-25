import { http } from '@/shared/api/http'
import type { Banner } from './types'

export const fetchBanners = () => http.get<Banner[]>('/banners/')
