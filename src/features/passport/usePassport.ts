import { ref } from 'vue'
import * as api from './api'
import type { UserPassport } from './types'
import i18n from '@/shared/i18n'

const { t } = i18n.global

const passport   = ref<UserPassport | null>(null)
const loading    = ref(false)
const error      = ref<string | null>(null)

export function usePassport() {
    const fetch = async (force = false) => {
        if (passport.value && !force) return passport.value
        loading.value = true
        error.value   = null
        try {
            const { data } = await api.getPassport()
            passport.value = data
            return data
        } catch (e: any) {
            error.value = e?.response?.data?.detail ?? t('passport.loadError')
            return null
        } finally {
            loading.value = false
        }
    }

    return { passport, loading, error, fetch }
}
