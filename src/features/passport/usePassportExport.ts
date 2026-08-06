import { ref } from 'vue'
import html2canvas from 'html2canvas'
import { http } from '@/shared/api/http'

// Fallback-аватар — та же иконка что в PassportCard, как data URL
const FALLBACK_AVATAR_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 110 130" width="110" height="130">
  <rect width="110" height="130" rx="10" fill="#2A4060"/>
  <circle cx="55" cy="45" r="22" fill="#C8A84B" opacity="0.9"/>
  <path d="M10 118 C10 88 100 88 100 118" fill="#C8A84B" opacity="0.9"/>
</svg>`
const FALLBACK_AVATAR_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(FALLBACK_AVATAR_SVG)}`

/**
 * Скачивает аватар через прокси-эндпоинт бэкенда (обход CORS t.me).
 * При любой ошибке возвращает fallback data URL.
 */
async function fetchAvatarViaProxy(): Promise<string> {
    try {
        const resp = await http.get('/users/me/avatar-proxy', {
            responseType: 'blob',
        })
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.onload  = () => resolve(reader.result as string)
            reader.onerror = () => resolve(FALLBACK_AVATAR_URL)
            reader.readAsDataURL(resp.data)
        })
    } catch {
        return FALLBACK_AVATAR_URL
    }
}

/**
 * Заменяет src аватара в клоне на data URL через прокси.
 * При любой ошибке подставляет fallback-иконку.
 * Также фиксирует размеры fallback-блока если реального фото нет.
 */
async function inlineAvatar(root: HTMLElement): Promise<void> {
    // Случай 1: есть реальное фото — заменяем src на проксированный data URL
    const avatarImg = root.querySelector<HTMLImageElement>('img.passport__avatar')
    if (avatarImg) {
        const src = avatarImg.getAttribute('src') || ''
        if (src && !src.startsWith('data:') && !src.startsWith('blob:')) {
            avatarImg.src = await fetchAvatarViaProxy()
        }
        avatarImg.style.width        = '110px'
        avatarImg.style.height       = '130px'
        avatarImg.style.objectFit    = 'cover'
        avatarImg.style.borderRadius = '10px'
        avatarImg.style.display      = 'block'
        avatarImg.style.flexShrink   = '0'
        return
    }

    // Случай 2: нет фото — фиксируем размер fallback-div
    const fallbackDiv = root.querySelector<HTMLElement>('.passport__avatar--fallback')
    if (fallbackDiv) {
        fallbackDiv.style.width        = '110px'
        fallbackDiv.style.height       = '130px'
        fallbackDiv.style.minWidth     = '110px'
        fallbackDiv.style.borderRadius = '10px'
        fallbackDiv.style.flexShrink   = '0'
        fallbackDiv.style.display      = 'flex'
        fallbackDiv.style.alignItems   = 'center'
        fallbackDiv.style.justifyContent = 'center'

        const icon = fallbackDiv.querySelector<HTMLImageElement>('img')
        if (icon) {
            icon.style.width  = '56px'
            icon.style.height = '56px'
        }
    }
}

export function usePassportExport() {
    const exporting = ref(false)

    const toBlob = async (el: HTMLElement): Promise<Blob> => {
        const clone = el.cloneNode(true) as HTMLElement
        clone.style.position      = 'fixed'
        clone.style.top           = '-9999px'
        clone.style.left          = '-9999px'
        clone.style.zIndex        = '-1'
        clone.style.pointerEvents = 'none'
        document.body.appendChild(clone)

        try {
            // Заменяем только аватар — через наш прокси
            await inlineAvatar(clone)

            const canvas = await html2canvas(clone, {
                scale: 3,
                useCORS: false,
                allowTaint: false,
                backgroundColor: null,
                logging: false,
                width:  clone.offsetWidth,
                height: clone.offsetHeight,
            })

            return new Promise((resolve, reject) => {
                canvas.toBlob(
                    blob => blob ? resolve(blob) : reject(new Error('toBlob failed')),
                    'image/png',
                )
            })
        } finally {
            document.body.removeChild(clone)
        }
    }

    const download = async (el: HTMLElement, filename = 'dovtalab-passport.png') => {
        exporting.value = true
        try {
            const blob = await toBlob(el)
            const url  = URL.createObjectURL(blob)
            const a    = document.createElement('a')
            a.href     = url
            a.download = filename
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } finally {
            exporting.value = false
        }
    }

    const share = async (el: HTMLElement) => {
        exporting.value = true
        try {
            const blob = await toBlob(el)
            const file = new File([blob], 'dovtalab-passport.png', { type: 'image/png' })

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title: 'Мой паспорт Dovtalab',
                    text: 'Посмотри мой прогресс на Dovtalab! 🚀',
                    files: [file],
                })
            } else {
                await download(el)
            }
        } finally {
            exporting.value = false
        }
    }

    return { exporting, share, download }
}
