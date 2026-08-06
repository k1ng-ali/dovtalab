# 🎓 Dovtalab — Фронтенд

> **Образовательная платформа** для подготовки к экзаменам через интерактивные квизы.
> Telegram Mini App + веб-приложение с авторизацией через Telegram OAuth 2.0.

![Vue](https://img.shields.io/badge/Vue-3.x-4FC08D?logo=vuedotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?logo=vite&logoColor=white)
![Pinia](https://img.shields.io/badge/Pinia-2.x-FFD859?logo=pinia&logoColor=black)

---

## 📋 Содержание

- [Возможности](#-возможности)
- [Стек технологий](#-стек-технологий)
- [Структура проекта](#-структура-проекта)
- [Быстрый старт](#-быстрый-старт)
- [Переменные окружения](#-переменные-окружения)
- [Авторизация](#-авторизация)
- [Архитектура приложения](#-архитектура-приложения)
- [Страницы и функциональность](#-страницы-и-функциональность)
- [Типы вопросов](#-типы-вопросов)
- [Управление состоянием](#-управление-состоянием)

---

## ✨ Возможности

- 🔐 **Авторизация через Telegram** — поддержка Telegram Mini App (WebApp initData) и OAuth 2.0 (Login Widget)
- 🔄 **Тихое обновление сессии** — автоматический рефреш access token без разрыва работы
- 📝 **4 типа вопросов** — одиночный выбор, множественный выбор, сопоставление, ввод текста
- 📊 **Статистика и история попыток** — точность ответов, время прохождения, прогресс по квизу
- 🏆 **Глобальный лидерборд** — топ-50 игроков с подсветкой текущего пользователя и sticky-карточкой
- 📱 **Адаптивный интерфейс** — работает как полноценный веб-сайт и как Telegram Mini App
- 🎬 **Анимации** — плавные переходы между экранами и появление элементов через GSAP
- 🎯 **Контексты вопросов** — прохождение квиза в рамках выбранной темы с предварительным показом текста
- 🚀 **Быстрый тест** — режим экзамена с выбором количества вопросов (15/20/25/30), рандомная выдача, один шанс на вопрос
- 📈 **Графики активности** — двухлинейная диаграмма (правильные/неправильные) за неделю, кольцо точности, streak
- 🔥 **Streak и баллы** — серия дней подряд, система очков за правильные ответы
- 👤 **Профиль пользователя** — настройки языка, таймера, статистика сессий

---

## 🛠️ Стек технологий

| Компонент | Технология |
|-----------|-----------|
| UI-фреймворк | Vue 3.5 (Composition API, `<script setup>`) |
| Язык | TypeScript 5.9 |
| Сборщик | Vite 8 |
| Роутинг | Vue Router 5 |
| Стейт-менеджер | Pinia 3 |
| HTTP-клиент | Axios |
| CSS | SCSS (scoped) |
| Анимации | GSAP |
| Иконки | `@kalimahapps/vue-icons` |
| Безопасность OAuth | PKCE (S256) |

---

## 📁 Структура проекта

```
src/
├── app/
│   ├── router.ts               # Vue Router — маршруты приложения
│   └── App.vue                 # Корневой компонент, логика инициализации
│
├── pages/
│   ├── MainPage/
│   │   ├── MainPage.vue        # Главная страница (лидерборд + статистика)
│   │   └── Background.vue      # Фоновый блок с приветствием и аватаром
│   ├── Quizes/
│   │   └── QuizPage.vue        # Страница квизов (список / инфо / прохождение)
│   ├── ProfilePage/
│   │   └── ProfilePage.vue     # Профиль: настройки, статистика пользователя
│   └── LeaderPage/
│       └── LeaderPage.vue      # Полный лидерборд топ-50
│
├── features/
│   ├── auth/                   # Авторизация через Telegram
│   │   ├── Auth.vue            # Экран входа
│   │   ├── TelegramLoginButton.vue
│   │   ├── TelegramIcon.vue
│   │   ├── store.ts            # Pinia store: accessToken, статус
│   │   ├── api.ts              # Запросы: /auth/telegram, /auth/refresh
│   │   ├── types.ts            # Типы: AuthState, TelegramCallbackData и др.
│   │   └── composables/
│   │       ├── useTelegramLogin.ts   # Открытие OAuth popup + PKCE flow
│   │       └── useTelegramEnv.ts     # Определение среды (Mini App / браузер)
│   │
│   ├── navigator/
│   │   └── Navigator.vue       # Нижняя навигация (вкладки / кнопки действий)
│   │
│   ├── quizPage/               # Весь функционал квизов
│   │   ├── quizzes/
│   │   │   ├── Quizzes.vue     # Список квизов с анимацией
│   │   │   ├── QuizCard.vue    # Карточка квиза
│   │   │   └── QuizInfo.vue    # Детали квиза: мета, прогресс, контексты
│   │   ├── quiz/
│   │   │   ├── QuizRunner.vue  # Оркестратор прохождения теста
│   │   │   ├── ContextModal.vue# Bottom sheet с контекстом вопроса
│   │   │   └── questions/
│   │   │       ├── SingleChoice.vue    # Одиночный выбор
│   │   │       ├── MultipleChoice.vue  # Множественный выбор
│   │   │       ├── Matching.vue        # Сопоставление
│   │   │       └── InputQuestion.vue   # Ввод текста
│   │   ├── ad/
│   │   │   └── Ad.vue          # Баннер последнего квиза пользователя
│   │   ├── header/
│   │   │   └── Header.vue      # Фиксированный заголовок с кнопками
│   │   ├── store.ts            # Pinia store: квизы, вопросы, статистика
│   │   ├── api.ts              # Запросы к /quizzes, /attempts
│   │   ├── types.ts            # Типы: QuizIn, QuestionPublic, AttemptResult и др.
│   │   └── useQuizFlow.ts      # Composable: управление экранами list/info/quiz
│   │
│   ├── mainPage/
│   │   ├── leaderboard/
│   │   │   ├── Leaderboard.vue # Мини-лидерборд на главной
│   │   │   ├── store.ts        # Pinia store: список лидеров
│   │   │   ├── api.ts          # GET /leaderboard
│   │   │   └── types.ts
│   │   └── statistic/
│   │       ├── Statistics.vue  # Виджет статистики на главной
│   │       ├── store.ts        # Pinia store: stats, attempts
│   │       ├── api.ts          # GET /users/me/stats, /users/me/attempts
│   │       └── type.ts
│   │
│   └── user/
│       ├── store.ts            # Pinia store: профиль, config, роли
│       ├── api.ts              # GET /users/profile, PATCH /users/config
│       └── type.ts             # User, Config, UserProfile, UserRole
│
└── shared/
    ├── api/
    │   └── http.ts             # Axios instance: baseURL, интерцепторы, авторефреш
    ├── stores/
    │   ├── useNavStore.ts      # Глобальный стор нижней навигации
    │   └── useHeaderStore.ts   # Глобальный стор хедера + уведомления
    ├── lib/
    │   └── pkce.ts             # Генерация nonce, code_verifier, code_challenge
    ├── gsap.ts                 # Утилита useGsap (контекст + cleanup)
    └── utils.ts                # timeFormat и прочие хелперы
```

---

## 🚀 Быстрый старт

### Предварительные требования

- Node.js 18+
- npm / yarn / pnpm
- Запущенный [бэкенд Dovtalab](https://github.com/k1ng-ali/Dovtalab-Backend)

### 1. Клонирование репозитория

```bash
git clone https://github.com/k1ng-ali/dovtalab
cd dovtalab-app
```

### 2. Установка зависимостей

```bash
npm install
```

### 3. Настройка окружения

```bash
cp .env.development .env.local
# Заполните переменные (см. раздел ниже)
```

### 4. Запуск в режиме разработки

```bash
npm run dev
```

### 5. Сборка для продакшна

```bash
npm run build
```

---

## ⚙️ Переменные окружения

Создайте файл `.env.local` (или используйте `.env.development` для дев-режима):

```dotenv
# URL бэкенд API (без trailing slash, /api/v1 добавляется автоматически)
VITE_API_URL=http://127.0.0.1:8000

# Режим разработки — обходит Telegram авторизацию через /auth/dev-login
VITE_DEV_MODE=true

# Telegram OAuth (для Login Widget, нужен только в продакшне)
VITE_TELEGRAM_CLIENT_ID=123456789
VITE_TELEGRAM_REDIRECT_URI=https://your-domain.com/telegram-callback.html
```

> ⚠️ При `VITE_DEV_MODE=true` авторизация выполняется автоматически через `/auth/dev-login` (бэкенд должен работать с `DEV_MODE=true`).

---

## 🔐 Авторизация

Приложение поддерживает три сценария входа:

### 1. Telegram Mini App
Автоматическое считывание `initData` из `window.Telegram.WebApp` и отправка на `/auth/telegram/webapp`.

### 2. Telegram OAuth 2.0 (браузер)
Открывается popup `oauth.telegram.org` с PKCE-флоу (S256). После успешной авторизации popup передаёт `code` через `window.postMessage`, который обменивается на токены через `/auth/telegram`.

### 3. Тихий рефреш
При запуске приложение пробует обновить сессию через `/auth/refresh` (httpOnly cookie). Если успешно — пользователь сразу попадает в приложение.

```
Запуск App.vue
      │
      ├─ DEV_MODE=true ──────────────────────► /auth/dev-login
      │
      ├─ Telegram Mini App (initData есть) ──► /auth/telegram/webapp
      │
      ├─ Тихий рефреш (есть кука) ──────────► /auth/refresh
      │
      └─ Браузер без сессии ─────────────────► Экран Auth.vue
                                                    │
                                              OAuth popup + PKCE
                                                    │
                                              /auth/telegram
```

---

## 🏗️ Архитектура приложения

### Глобальные сторы

| Стор | Назначение |
|------|-----------|
| `useAuthStore` | Хранит `accessToken`, статус сессии |
| `useUserStore` | Профиль, конфиг, роли пользователя |
| `useNavStore` | Режим нижней навигации (`tabs` / `actions`) |
| `useHeaderStore` | Заголовок, кнопки действий, уведомления |
| `useQuiz` | Квизы, вопросы, контексты, статистика |
| `useLeadersStore` | Лидерборд |
| `useStats` | Статистика и история попыток |

### HTTP-клиент

`src/shared/api/http.ts` — Axios instance с:
- Автоматической подстановкой `Authorization: Bearer <token>` через интерцептор запроса
- Автоматическим рефрешем при получении `401` (один повторный запрос, без рекурсии)
- Выходом из системы при неудачном рефреше

### Навигация

Нижняя панель (`Navigator.vue`) работает в двух режимах через `useNavStore`:
- **`tabs`** — стандартные вкладки: Главная, Тесты, Профиль
- **`actions`** — произвольные кнопки (используется при прохождении квиза)

---

## 📱 Страницы и функциональность

### Главная (`/`)
Фоновый блок с приветствием, виджет лидерборда (топ-3 + позиция текущего пользователя), виджет статистики: кольцо точности, streak дней, баллы, двухлинейный SVG-график активности за неделю (правильные/неправильные), история попыток с прогресс-барами.

### Тесты (`/quiz`)
Трёхэкранный флоу, управляемый `useQuizFlow.ts`:

```
list  ──► info ──► quiz
 ▲           │       │
 └───────────┘       │  (finish)
 ▲                   │
 └───────────────────┘
```

- **list** — список квизов + баннер последнего квиза
- **info** — мета-информация, прогресс, выбор контекста, быстрый тест (exam mode)
- **quiz** — прохождение теста через `QuizRunner.vue`

### Лидерборд (`/leaders`)
Полный топ-50 с разбивкой на топ-3 (медали) и остальных. Sticky-карточка текущего пользователя появляется, когда его позиция выходит за пределы viewport (через `IntersectionObserver`).

### Профиль (`/profile`)
Аватар, имя, дата регистрации, значки ролей (Creator, Pro). Статистика: количество пройденных тестов и суммарное время. Настройки: переключатель таймера, выбор языка интерфейса.

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
| `single_choice` | `SingleChoice.vue` | Радио-кнопки, одновременно один вариант |
| `multiple_choice` | `MultipleChoice.vue` | Чекбоксы, `max_choices` ограничивает выбор |
| `matching` | `Matching.vue` | Tap-to-match: тап на левый элемент, затем на правый |
| `input` | `InputQuestion.vue` | Текстовый ввод; `numeric: true` — числовая клавиатура |

После отправки ответа компонент визуально показывает правильные (зелёный) и неправильные (красный) варианты на основе `AttemptResult.correct_answer`.

---

## 🎨 UI/UX особенности

- **Glassmorphism** — полупрозрачные карточки с `backdrop-filter: blur()` по всему приложению
- **Цветовая схема** — основной синий `#234970`, акцентный бирюзовый `#4EBEC2`
- **Уведомления в хедере** — оверлей `+N баллов` / `Правильно 🎉` / `Неправильно` с анимацией pop
- **Адаптивная типографика** — все размеры через `clamp()` из `style.css`
- **GSAP-анимации** — появление списка квизов (stagger), разворачивание баннера `Ad.vue`

---

## 🤝 Разработка

### Рекомендуемое окружение

- **IDE**: VS Code + расширение [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- **Форматтер**: Prettier
- **Линтер**: ESLint + `eslint-plugin-vue`

### Добавление нового типа вопроса

1. Добавить тип в `QuestionPayloadPublic` в `features/quizPage/types.ts`
2. Добавить type guard (`isXxxAnswer`) там же
3. Создать компонент в `features/quizPage/quiz/questions/`
4. Зарегистрировать в `QuizRunner.vue` (`<template>` + `buildAnswerPayload()`)

### Добавление новой страницы

1. Создать компонент в `src/pages/`
2. Добавить маршрут в `src/app/router.ts`
3. При необходимости — настроить заголовок и навигацию через `useHeaderStore` и `useNavStore` в `onMounted`

---

## 📄 Лицензия

MIT © 2026 Dovtalab

## 👤 Автор

© Астанакулов Мухаммадали