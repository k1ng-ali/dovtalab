// Детерминированный цвет плашки предмета по id (вместо одной иконки-книжки на все тесты)
const TINTS = [
    { bg: 'rgba(78, 190, 194, 0.22)', color: '#0B6B70' },
    { bg: 'rgba(35, 73, 112, 0.12)', color: '#234970' },
    { bg: 'rgba(232, 131, 58, 0.16)', color: '#9A4A0C' },
    { bg: 'rgba(120, 90, 180, 0.16)', color: '#5B3F8C' },
    { bg: 'rgba(21, 128, 61, 0.12)', color: '#15803D' },
]

export function subjectTint(id: number | null | undefined) {
    return TINTS[Math.abs(id ?? 0) % TINTS.length]!
}

/** Две буквы из названия теста: «Биология 2026» → «Би», «Забони Тоҷикӣ» → «ЗТ». */
export function subjectInitials(title: string | null | undefined) {
    const words = (title ?? '').replace(/[()«»"]/g, ' ').split(/\s+/).filter(w => /^\p{L}/u.test(w))
    if (words.length >= 2 && /^\p{Lu}/u.test(words[1]!)) return (words[0]![0]! + words[1]![0]!).toUpperCase()
    const w = words[0] ?? '?'
    return w.slice(0, 2).replace(/^./, c => c.toUpperCase())
}
