export type BadgeType =
    | 'excellent'
    | 'expert'
    | 'marathon'
    | 'speedster'
    | 'beginner'
    | 'top10'
    | 'top100'
    | 'pro'

export interface BadgeInfo {
    label: string
    /** Инлайн SVG-строка — рендерится через v-html, работает в html2canvas */
    svg: string
}

// Все иконки — чистый SVG viewBox="0 0 24 24", fill="currentColor"
// currentColor подхватит :style="{ color: ... }" от родителя
export const BADGES: Record<BadgeType, BadgeInfo> = {
    excellent: {
        label: 'Отличник',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<path fill="none" stroke="currentColor" stroke-dasharray="34" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3l-2.35 5.76l-6.21 0.46l4.76 4.02l-1.49 6.04l5.29 -3.28M12 3l2.35 5.76l6.21 0.46l-4.76 4.02l1.49 6.04l-5.29 -3.28">
\t\t<animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="34;0" />
\t</path>
</svg>
`,
    },
    expert: {
        label: 'Знаток',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
\t\t<path d="M15.5 13a3.5 3.5 0 0 0-3.5 3.5v1a3.5 3.5 0 0 0 7 0v-1.8M8.5 13a3.5 3.5 0 0 1 3.5 3.5v1a3.5 3.5 0 0 1-7 0v-1.8" />
\t\t<path d="M17.5 16a3.5 3.5 0 0 0 0-7H17" />
\t\t<path d="M19 9.3V6.5a3.5 3.5 0 0 0-7 0M6.5 16a3.5 3.5 0 0 1 0-7H7" />
\t\t<path d="M5 9.3V6.5a3.5 3.5 0 0 1 7 0v10" />
\t</g>
</svg>
`,
    },
    marathon: {
        label: 'Марафонец',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<path fill="currentColor" d="M12.832 21.801c3.126-.626 7.168-2.875 7.168-8.69c0-5.291-3.873-8.815-6.658-10.434c-.619-.36-1.342.113-1.342.828v1.828c0 1.442-.606 4.074-2.29 5.169c-.86.559-1.79-.278-1.894-1.298l-.086-.838c-.1-.974-1.092-1.565-1.87-.971C4.461 8.46 3 10.33 3 13.11C3 20.221 8.289 22 10.933 22q.232 0 .484-.015c.446-.056 0 .099 1.415-.185" opacity=".5" />
\t<path fill="currentColor" d="M8 18.444c0 2.62 2.111 3.43 3.417 3.542c.446-.056 0 .099 1.415-.185C13.871 21.434 15 20.492 15 18.444c0-1.297-.819-2.098-1.46-2.473c-.196-.115-.424.03-.441.256c-.056.718-.746 1.29-1.215.744c-.415-.482-.59-1.187-.59-1.638v-.59c0-.354-.357-.59-.663-.408C9.495 15.008 8 16.395 8 18.445" />
</svg>
`,
    },
    speedster: {
        label: 'Скоростной',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<path fill="currentColor" d="M14.5 4h.005M14.5 4L12 10l5 2.898L9.5 20l2.5-6l-5-2.9zm0-2a2.02 2.02 0 0 0-1.379.551L5.624 9.646a2 2 0 0 0-.61 1.686c.072.626.437 1.182.982 1.498l3.482 2.021l-1.826 4.381a2.003 2.003 0 0 0 1.847 2.77c.498 0 .993-.186 1.375-.548l7.5-7.103a2 2 0 0 0 .61-1.685a2 2 0 0 0-.982-1.498L14.52 9.15l1.789-4.293A2 2 0 0 0 14.5 2" />
</svg>
`,
    },
    beginner: {
        label: 'Целеустремлённый',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<path fill="currentColor" d="M12 2a1 1 0 1 1 0 2a8 8 0 1 0 8 8a1 1 0 1 1 2 0c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2m0 4a1 1 0 1 1 0 2a4 4 0 1 0 4 4a1 1 0 1 1 2 0a6 6 0 1 1-6-6m6.571-3.9a.5.5 0 0 1 .5.5v1.83a.5.5 0 0 0 .5.499H21.4a.5.5 0 0 1 .5.5v.915l-1.888 1.888a2 2 0 0 1-1.414.586h-2l-3.89 3.889a1 1 0 0 1-1.414-1.414l3.89-3.889v-2a2 2 0 0 1 .585-1.414l1.89-1.89z" />
</svg>
`,
    },
    top10: {
        label: 'Топ-10',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5">
\t\t<path d="M5 21h14m-6.875-8.25H12m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0" />
\t\t<path d="m14.915 7.61l-1.107-2.228C13.019 3.794 12.625 3 12 3s-1.019.794-1.808 2.382L9.085 7.61C8.58 8.625 8.329 9.132 7.88 9.246a1 1 0 0 1-.095.02c-.458.07-.886-.3-1.741-1.037C4.012 6.476 2.997 5.6 2.38 5.949a1 1 0 0 0-.114.076c-.564.43-.17 1.716.616 4.29l1.166 3.813c.423 1.384.635 2.076 1.17 2.474S6.473 17 7.91 17h8.178c1.438 0 2.158 0 2.693-.398s.747-1.09 1.17-2.474l1.166-3.813c.787-2.574 1.18-3.86.616-4.29a1 1 0 0 0-.114-.076c-.617-.349-1.632.527-3.664 2.28c-.855.738-1.283 1.107-1.741 1.036a1 1 0 0 1-.095-.019c-.45-.114-.701-.621-1.205-1.635" />
\t</g>
</svg>
`,
    },
    top100: {
        label: 'Топ-100',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="2" d="m15.8 10.356l3.773-6.608A.5.5 0 0 0 19.139 3H14.58a1 1 0 0 0-.868.504L12 6.5m-3.798 3.855L4.427 3.748A.5.5 0 0 1 4.862 3H9.42a1 1 0 0 1 .868.504L12 6.5m0 0l1.543 2.7m0 0a6 6 0 1 0-3.086 11.6a6 6 0 0 0 3.086-11.6ZM13 15a1 1 0 1 1-2 0a1 1 0 0 1 2 0Z" />
</svg>
`,
    },
    pro: {
        label: 'Pro',
        svg: `<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24">
\t<path d="M0 0h24v24H0z" fill="none" />
\t<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2">
\t\t<path d="M6 5h12l3 5l-8.5 9.5a.7.7 0 0 1-1 0L3 10z" />
\t\t<path d="M10 12L8 9.8l.6-1" />
\t</g>
</svg>
`,
    },
}

export interface Badge {
    type: BadgeType
}

export interface UserPassport {
    user_id: number
    display_id: string

    first_name: string
    last_name: string | null
    username: string | null
    avatar_url: string | null

    is_pro: boolean
    is_creator: boolean

    total_points: number
    streak_days: number
    accuracy_percent: number
    total_quizzes_completed: number
    total_questions_answered: number

    rank: number
    total_ranked_users: number
    percentile: number | null

    badges: Badge[]
    joined_at: string | null
}
