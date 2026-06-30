# Requirements Document

## Introduction

Рефакторинг фронтенда dovtalab-app для полного соответствия обновлённому бэкенд API. Включает добавление `/api/v1` в baseURL, актуализацию путей эндпоинтов, синхронизацию TypeScript-типов с Pydantic-схемами бэкенда, удаление устаревших полей и эндпоинтов, а также приведение quiz flow к двухшаговой логике (start → next).

## Glossary

- **HTTP_Client**: Единый axios instance (`shared/api/http.ts`), отвечающий за все API-вызовы
- **Auth_API**: Модуль авторизации через Telegram (`features/auth/api.ts`)
- **Quiz_API**: Модуль работы с квизами и попытками (`features/quizPage/api.ts`)
- **User_API**: Модуль профиля и статистики пользователя (`features/user/api.ts`)
- **Leaderboard_API**: Модуль рейтинга пользователей (`features/mainPage/leaderboard/api.ts`)
- **Auth_Store**: Pinia store авторизации (`features/auth/store.ts`)
- **Quiz_Store**: Pinia store прохождения квиза (`features/quizPage/store.ts`)
- **Refresh_Interceptor**: Axios response interceptor, обрабатывающий 401 и выполняющий refresh token
- **QuestionPayloadOut**: Структура payload вопроса, возвращаемая бэкендом платформе (без поля `correct`)
- **AnswerSubmit**: Discriminated union для отправки ответа пользователя
- **StartQuizResponse**: Ответ бэкенда на запрос начала квиза, содержащий `quiz_attempt_id`

## Requirements

### Requirement 1: Конфигурация HTTP-клиента с /api/v1

**User Story:** As a frontend developer, I want the HTTP client baseURL to include `/api/v1`, so that all API requests are routed to the correct versioned backend endpoint without duplicating the prefix in each call.

#### Acceptance Criteria

1. THE HTTP_Client SHALL set baseURL to the value of `VITE_API_URL` environment variable concatenated with `/api/v1`
2. WHEN `VITE_API_URL` is not defined, THE HTTP_Client SHALL use `https://api.dovtalab.app/api/v1` as the default baseURL
3. THE HTTP_Client SHALL set `withCredentials` to `true` for all requests
4. THE HTTP_Client SHALL set request timeout to 10000 milliseconds
5. THE HTTP_Client SHALL attach `Authorization: Bearer {token}` header to every outgoing request when an access token is available

### Requirement 2: Refresh Interceptor

**User Story:** As a user, I want my session to refresh automatically when the access token expires, so that I don't need to re-authenticate during active use of the application.

#### Acceptance Criteria

1. WHEN a request receives a 401 response, THE Refresh_Interceptor SHALL attempt to refresh the access token via `POST /auth/refresh`
2. WHEN the refresh request succeeds, THE Refresh_Interceptor SHALL update the stored access token and retry the original request with the new token
3. WHEN the refresh request fails, THE Refresh_Interceptor SHALL invoke `auth.logout()` and reject the original request
4. IF a request to `/auth/refresh` itself receives a 401 response, THEN THE Refresh_Interceptor SHALL invoke `auth.logout()` without retrying
5. IF a request has already been retried once, THEN THE Refresh_Interceptor SHALL reject it without further retry attempts

### Requirement 3: Auth API Endpoints

**User Story:** As a user, I want to authenticate via Telegram, so that I can access the platform securely using my Telegram account.

#### Acceptance Criteria

1. THE Auth_API SHALL expose a `telegramWebAppAuth` function that sends POST to `/auth/telegram/webapp` with `{init_data: string}` payload and returns `AuthTokensResponse`
2. THE Auth_API SHALL expose a `telegramOAuth` function that sends POST to `/auth/telegram` with OAuth payload and returns `AuthTokensResponse`
3. THE Auth_API SHALL expose a `refreshToken` function that sends POST to `/auth/refresh` with no body (relies on httpOnly cookie) and returns `{access_token: string}`
4. THE Auth_API SHALL expose a `logout` function that sends POST to `/auth/logout`
5. WHILE the application is running in development mode (`VITE_DEV_MODE=true`), THE Auth_API SHALL expose a `devLogin` function that sends POST to `/auth/dev-login` and returns `AuthTokensResponse`
6. THE Auth_API SHALL NOT include deprecated endpoints (`/auth/telegram/native`, `/auth/test`, `/auth/code-access`)

