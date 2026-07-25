export interface Banner {
    id: number
    title: string
    description?: string
    cta_text?: string
    cta_color?: string
    background_type: 'gradient' | 'image'
    background_value: string
    action_type: 'url' | 'quiz' | 'none'
    action_value?: string
    order: number
    is_active: boolean
}
