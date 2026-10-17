// Оформление Telegram Mini App под наш дизайн: шапка, фон и нижняя панель Telegram
// красятся в цвет фона приложения, а не в тему пользователя. Тема Telegram на наши
// токены не влияет — дизайн пока только светлый.
// Безопасные зоны Telegram (--tg-safe-area-inset-*, --tg-content-safe-area-inset-*)
// скрипт telegram-web-app.js сам выставляет на <html>, их учитывают --sat/--sab в style.css.

const GROUND = '#E9EFF4' // = --c-ground

export function setupTelegramChrome() {
    const twa = (window as any)?.Telegram?.WebApp
    if (!twa?.initData) return

    const atLeast = (v: string) => typeof twa.isVersionAtLeast === 'function' && twa.isVersionAtLeast(v)

    const applyColors = () => {
        if (atLeast('6.1')) {
            twa.setHeaderColor(GROUND)
            twa.setBackgroundColor(GROUND)
        }
        if (atLeast('7.10')) twa.setBottomBarColor(GROUND)
    }

    twa.ready()
    twa.expand()
    applyColors()

    // При смене темы Telegram сбрасывает свои цвета — возвращаем наши
    twa.onEvent('themeChanged', applyColors)
}
