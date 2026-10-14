# 🎓 Dovtalab — Фронтенд

> **Образовательная платформа** для подготовки к экзаменам через интерактивные квизы.
> Одна кодовая база: веб-приложение, Telegram Mini App и Android-приложение (Capacitor).

![Vue](https://img.shields.io/badge/Vue-3.5-4FC08D?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-3-FFD859?logo=pinia&logoColor=black)
![Capacitor](https://img.shields.io/badge/Capacitor-8-119EFF?logo=capacitor&logoColor=white)

---

## 📋 Содержание

- [Возможности](#-возможности)
- [Стек технологий](#️-стек-технологий)
- [Структура проекта](#-структура-проекта)
- [Быстрый старт](#-быстрый-старт)
- [Переменные окружения](#️-переменные-окружения)
- [Авторизация](#-авторизация)
- [Архитектура приложения](#️-архитектура-приложения)
- [Страницы и функциональность](#-страницы-и-функциональность)
- [Дуэли](#️-дуэли)
- [Типы вопросов](#-типы-вопросов)
- [Android](#-android)
- [Деплой](#-деплой)

---

## ✨ Возможности

- 🔐 **Авторизация через Telegram** — Mini App (initData), OAuth 2.0 + PKCE в браузере, нативный Telegram Login SDK на Android
- 🔄 **Тихое обновление сессии** — автоматический рефреш access token без разрыва работы
- 📝 **4 типа вопросов** — одиночный выбор, множественный выбор, сопоставление, ввод текста
- 🧠 **Режимы прохождения** — по порядку, быстрый тест (exam), адаптивное обучение по слабым темам
- 🗺️ **Карта знаний** — точность по темам квиза и уровень пользователя
- 🔁 **Повторение** — интервальное повторение ошибок
- 📅 **Ежедневный вызов** — 10 вопросов в день и серия дней (streak)
- ⚔️ **Дуэли 1×1** — лобби, комната ожидания, раунды с таймером, результаты в реальном времени через WebSocket
- 🏆 **Лидерборд** — топ-50 с подсветкой и sticky-карточкой текущего пользователя
- 🪪 **Паспорт** — карточка со статистикой и бейджами, экспорт в картинку и «Поделиться»
- 📈 **Статистика** — график активности за неделю, кольцо точности, streak, баллы
- 💎 **Подписка Pro** — баннер и модалка оформления
- 📣 **Баннеры** — карусель на странице тестов, управляется из админки
- 🌍 **Три языка** — русский, таджикский, английский (vue-i18n)
- 📱 **Edge-to-edge на Android** — контент рисуется под системными панелями, отступы через safe area
- 📶 **Офлайн-режим** — экран ошибки подключения и баннер при потере сети

---

## 🛠️ Стек технологий

| Компонент | Технология |
|-----------|-----------|
| UI-фреймворк | Vue 3.5 (Composition API, `<script setup lang="ts">`) |
| Язык | TypeScript 5.9 (strict) |
| Сборщик | Vite 8 |
| Роутинг | Vue Router 5 |
| Стейт-менеджер | Pinia 3 |
| HTTP-клиент | Axios |
| UI-компоненты | ant-design-vue 4 (модалки, уведомления) |
| Локализация | vue-i18n 11 |
| CSS | SCSS (scoped), glassmorphism |
| Анимации | GSAP |
| Иконки | `@kalimahapps/vue-icons`, `@iconify-vue/*` |
| Нативная платформа | Capacitor 8 (Android) |
| Экспорт паспорта | html2canvas, qrcode |
| Безопасность OAuth | PKCE (S256) |

---

## 📁 Структура проекта

Feature-sliced: `app` → `pages` → `features` → `shared`.

```
src/
├── App.vue                     # Корневой компонент: сплэш, инициализация, авторизация, deep links
├── main.ts                     # Точка входа
├── style.css                   # Глобальные токены: цвета, breakpoints, safe area (--sat/--sab/...)
│
├── app/
│   ├── router.ts               # Маршруты
│   └── store.ts
│
├── pages/
│   ├── MainPage/               # Главная: приветствие, ежедневный вызов, Pro, топ игроков
│   ├── Quizes/QuizPage.vue     # Тесты: список / инфо / прохождение
│   ├── DailyChallenge/         # Ежедневный вызов
│   ├── DuelsPage/              # Дуэли: лобби / ожидание / арена / результат
│   ├── LeaderPage/             # Полный лидерборд
│   └── ProfilePage/            # Профиль, паспорт, настройки
│
├── features/
│   ├── auth/                   # Вход через Telegram (Mini App, OAuth, нативный SDK)
│   ├── navigator/              # Нижняя навигация (вкладки / кнопки действий)
│   ├── quizPage/               # Квизы
│   │   ├── quizzes/            # Список, карточки, топ, поиск, QuizInfo
│   │   ├── quiz/               # QuizRunner, ContextModal, компоненты вопросов
│   │   ├── knowledgeMap/       # Карта знаний
│   │   ├── review/             # Бейдж повторения
│   │   ├── ad/                 # Баннер последнего квиза, карусель баннеров
│   │   ├── header/             # Фиксированный заголовок
│   │   ├── store.ts · api.ts · types.ts · useQuizFlow.ts
│   ├── duels/                  # Дуэли
│   │   ├── components/         # DuelLobby, DuelWaitingRoom, DuelArena, DuelResult, CreateDuelModal
│   │   ├── composables/useDuelFlow.ts   # Экраны, события сокета, навигация
│   │   ├── useDuelSocket.ts    # WebSocket: auth-сообщение, ping, переподключение
│   │   └── store.ts · api.ts · types.ts
│   ├── mainPage/               # Виджеты главной: dailyChallenge, leaderboard, statistic
│   ├── passport/               # Карточка-паспорт, экспорт и шаринг
│   ├── subscription/           # ProBanner, ProBadge, SubscriptionModal
│   └── user/                   # Профиль, конфиг, роли
│
├── hooks/
│   └── useNetwork.ts           # Онлайн/офлайн
│
└── shared/
    ├── api/http.ts             # Axios: baseURL, Bearer, авторефреш при 401
    ├── stores/                 # useNavStore, useHeaderStore
    ├── i18n/                   # vue-i18n: locales/ru.ts, tg.ts, en.ts
    ├── lib/
    │   ├── TelegramAuth.ts     # Мост к нативному плагину TelegramAuth (Android)
    │   ├── pkce.ts             # nonce, code_verifier, code_challenge
    │   └── seo.ts
    ├── alerts/                 # Message.vue, useMessage
    ├── gsap.ts                 # useGsap (контекст + cleanup)
    └── utils.ts

android/                        # Нативный проект Capacitor (см. раздел «Android»)
capacitor.config.ts             # appId com.dovtalab.app, CapacitorHttp, CapacitorCookies
```

---

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 20+
- Запущенный [бэкенд Dovtalab](https://github.com/k1ng-ali/Dovtalab-Backend)

```bash
git clone https://github.com/k1ng-ali/dovtalab
cd dovtalab-app
npm install

# .env.development уже содержит VITE_API_URL и VITE_DEV_MODE — поправьте под себя
npm run dev        # http://localhost:5173
npm run build      # vue-tsc -b && vite build → dist/
```

---

## ⚙️ Переменные окружения

`.env.development` (dev) и `.env` (production):

```dotenv
# URL бэкенда без trailing slash; /api/v1 добавляется автоматически.
# По умолчанию https://api.dovtalab.app
VITE_API_URL=http://127.0.0.1:8000

# true — вход без Telegram через /auth/dev-login (бэкенд с DEV_MODE=true)
VITE_DEV_MODE=true

# Telegram OAuth для браузера
VITE_TELEGRAM_CLIENT_ID=123456789
VITE_TELEGRAM_REDIRECT_URI=https://dovtalab.app/telegram-callback.html

# Redirect для OAuth в нативном приложении (custom scheme)
VITE_TELEGRAM_REDIRECT_URI_NATIVE=com.dovtalab.app://telegram-login
```

---

## 🔐 Авторизация

```
Запуск App.vue
      │
      ├─ Нет сети ───────────────────────────► Экран ошибки подключения (повторить)
      │
      ├─ VITE_DEV_MODE=true ─────────────────► /auth/dev-login
      │
      ├─ Уже есть access token ─────────────► сразу в приложение
      │
      ├─ Telegram Mini App (initData) ───────► /auth/telegram/webapp
      │
      ├─ Тихий рефреш (refresh cookie) ─────► /auth/refresh
      │
      └─ Нет сессии ─────────────────────────► Экран Auth.vue
                                                   │
                     ┌─────────────────────────────┴───────────────────┐
              Браузер: OAuth popup + PKCE                Android: нативный Telegram Login SDK
                     │                                                 │
              /auth/telegram                         TelegramAuth.login() → idToken
                                                                       │
                                                           /auth/telegram/native
```

- Access token хранится в `useAuthStore` и `localStorage`, refresh — в httpOnly cookie
- `shared/api/http.ts` при `401` один раз обновляет токен (в Mini App — через initData, в браузере — через cookie), параллельные запросы ждут в очереди
- На Android deep link `com.dovtalab.app://telegram-login` обрабатывается в `App.vue` через `@capacitor/app`

---

## 🏗️ Архитектура приложения

### Сторы

| Стор | Назначение |
|------|-----------|
| `useAuthStore` | `accessToken`, статус сессии, login/refresh/logout |
| `useUserStore` | Профиль, конфиг, роли |
| `useNavStore` | Режим нижней навигации (`tabs` / `actions`) |
| `useHeaderStore` | Заголовок, кнопки, уведомления в шапке |
| `useQuiz` | Квизы, вопросы, контексты, статистика |
| `useDuelsStore` | Комнаты, состояние игры, итог дуэли |
| `useLeadersStore` | Лидерборд |
| `useStats` | Статистика и история попыток |

### Навигация

Нижняя панель (`Navigator.vue`) работает в двух режимах через `useNavStore`:
- **`tabs`** — вкладки: Главная, Тесты, Дуэли, Профиль
- **`actions`** — произвольные кнопки (прохождение квиза, дуэль, инфо о квизе)

### Safe area и edge-to-edge

На Android контент рисуется под статус-баром и навбаром (встроенный `SystemBars` Capacitor 8, `viewport-fit=cover`). Отступы задаются только через переменные из `style.css`:

| Переменная | Значение |
|-----------|----------|
| `--sat` / `--sab` / `--sal` / `--sar` | `max(env(safe-area-inset-*), var(--safe-area-inset-*))` |

- Фиксированные шапка и навигатор уже учитывают `--sat` / `--sab`
- Страница под шапкой: `padding-top: calc(80px + var(--sat))`, над навигатором — `calc(100px + var(--sab))`
- Модалки и bottom sheet добавляют `--sat` сверху и `--sab` снизу
- Цвет иконок статус-бара — `SystemBars.setStyle()` на странице; фон под статус-баром — это сама страница

---

## 📱 Страницы и функциональность

| Маршрут | Страница | Что внутри |
|---------|----------|-----------|
| `/` | Главная | Приветствие, ежедневный вызов, баннер Pro, топ игроков |
| `/quiz`, `/quiz/:hashCode` | Тесты | Карусель баннеров, популярные, поиск, список → инфо → прохождение |
| `/daily` | Ежедневный вызов | 10 вопросов дня, streak |
| `/duels`, `/duels/:duelId` | Дуэли | Лобби → комната ожидания → арена → результат |
| `/leaders` | Лидерборд | Топ-50, медали, sticky-карточка текущего пользователя |
| `/profile` | Профиль | Паспорт, роли, статистика, язык, таймер |

### Тесты

Трёхэкранный флоу, управляемый `useQuizFlow.ts`:

```
list  ──► info ──► quiz
 ▲          │        │
 └──────────┘        │  (finish)
 ▲                   │
 └───────────────────┘
```

- **list** — баннеры, популярные квизы, поиск, список
- **info** — мета-информация, прогресс, карта знаний, контексты, быстрый тест, повторение, адаптивный режим
- **quiz** — прохождение через `QuizRunner.vue`

---

## ⚔️ Дуэли

```
DuelLobby ──create/join──► DuelWaitingRoom ──start──► DuelArena ──finish/surrender──► DuelResult
```

- **Состояние** — `useDuelsStore`. HTTP-ответы (`/answer`, `/surrender`) применяются сразу, события сокета их дублируют. Устаревшие события (прошлый раунд, другая комната, после финиша) отбрасываются (`applyRoundUpdate`)
- **Сокет** — `useDuelSocket.ts`: токен первым сообщением `{type: "auth"}`, ping каждые 15 с, переподключение с паузой до 15 с и свежим токеном. События старого сокета игнорируются
- **Таймер раунда** — по `round_time_left_ms` из ответа сервера, не зависит от часов устройства. По истечении ответить нельзя, сервер сам закрывает раунд
- **Ошибки** — при ошибке сети ответ можно отправить снова; при `409` состояние подтягивается с сервера
- **Сдача** — с подтверждением; кнопка «Назад» (в шапке и аппаратная на Android) в арене предлагает сдаться
- Если сокет отключён, комната опрашивается по HTTP раз в 8 с

---

## 🧩 Типы вопросов

Все компоненты вопросов принимают одинаковый интерфейс:

```typescript
interface Props {
  question: QuestionPublic   // данные вопроса с payload
  disabled?: boolean         // заблокировано после отправки ответа
  result?: AttemptResult     // результат: правильно/неправильно + правильный ответ
}
```

| Тип | Компонент | Описание |
|-----|-----------|----------|
| `single_choice` | `SingleChoice.vue` | Один вариант |
| `multiple_choice` | `MultipleChoice.vue` | Несколько вариантов, `max_choices` ограничивает выбор |
| `matching` | `Matching.vue` | Tap-to-match: левый элемент, затем правый |
| `input` | `InputQuestion.vue` | Текстовый ввод; `numeric: true` — числовая клавиатура |

Компоненты переиспользуются в квизах и в дуэлях (`DuelArena.vue`).

### Добавление нового типа вопроса

1. Добавить тип в `features/quizPage/types.ts` (payload + type guard)
2. Создать компонент в `features/quizPage/quiz/questions/`
3. Зарегистрировать в `QuizRunner.vue` и `DuelArena.vue` (шаблон + `buildAnswerPayload()`)

### Добавление новой страницы

1. Создать компонент в `src/pages/`
2. Добавить маршрут в `src/app/router.ts`
3. Настроить шапку и навигацию через `useHeaderStore` / `useNavStore` в `onMounted`
4. Отступы под шапку и навигатор — с `var(--sat)` / `var(--sab)` (см. «Safe area»)

---

## 🤖 Android

Нативный проект лежит в `android/` (Capacitor 8, AGP 8.13, Gradle 8.14.3, Kotlin 2.0, JDK 21). Пакет — `com.dovtalab.app`.

### Сборка

```bash
npm run build
npx cap sync android
cd android
./gradlew assembleDebug        # app/build/outputs/apk/debug/app-debug.apk
./gradlew bundleRelease        # AAB для Google Play
```

Перед выпуском поднимите `versionCode` и `versionName` в `android/app/build.gradle`.

### Настройка окружения

- `android/local.properties` — путь к SDK и параметры Telegram Login отдельно для debug и release:

  ```properties
  sdk.dir=C:\\Users\\<you>\\AppData\\Local\\Android\\Sdk

  DEBUG_TELEGRAM_CLIENT_ID=...
  DEBUG_TG_APP_LINK_HOST=app<debug_app_id>-login.tg.dev
  DEBUG_TG_REDIRECT_URI=https://app<debug_app_id>-login.tg.dev/tglogin

  RELEASE_TELEGRAM_CLIENT_ID=...
  RELEASE_TG_APP_LINK_HOST=app<release_app_id>-login.tg.dev
  RELEASE_TG_REDIRECT_URI=https://app<release_app_id>-login.tg.dev/tglogin
  ```

  Значения попадают в `BuildConfig` и в intent-filter App Link в манифесте (`manifestPlaceholders`). Без ключа сборка падает с понятной ошибкой.

- **Telegram Login SDK** скачивается из GitHub Packages — нужен токен с правом `read:packages` в `~/.gradle/gradle.properties` (`gpr.user`, `gpr.key`). Не храните токен в проекте.

- **App Links** подтверждаются по SHA-256 ключа подписи — отпечатки debug- и release-ключей должны быть зарегистрированы в BotFather. Проверка на устройстве: `adb shell pm get-app-links com.dovtalab.app`.

Подробная настройка Telegram Login — в [android/TELEGRAM_LOGIN_SETUP.md](android/TELEGRAM_LOGIN_SETUP.md).

### Плагины Capacitor

`@capacitor/app` (deep links, кнопка «Назад»), `browser` (OAuth), `filesystem` и `share` (экспорт паспорта), `preferences`, `status-bar`. Edge-to-edge обеспечивает встроенный `SystemBars` — сторонние edge-to-edge плагины не нужны: они перехватывают insets и ломают safe area.

> ⚠️ Папка `android/` сейчас в `.gitignore`. Рекомендуется вернуть её в git (без `local.properties`, keystore и токенов) — иначе переключение веток может стереть нативный проект.

---

## 🌐 Деплой

Веб-версия публикуется на GitHub Pages (домен `dovtalab.app`, файл `CNAME`):

```bash
npm run deploy     # predeploy: npm run build → gh-pages -d dist
```

---

## 🎨 UI/UX особенности

- **Glassmorphism** — полупрозрачные карточки с `backdrop-filter: blur()`
- **Цвета** — основной синий `#234970`, акцентный бирюзовый `#4EBEC2`, фон `#F6F6F6`
- **Уведомления в шапке** — `Правильно 🎉` / `Неверно` / `+N баллов` с анимацией
- **Адаптивная типографика** — размеры через `clamp()`
- **Mobile-first** — ширина контента ограничена (`max-width` 800–900px), токены layout и breakpoints в `style.css`

---

## 📄 Лицензия

MIT © 2026 Dovtalab

## 👤 Автор

© Астанакулов Мухаммадали
