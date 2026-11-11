#!/usr/bin/env node
/**
 * SEO-страницы после `vite build`: GitHub Pages отдаёт только статику, а SPA для поисковика —
 * пустой #app и экран входа. Поэтому публичная часть генерируется в статический HTML:
 *
 *   dist/tests/index.html              — каталог тестов (индексируется)
 *   dist/tests/<код>/index.html        — страница теста: описание, примеры вопросов, «Пройти тест»
 *   dist/quiz/<КОД>.html               — та же SPA, но с title/OG теста: ссылка отвечает 200
 *                                        и даёт превью в Telegram; canonical → /tests/<код>/
 *   dist/sitemap.xml, dist/robots.txt
 *
 * Данные — публичный API бэкенда (GET /public/quizzes, /public/quizzes/{hash}).
 * API недоступен — сборка не падает: пишутся только robots.txt и sitemap без тестов.
 *
 *   SEO_API_URL  (по умолчанию https://api.dovtalab.app/api/v1)
 *   SITE_URL     (по умолчанию https://dovtalab.app)
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const DIST = path.join(ROOT, 'dist')
const API = (process.env.SEO_API_URL ?? 'https://api.dovtalab.app/api/v1').replace(/\/$/, '')
const SITE = (process.env.SITE_URL ?? 'https://dovtalab.app').replace(/\/$/, '')
const PAGE_SIZE = 500
const MAX_QUIZZES = 5000
const CONCURRENCY = 8
const RELATED = 6
const BANNER = `${SITE}/dovtalab-banner.png`
const TELEGRAM_APP = 'https://t.me/Dovtalabbot/dovtalab_app'

// ─── Утилиты ──────────────────────────────────────────────────────────────────

const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

const clip = (s, n) => {
    const t = String(s ?? '').replace(/\s+/g, ' ').trim()
    return t.length > n ? t.slice(0, n - 1).trimEnd() + '…' : t
}

/** QZS+R6GO1KGYE5KB → qzs-r6go1kgye5kb (хеш — только A-Z, 0-9 и «+»). */
export const slugOf = (hash) => hash.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

const testsUrl = (q) => `${SITE}/tests/${slugOf(q.hash_code)}/`
// Хеш без кодирования: «+» в пути — обычный символ, и так совпадает с файлом quiz/<КОД>.html
const startUrl = (q) => `/quiz/${q.hash_code}?guest=1`