### Requirement 4: Quiz API Endpoints

**User Story:** As a user, I want to browse, start, and complete quizzes, so that I can learn and test my knowledge through the platform.

#### Acceptance Criteria

1. THE Quiz_API SHALL expose a `fetchQuizzes` function that sends GET to `/quizzes/` and returns `QuizOut[]`
2. THE Quiz_API SHALL expose a `getQuiz` function that sends GET to `/quizzes/{quizId}` and returns `QuizOut`
3. THE Quiz_API SHALL expose a `startQuiz` function that sends GET to `/quizzes/{quizId}/start` and returns `StartQuizResponse` containing `quiz_attempt_id`
4. THE Quiz_API SHALL expose a `nextQuestion` function that sends GET to `/attempts/{attemptId}/next` and returns `QuestionOut`
5. THE Quiz_API SHALL expose a `submitAnswer` function that sends POST to `/attempts/{attemptId}/submit` with `AnswerSubmit` payload and returns `SubmitResponse`
6. THE Quiz_API SHALL expose a `getQuizStat` function that sends GET to `/quizzes/{quizId}/my-stat` and returns `QuizStat`
7. THE Quiz_API SHALL expose `getFavorites`, `addFavorite`, and `removeFavorite` functions for managing quiz favorites at `/quizzes/favorites` and `/quizzes/{quizId}/favorite`
8. THE Quiz_API SHALL expose a `getContexts` function that sends GET to `/quizzes/{quizId}/contexts` and returns `ContextOut[]`

### Requirement 5: User API Endpoints

**User Story:** As a user, I want to view and manage my profile and settings, so that I can personalize my experience and track my progress.

#### Acceptance Criteria

1. THE User_API SHALL expose a `getMe` function that sends GET to `/users/me` and returns `User`
2. THE User_API SHALL expose a `getProfile` function that sends GET to `/users/profile` and returns `UserProfileOut`
3. THE User_API SHALL expose `getConfig` and `updateConfig` functions that send GET and PATCH to `/users/config` respectively
4. THE User_API SHALL expose a `getStats` function that sends GET to `/users/me/stats` and returns `UserStats`
5. THE User_API SHALL expose a `getAttemptHistory` function that sends GET to `/users/me/attempts` with `skip` and `limit` query parameters and returns `AttemptHistoryItem[]`

### Requirement 6: Leaderboard API Endpoints

**User Story:** As a user, I want to see rankings and leaderboards, so that I can compare my performance with others.

#### Acceptance Criteria

1. THE Leaderboard_API SHALL expose a `getLeaderboard` function that sends GET to `/leaderboard` with `period` and `limit` query parameters and returns `LeaderboardItem[]`
2. THE Leaderboard_API SHALL expose a `getQuizLeaderboard` function that sends GET to `/quizzes/{quizId}/leaderboard` and returns `LeaderboardItem[]`
3. THE Leaderboard_API SHALL ensure all endpoint paths start with `/` (leading slash)

### Requirement 7: API Path Formatting

**User Story:** As a frontend developer, I want all API paths to follow a consistent format, so that URL resolution works correctly with the baseURL.

#### Acceptance Criteria

1. THE HTTP_Client SHALL resolve all API paths relative to the baseURL origin
2. WHEN an API path is defined in any api module, THE path SHALL start with a leading `/` character
3. THE HTTP_Client SHALL NOT include duplicate `/api/v1` prefixes in the final request URL

### Requirement 8: TypeScript Types Synchronization

**User Story:** As a frontend developer, I want TypeScript types to match the backend Pydantic schemas exactly, so that type safety prevents runtime errors from schema mismatches.

