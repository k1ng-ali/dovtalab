import { createI18n } from 'vue-i18n'
import ru from './locales/ru'
import tg from './locales/tg'
import en from './locales/en'

export type AppLocale = 'ru' | 'tg' | 'en'

const savedLocale = localStorage.getItem('app_locale') as AppLocale | null

// Русская плюрализация: 'ноль | один | два-четыре | пять+'
function ruPluralRule(choice: number, choicesLength: number): number {
  if (choice === 0) return 0
  const teen = choice % 100 > 10 && choice % 100 < 20
  if (!teen && choice % 10 === 1) return 1
  if (!teen && choice % 10 >= 2 && choice % 10 <= 4) return 2
  return choicesLength < 4 ? 2 : 3
}

const i18n = createI18n({
  legacy: false,
  locale: savedLocale || 'ru',
  fallbackLocale: 'ru',
  messages: { ru, tg, en },
  pluralRules: { ru: ruPluralRule },
})

export function setLocale(locale: AppLocale) {
  i18n.global.locale.value = locale
  localStorage.setItem('app_locale', locale)
}

export function getLocale(): AppLocale {
  return i18n.global.locale.value as AppLocale
}

export default i18n
