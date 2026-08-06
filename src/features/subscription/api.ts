import { http } from "@/shared/api/http.ts"

export interface Plan {
    id: string
    name: string
    price: number
    discount_percent: number
    duration_days: number
    features: string[]
    available: boolean
    final_price: number
}

export interface SubscriptionData {
    subscription: {
        id: number
        plan: string
        status: string
        expires_at: string
        days_remaining: number
    } | null
    has_pro: boolean
}

export const getPlans = () => http.get<{ plans: Plan[] }>('/subscription/plans')
export const getSubscription = () => http.get<SubscriptionData>('/subscription/')
export const activateSubscription = (plan: string = 'pro') =>
    http.post('/subscription/activate', null, { params: { plan } })
