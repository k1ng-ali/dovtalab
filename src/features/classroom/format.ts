// ─── Хелперы отображения заданий ──────────────────────────────────────────────
import i18n from '@/shared/i18n'
import type { StudentAssignment } from './types.ts'

const { t } = i18n.global

export function formatDateTime(iso: string | null | undefined) {
    if (!iso) return '—'
    return new Date(iso).toLocaleString(i18n.global.locale.value === 'en' ? 'en-GB' : 'ru-RU', {
        day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
    })
}

/** «осталось 2 д» / «срок истёк» / «без срока». */
export function dueLeft(iso: string | null | undefined) {
    if (!iso) return t('classes.noDue')
    const diff = new Date(iso).getTime() - Date.now()
    if (diff < 0) return t('classes.overdue')
    const h = Math.floor(diff / 3_600_000)
    if (h >= 24) return t('classes.dueLeftDays', { n: Math.floor(h / 24) })
    if (h >= 1) return t('classes.dueLeftHours', { n: h })
    return t('classes.dueLeftMin', { n: Math.max(1, Math.floor(diff / 60_000)) })
}

export function isUrgent(iso: string | null | undefined) {
    if (!iso) return false
    const diff = new Date(iso).getTime() - Date.now()
    return diff > 0 && diff < 24 * 3_600_000
}

export function attemptsText(a: StudentAssignment) {
    return a.max_attempts
        ? t('classes.attempts', { used: a.attempts_used, max: a.max_attempts })
        : t('classes.attemptsUnlimited', { used: a.attempts_used })
}

export function questionsCount(a: StudentAssignment) {
    return a.question_limit && a.question_limit < a.total_questions ? a.question_limit : a.total_questions
}

/** Ошибка API (detail) → понятный текст. */
export function assignmentError(e: unknown, fallback = t('classes.startFailed')) {
    const detail = (e as { response?: { data?: { detail?: unknown } } })?.response?.data?.detail
    const map: Record<string, string> = {
        'Deadline has passed': t('classes.errDeadline'),
        'No attempts left': t('classes.errNoAttempts'),
        'Assignment is closed': t('classes.errClosed'),
        'Assignment has not started yet': t('classes.errNotOpen'),
        'Time limit reached': t('classes.errTimeUp'),
        'Classroom not found': t('classes.notFound'),
        'Joining is disabled for this classroom': t('classes.joinDisabled'),
        'Assignment not found': t('classes.notFoundAssignment'),
        'Results are hidden by the teacher': t('classes.resultHidden'),
    }
    return typeof detail === 'string' ? (map[detail] ?? detail) : fallback
}

/** Telegram Mini App: start_param вида class_CODE → код класса. */
export function classCodeFromStartParam(): string | null {
    const param = (window as any)?.Telegram?.WebApp?.initDataUnsafe?.start_param as string | undefined
    if (param && /^class_[A-Za-z0-9]{4,16}$/.test(param)) return param.slice('class_'.length).toUpperCase()
    return null
}