// JSON внутри <script> — экранируем «<», чтобы текст вопроса не закрыл тег
const jsonLd = (data) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`

function plural(n, one, few, many) {
    const m10 = n % 10, m100 = n % 100
    if (m10 === 1 && m100 !== 11) return one
    if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few
    return many
}
const questionsLabel = (n) => `${n} ${plural(n, 'вопрос', 'вопроса', 'вопросов')}`
const attemptsLabel = (n) => `${n} ${plural(n, 'прохождение', 'прохождения', 'прохождений')}`

async function getJson(url) {
    const res = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) })
    if (!res.ok) throw new Error(`${res.status} ${url}`)
    return res.json()
}

async function mapLimit(items, limit, fn) {
    const out = new Array(items.length)
    let next = 0
    const worker = async () => {
        while (next < items.length) {
            const i = next++
            out[i] = await fn(items[i], i)
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
    return out
}

async function write(rel, content) {
    const file = path.join(DIST, rel)
    await mkdir(path.dirname(file), { recursive: true })
    await writeFile(file, content, 'utf8')
}

// ─── Данные ───────────────────────────────────────────────────────────────────

async function fetchQuizzes() {
    const all = []
    for (let skip = 0; skip < MAX_QUIZZES; skip += PAGE_SIZE) {
        const page = await getJson(`${API}/public/quizzes?skip=${skip}&limit=${PAGE_SIZE}`)
        all.push(...page)
        if (page.length < PAGE_SIZE) break
    }
    // Разные хеши не должны давать один адрес страницы
    const seen = new Set()
    return all.filter((q) => {
        const slug = slugOf(q.hash_code)
        if (!slug || seen.has(slug)) return false
        seen.add(slug)
        return true
    })
}

async function fetchDetails(quizzes) {
    return mapLimit(quizzes, CONCURRENCY, async (q) => {
        try {
            return await getJson(`${API}/public/quizzes/${encodeURIComponent(q.hash_code)}`)
        } catch (e) {
            console.warn(`[seo] ${q.hash_code}: ${e.message} — страница без примеров вопросов`)
            return { ...q, sample_questions: [] }
        }
    })
}

// ─── Оформление статических страниц ───────────────────────────────────────────

const CSS = `
:root{--ground:#EEF3F8;--card:rgba(255,255,255,.82);--line:rgba(35,73,112,.10);--ink:#0F1B2D;--ink2:#3E4C5E;
--muted:#556274;--navy:#172E4A;--teal:#1F9E8F;--grad:linear-gradient(135deg,#234970 0%,#1F9E8F 100%)}
@media (prefers-color-scheme:dark){:root{--ground:#0E1622;--card:rgba(25,36,52,.86);--line:rgba(255,255,255,.08);
--ink:#EEF3F8;--ink2:#C3CEDB;--muted:#93A1B3;--navy:#EEF3F8}}
*{box-sizing:border-box}
body{margin:0;background:var(--ground);color:var(--ink);font:16px/1.5 Onest,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
a{color:inherit}
.wrap{max-width:880px;margin:0 auto;padding:16px}
.top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:8px 0 20px}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;text-decoration:none;color:var(--navy)}
.brand img{width:32px;height:32px}
.nav{display:flex;gap:16px;font-size:14px;font-weight:600}
.nav a{text-decoration:none;color:var(--muted)}
.nav a:hover{color:var(--ink)}
.card{background:var(--card);border:1px solid var(--line);border-radius:24px;padding:24px;
box-shadow:0 8px 30px rgba(23,46,74,.06);backdrop-filter:blur(18px)}
.crumbs{font-size:13px;color:var(--muted);margin:0 0 12px}
.crumbs a{text-decoration:none}
h1{margin:0 0 10px;font-size:clamp(26px,5vw,36px);line-height:1.15;letter-spacing:-.5px}
h2{margin:28px 0 12px;font-size:20px}
.lead{margin:0 0 18px;color:var(--ink2);font-size:17px}
.chips{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 22px;padding:0;list-style:none}
.chips li{padding:6px 12px;border-radius:999px;background:rgba(31,158,143,.12);color:var(--teal);font-size:13px;font-weight:700}
.actions{display:flex;flex-wrap:wrap;gap:10px}
.btn{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:0 22px;border-radius:16px;
font-weight:700;text-decoration:none;white-space:nowrap}
.btn--primary{background:var(--grad);color:#fff}
.btn--ghost{border:1px solid var(--line);background:transparent;color:var(--ink)}
.samples{margin:0;padding-left:22px;color:var(--ink2)}
.samples li{margin:0 0 10px}
.note{font-size:13px;color:var(--muted)}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px;margin:0;padding:0;list-style:none}
.tile{display:flex;flex-direction:column;gap:6px;height:100%;padding:16px;border-radius:20px;background:var(--card);
border:1px solid var(--line);text-decoration:none}
.tile:hover{border-color:var(--teal)}
.tile b{font-size:16px;line-height:1.3}
.tile span{font-size:13px;color:var(--muted)}
.tile p{margin:0;font-size:14px;color:var(--ink2)}
.search{width:100%;min-height:48px;margin:0 0 16px;padding:0 18px;border-radius:999px;border:1px solid var(--line);
background:var(--card);color:var(--ink);font:inherit}
.foot{margin:32px 0 8px;font-size:13px;color:var(--muted);display:flex;flex-wrap:wrap;gap:16px}
@media (max-width:480px){.card{padding:18px;border-radius:20px}.btn{flex:1}}
`

function layout({ title, description, canonical, body, ld = [], noindex = false }) {
    return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${esc(canonical)}">
${noindex ? '<meta name="robots" content="noindex">' : ''}
<link rel="icon" href="/Dovtalab-logo.png">
<meta name="theme-color" content="#EEF3F8">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Dovtalab">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:image" content="${BANNER}">
<meta property="og:locale" content="ru_RU">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${BANNER}">
${ld.map(jsonLd).join('\n')}
<style>${CSS}</style>
</head>
<body>
<div class="wrap">
<header class="top">
  <a class="brand" href="/"><img src="/Dovtalab-logo.png" alt="" width="32" height="32">Dovtalab</a>
  <nav class="nav"><a href="/tests/">Все тесты</a><a href="/">Приложение</a></nav>
</header>
<main>
${body}
</main>
<footer class="foot">
  <span>© Dovtalab</span>
  <a href="/tests/">Каталог тестов</a>
  <a href="/privacy">Политика конфиденциальности</a>
  <a href="${TELEGRAM_APP}" rel="noopener">Dovtalab в Telegram</a>
</footer>
</div>
</body>
</html>
`
}

function tile(q) {
    return `<li><a class="tile" href="/tests/${slugOf(q.hash_code)}/">
  <b>${esc(q.title)}</b>
  <span>${questionsLabel(q.questions_count)} · ${attemptsLabel(q.attempts_count)}</span>
  ${q.description ? `<p>${esc(clip(q.description, 140))}</p>` : ''}
</a></li>`
}

function quizPage(q, related) {
    const description = clip(
        q.description ? `${q.description}. ${questionsLabel(q.questions_count)} — пройдите тест онлайн бесплатно.`
            : `Тест «${q.title}»: ${questionsLabel(q.questions_count)}. Пройдите онлайн бесплатно в Dovtalab.`,
        160,
    )
    const samples = (q.sample_questions ?? []).map((s) => clip(s, 300)).filter(Boolean)
    const body = `
<article class="card">
  <p class="crumbs"><a href="/tests/">Тесты</a> / ${esc(clip(q.title, 60))}</p>
  <h1>${esc(q.title)}</h1>
  ${q.description ? `<p class="lead">${esc(q.description)}</p>` : ''}
  <ul class="chips">
    <li>${questionsLabel(q.questions_count)}</li>
    ${q.attempts_count ? `<li>${attemptsLabel(q.attempts_count)}</li>` : ''}
    <li>Бесплатно</li>
  </ul>
  <div class="actions">
    <a class="btn btn--primary" href="${esc(startUrl(q))}" rel="nofollow">Пройти тест</a>
    <a class="btn btn--ghost" href="${TELEGRAM_APP}" rel="noopener">Открыть в Telegram</a>
  </div>
  ${samples.length ? `
  <h2>Примеры вопросов</h2>
  <ol class="samples">${samples.map((s) => `<li>${esc(s)}</li>`).join('')}</ol>
  <p class="note">Варианты ответов, объяснения и статистика — в приложении после старта теста. Войти можно позже: результаты сохранятся.</p>` : ''}
</article>
${related.length ? `<h2>Похожие тесты</h2><ul class="grid">${related.map(tile).join('')}</ul>` : ''}
`
    return layout({
        title: `${clip(q.title, 60)} — тест онлайн | Dovtalab`,
        description,
        canonical: testsUrl(q),
        body,
        ld: [
            {
                '@context': 'https://schema.org',
                '@type': 'Quiz',
                name: q.title,
                description: q.description || description,
                url: testsUrl(q),
                inLanguage: ['ru', 'tg'],
                isAccessibleForFree: true,
                educationalUse: 'practice',
                ...(q.created_at ? { dateCreated: q.created_at } : {}),
                ...(samples.length ? {
                    hasPart: samples.map((text) => ({ '@type': 'Question', name: clip(text, 160), text })),
                } : {}),
                provider: { '@type': 'Organization', name: 'Dovtalab', url: SITE },
            },
            {
                '@context': 'https://schema.org',
                '@type': 'BreadcrumbList',
                itemListElement: [
                    { '@type': 'ListItem', position: 1, name: 'Тесты', item: `${SITE}/tests/` },
                    { '@type': 'ListItem', position: 2, name: q.title, item: testsUrl(q) },
                ],
            },
        ],
    })
}

function catalogPage(quizzes) {
    const body = `
<section class="card">
  <h1>Тесты для подготовки к экзаменам</h1>
  <p class="lead">Тесты к ММТ и школьным экзаменам с реальными форматами заданий. Проходите онлайн без регистрации — прогресс сохранится, когда войдёте через Telegram.</p>
  <div class="actions"><a class="btn btn--primary" href="/">Открыть приложение</a></div>
</section>
<h2>Все тесты · ${quizzes.length}</h2>
<input class="search" type="search" placeholder="Найти тест" aria-label="Найти тест" id="q">
<ul class="grid" id="list">${quizzes.map(tile).join('')}</ul>
<script>
(function(){var q=document.getElementById('q'),items=[].slice.call(document.querySelectorAll('#list > li'));
q.addEventListener('input',function(){var v=q.value.trim().toLowerCase();
items.forEach(function(li){li.hidden=v&&li.textContent.toLowerCase().indexOf(v)<0;});});})();
</script>
`
    return layout({
        title: 'Тесты онлайн для подготовки к ММТ и экзаменам | Dovtalab',
        description: `Каталог из ${quizzes.length} бесплатных тестов: биология, химия, история, языки и другие предметы. Проходите онлайн, следите за прогрессом.`,
        canonical: `${SITE}/tests/`,
        body,
        ld: [{
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: 'Тесты Dovtalab',
            numberOfItems: quizzes.length,
            itemListElement: quizzes.slice(0, 100).map((q, i) => ({
                '@type': 'ListItem', position: i + 1, url: testsUrl(q), name: q.title,
            })),
        }],
    })
}

/** SPA-оболочка с мета-тегами теста — для превью ссылки /quiz/КОД (Telegram, соцсети). */
function spaShell(template, q) {
    const title = `${clip(q.title, 60)} — тест | Dovtalab`
    const description = clip(q.description || `Тест «${q.title}»: ${questionsLabel(q.questions_count)}.`, 160)
    const setMeta = (html, attr, key, value) => html.replace(
        new RegExp(`(<meta\\s+${attr}="${key}"\\s+content=")[^"]*(")`), `$1${esc(value)}$2`,
    )
    let html = template.replace(/<title>[^<]*<\/title>/, `<title>${esc(title)}</title>`)
    html = setMeta(html, 'name', 'description', description)
    html = setMeta(html, 'property', 'og:title', title)
    html = setMeta(html, 'property', 'og:description', description)
    html = setMeta(html, 'property', 'og:url', testsUrl(q))
    html = setMeta(html, 'name', 'twitter:title', title)
    html = setMeta(html, 'name', 'twitter:description', description)
    html = html.replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${esc(testsUrl(q))}">`)
    return html
}

function sitemap(quizzes) {
    const today = new Date().toISOString().slice(0, 10)
    const url = (loc, priority) => `  <url><loc>${esc(loc)}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[url(`${SITE}/`, '1.0'), url(`${SITE}/tests/`, '0.9'), url(`${SITE}/privacy`, '0.2'),
        ...quizzes.map((q) => url(testsUrl(q), '0.8'))].join('\n')}
</urlset>
`
}

const robots = () => `User-agent: *
Allow: /
# Кнопка «Пройти тест» создаёт гостевой аккаунт — роботам не нужно
Disallow: /*?guest=

Sitemap: ${SITE}/sitemap.xml
`

// ─── Сборка ───────────────────────────────────────────────────────────────────

async function main() {
    await write('robots.txt', robots())

    let quizzes = []
    try {
        quizzes = await fetchDetails(await fetchQuizzes())
    } catch (e) {
        console.warn(`[seo] API недоступен (${e.message}) — страницы тестов не сгенерированы`)
        await write('sitemap.xml', sitemap([]))
        return
    }

    const template = await readFile(path.join(DIST, 'index.html'), 'utf8')
    // Популярные первыми (так отдаёт API) — они же «похожие тесты» на страницах
    const popular = quizzes.slice(0, RELATED + 1)

    await write('tests/index.html', catalogPage(quizzes))
    await mapLimit(quizzes, CONCURRENCY, async (q) => {
        const related = popular.filter((r) => r.hash_code !== q.hash_code).slice(0, RELATED)
        await write(`tests/${slugOf(q.hash_code)}/index.html`, quizPage(q, related))
        // GitHub Pages отдаёт /quiz/КОД из quiz/КОД.html без редиректа на «/» в конце
        await write(`quiz/${q.hash_code}.html`, spaShell(template, q))
    })
    await write('sitemap.xml', sitemap(quizzes))
    console.log(`[seo] ${quizzes.length} тестов → dist/tests, dist/quiz, sitemap.xml`)
}

main().catch((e) => {
    console.error('[seo] ошибка генерации:', e)
    process.exit(1)
})
