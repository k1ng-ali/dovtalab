import { createI18n } from 'vue-i18n'
import ru from './locales/ru'
import tg from './locales/tg'
import en from './locales/en'

export type AppLocale = 'ru' | 'tg' | 'en'

const savedLocale = localStorage.getItem('app_locale') as AppLocale | null

const i18n = createI18n({
  legacy: false,
  locale: savedLocale || 'ru',
  fallbackLocale: 'ru',
  messages: { ru, tg, en },
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem('app_locale', locale)
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale
}

export default i18n
