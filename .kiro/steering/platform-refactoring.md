---
inclusion: manual
---

# Рефакторинг Dovtalab Platform (dovtalab-app)

## Контекст проекта

Это фронтенд-приложение **Platform** (dovtalab.app) — пользователи проходят квизы, набирают баллы, смотрят рейтинг. Работает как Telegram Mini App + мобильное приложение (Capacitor).

## Бэкенд API

Бэкенд доступен по `VITE_API_URL`. Все эндпоинты под prefix `/api/v1`.
Platform-эндпоинты находятся **без дополнительного prefix** (т.е. `/api/v1/quizzes/`, `/api/v1/users/me`).

**ВАЖНО**: baseURL в `src/shared/api/http.ts` должен включать `/api/v1`:
- Development: `http://127.0.0.1:8000/api/v1`
- Production: `https://api.dovtalab.app/api/v1`

### Platform эндпоинты (`/api/v1/`)

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/quizzes/` | Список published квизов (сортировка по активности) |
| GET | `/quizzes/favorites` | Избранные |
| GET | `/quizzes/{id}` | Детали квиза |
| POST | `/quizzes/{id}/favorite` | В избранное |
| DELETE | `/quizzes/{id}/favorite` | Из избранного |
| GET | `/quizzes/{id}/start` | Начать квиз (возвращает quiz_attempt_id) |
| GET | `/quizzes/{id}/contexts` | Контексты (только published) |
| GET | `/attempts/{id}/next` | Следующий вопрос (только published вопросы) |
| POST | `/attempts/{id}/submit` | Отправить ответ |
| GET | `/users/me` | Профиль |
| GET | `/users/profile` | Полный профиль (user + config + roles) |
| GET | `/users/config` | Конфигурация |
| PATCH | `/users/config` | Обновить конфиг |
| GET | `/users/me/stats` | Статистика |
| GET | `/users/me/attempts` | История попыток |
| GET | `/quizzes/{id}/my-stat` | Статистика по квизу |
| GET | `/leaderboard` | Глобальный рейтинг (?period=all/month/week&limit=50) |
| GET | `/quizzes/{id}/leaderboard` | Рейтинг по квизу |

### Auth эндпоинты (`/api/v1/auth/`)

| Метод | Путь | Описание |
|-------|------|----------|
| POST | `/telegram/webapp` | Авторизация через Telegram WebApp initData |
| POST | `/telegram` | OAuth 2.0 (code + PKCE) |
| POST | `/refresh` | Обновить access token (refresh в httpOnly cookie) |
| POST | `/logout` | Выход |
| POST | `/dev-login` | Dev-mode быстрый вход |

## Ключевые схемы данных

### Quiz (response)
```typescript
interface QuizOut {
  id: number
  hash_code: string
  title: string
  description: string
  time_limit: number
  on_fav?: boolean
  created_at: string
  contexts?: ContextOut
  details?: { type: string; stat?: AttemptHistoryItem }
}
```

### Question (response для platform — БЕЗ correct)
```typescript
interface QuestionOut {
  id: number
  text: string
  type: "single_choice" | "multiple_choice" | "matching" | "input"
  context_id?: number
  payload: QuestionPayloadOut  // БЕЗ поля correct
  image_url?: string
  order: number
  attempt?: QuestionAttemptOut
}
```

### Answer submit (request)
```typescript
// Discriminated union по type:
{ type: "single_choice", selected_option_id: number }
{ type: "multiple_choice", selected_option_ids: number[] }
{ type: "matching", pairs: Record<string, number> }
{ type: "input", answer_text: string }
```

### UserProfile
```typescript
interface UserProfileOut {
  user: { id: number; first_name: string; username: string; last_name: string; avatar_url: string }
  config: { language: string; is_active: boolean; timer: boolean; quiz_time: number; quiz_count: number }
  roles: string[]  // ["creator", "pro"]
}
```

### Leaderboard
```typescript
interface LeaderboardItem {
  rank: number
  user_id: number
  first_name: string
  username: string
  avatar_url: string
  total_points: number
}
```

## Технический стек

- Vue 3.5 + Pinia 3 (Options API stores)
- vue-router 5
- Ant Design Vue 4
- axios (shared http instance с interceptors)
- @kalimahapps/vue-icons
- GSAP для анимаций
- Capacitor (Android, мобильная сборка)
- SCSS
- Feature-based folder structure

## Структура проекта

```
src/
├── app/           # router.ts, store.ts
├── features/      # auth, mainPage, navigator, quizPage, user
├── pages/         # LeaderPage, MainPage, ProfilePage, Quizes
├── shared/        # api/http.ts, alerts, stores, utils
├── hooks/         # useNetwork
├── App.vue
└── main.ts
```

## Что нужно рефакторить

1. **baseURL в http.ts** — добавить `/api/v1` (сейчас просто `https://api.dovtalab.app/`)
2. **Все API пути** — убедиться что соответствуют актуальным эндпоинтам бэкенда (см. таблицу выше)
3. **Типы** — привести в соответствие с Pydantic-схемами бэкенда
4. **Platform видит только published контент** — учитывать что `GET /attempts/{id}/next` возвращает только published вопросы
5. **Статусы** — Platform НЕ работает со статусами (draft/moderating/published/archived), видит только published контент

## Правила

- Platform НЕ имеет prefix `/studio/` или `/admin/` — все пути напрямую под `/api/v1/`
- Platform НИКОГДА не получает поле `correct` в payload вопросов
- Авторизация через Telegram (WebApp initData или OAuth PKCE)
- Refresh token в httpOnly cookie, access token в памяти + localStorage fallback