#### Acceptance Criteria

1. THE Quiz_Store SHALL define `QuestionPayloadOut` type without a `correct` field in any variant (single_choice, multiple_choice, matching, input)
2. THE Quiz_Store SHALL define `AnswerSubmit` as a discriminated union with `type` field determining the payload shape
3. WHEN `AnswerSubmit.type` is `single_choice`, THE payload SHALL contain exactly `selected_option_id` of type `number`
4. WHEN `AnswerSubmit.type` is `multiple_choice`, THE payload SHALL contain exactly `selected_option_ids` of type `number[]`
5. WHEN `AnswerSubmit.type` is `matching`, THE payload SHALL contain exactly `pairs` of type `Record<string, number>`
6. WHEN `AnswerSubmit.type` is `input`, THE payload SHALL contain exactly `answer_text` of type `string`
7. THE Quiz_Store SHALL define `StartQuizResponse` type containing only `quiz_attempt_id` of type `number`
8. THE Auth_Store SHALL define `AuthTokensResponse` type containing `access_token`, `token_type`, and `expires_in` — without `refresh_token` or `user` fields

### Requirement 9: Quiz Flow Двухшаговый старт

**User Story:** As a user, I want the quiz to start correctly and load the first question, so that I can begin answering immediately without errors.

#### Acceptance Criteria

1. WHEN a user starts a quiz, THE Quiz_Store SHALL first call `GET /quizzes/{id}/start` to obtain `quiz_attempt_id`
2. WHEN `quiz_attempt_id` is obtained, THE Quiz_Store SHALL call `GET /attempts/{attemptId}/next` to load the first question
3. THE Quiz_Store SHALL NOT expect `startQuiz` to return a question object directly
4. WHEN `submitAnswer` returns `progress.is_finished === true`, THE Quiz_Store SHALL stop requesting next questions and display the result

### Requirement 10: Удаление устаревшей логики

**User Story:** As a frontend developer, I want to remove deprecated code and unused fields, so that the codebase stays clean and aligned with the current backend API.

#### Acceptance Criteria

1. THE Quiz_Store SHALL NOT reference or use quiz status fields (draft, published, archived) as filtering criteria — the platform works exclusively with published content
2. THE Quiz_Store SHALL NOT include a `correct` field in any `QuestionPayloadOut` variant sent or processed on the frontend
3. THE Auth_Store SHALL NOT parse or store `refresh_token` from response body — the refresh token is managed via httpOnly cookie
4. THE Auth_API SHALL NOT include functions for deprecated endpoints (`/auth/telegram/native`, `/auth/test`, `/auth/code-access`)

### Requirement 11: Безопасность токенов

**User Story:** As a user, I want my authentication tokens stored securely, so that my session cannot be easily hijacked.

#### Acceptance Criteria

1. THE Auth_Store SHALL store the access token in Pinia state and localStorage as a fallback
2. THE HTTP_Client SHALL send cookies with every request via `withCredentials: true` to support httpOnly refresh token
3. THE Auth_Store SHALL NOT store or access the refresh token in JavaScript — it is managed exclusively by the browser as an httpOnly cookie
4. IF `VITE_DEV_MODE` is not `true`, THEN THE Auth_API SHALL NOT expose the `devLogin` function

### Requirement 12: Обработка ошибок

**User Story:** As a user, I want clear feedback when something goes wrong, so that I understand what happened and can take appropriate action.

#### Acceptance Criteria

1. WHEN a network error occurs (no response or `ERR_NETWORK` code), THE HTTP_Client SHALL display a network error notification to the user
2. WHEN a request times out (`ECONNABORTED` code), THE HTTP_Client SHALL display a timeout notification to the user
3. WHEN a 404 response is received for a quiz request, THE Quiz_Store SHALL display a "not found" message and navigate back to the quiz list
4. WHEN an unhandled API error occurs, THE HTTP_Client SHALL log the error details for debugging
