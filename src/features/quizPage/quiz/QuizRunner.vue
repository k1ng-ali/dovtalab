<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  QuizIn,
  ContextIn,
  QuestionPublic,
  AttemptResult,
  UserAnswerPayload,
  SubmitAnswer,
  QuizMode,
  Progress
} from '@/features/quizPage/types.ts'
import { useQuiz }    from '@/features/quizPage/store.ts'
import { useNavStore } from '@/shared/stores/useNavStore'

import SingleChoice   from './questions/SingleChoice.vue'
import MultipleChoice from './questions/MultipleChoice.vue'
import Matching       from './questions/Matching.vue'
import InputQuestion  from './questions/InputQuestion.vue'
import ContextModal   from './ContextModal.vue'
import {useHeaderStore} from "@/shared/stores/useHeaderStore.ts";
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  quiz: QuizIn
  context: ContextIn | null
  mode?: QuizMode
  questionLimit?: number
}>()

const emit = defineEmits<{
  (e: 'finish'): void
}>()

const quizStore = useQuiz()
const navStore  = useNavStore()
const headerStore = useHeaderStore()
const { t } = useI18n()

// ── Состояние ──────────────────────────────────────────────────────────────────
const loading         = ref(true)
const startError      = ref(false)
const currentAnswer   = ref<any>(null)
const answeredCount   = ref(0)
const correctCount    = ref(0)
const finished        = ref(false)

// Результат экзамена (для exam mode)
const examResult      = ref<Progress | null>(null)

// Фаза контекста: показываем текст контекста перед началом
const showingContext  = ref(false)

// Фаза: 'answering' — пользователь выбирает ответ, 'submitted' — ответ отправлен
const phase       = ref<'answering' | 'submitted'>('answering')
const lastResult  = ref<AttemptResult | null>(null)

// ── Текущий вопрос ──────────────────────────────────────────────────────────────
const currentQuestion = ref<QuestionPublic | null>(null)

// ── Таймер ─────────────────────────────────────────────────────────────────────
let timerHandle: ReturnType<typeof setInterval> | null = null

const stopTimer = () => {
  if (timerHandle) clearInterval(timerHandle)
}

// ── Есть ли выбранный ответ ────────────────────────────────────────────────────
const hasAnswer = computed(() => {
  const a = currentAnswer.value
  if (a === null || a === undefined) return false
  if (typeof a === 'string')  return a.trim().length > 0
  if (Array.isArray(a))       return a.length > 0
  if (typeof a === 'object')  return Object.keys(a).length > 0
  return true
})

// ── Синхронизируем кнопку в навбаре ───────────────────────────────────────────
const syncNavButton = () => {
  if (showingContext.value) {
    navStore.updateAction(1, {
      label:    t('common.continue'),
      disabled: false,
      onClick:  () => startAfterContext(),
    })
    return
  }

  if (phase.value === 'submitted') {
    navStore.updateAction(1, {
      label:    t('common.continue'),
      disabled: false,
      onClick:  () => submitOrNext(),
    })
  } else {
    navStore.updateAction(1, {
      label:    t('quiz.answer'),
      disabled: !hasAnswer.value,
      onClick:  () => submitOrNext(),
    })
  }
}

watch([hasAnswer, phase, showingContext], syncNavButton)

// ── Построить правильный UserAnswerPayload ─────────────────────────────────────
const buildAnswerPayload = (): UserAnswerPayload | null => {
  const q = currentQuestion.value
  const a = currentAnswer.value
  if (!q || a === null || a === undefined) return null

  switch (q.type) {
    case 'single_choice':
      return { type: 'single_choice', selected_option_id: a as number }
    case 'multiple_choice':
      return { type: 'multiple_choice', selected_option_ids: a as number[] }
    case 'matching':
      return { type: 'matching', pairs: a as Record<string, number> }
    case 'input':
      return { type: 'input', answer_text: String(a) }
    default:
      return null
  }
}

// ── Начать тест после прочтения контекста ──────────────────────────────────────
const startAfterContext = async () => {
  showingContext.value = false
  loading.value = true

  try {
    currentQuestion.value = await quizStore.startQuiz(props.quiz.id, props.context?.id, props.mode ?? 'practice', props.questionLimit)
    console.log("question", currentQuestion.value)
  } catch (e) {
    console.error('Не удалось начать квиз', e)
    startError.value = true
  } finally {
    loading.value = false
  }

  syncNavButton()
}

// ── Загрузка / показ контекста ─────────────────────────────────────────────────
onMounted(async () => {
  // Если выбран контекст — сначала показываем его текст
  if (props.context) {
    showingContext.value = true
    loading.value = false
    syncNavButton()
    return
  }

  // Без контекста — сразу стартуем
  try {
    currentQuestion.value = await quizStore.startQuiz(props.quiz.id, undefined, props.mode ?? 'practice', props.questionLimit)
    console.log("question", currentQuestion.value)
  } catch (e) {
    console.error('Не удалось начать квиз', e)
    startError.value = true
  } finally {
    loading.value = false
  }

  syncNavButton()
})

// ── Глобальное событие от Header ──────────────────────────────────────────────
const onGlobalSubmit = () => submitOrNext()
onMounted(()   => window.addEventListener('quiz-submit-answer', onGlobalSubmit))
onUnmounted(() => window.removeEventListener('quiz-submit-answer', onGlobalSubmit))

// ── Логика ответа / перехода ───────────────────────────────────────────────────
const onAnswer = (val: any) => {
  if (phase.value === 'answering') {
    currentAnswer.value = val
  }
}

const submitOrNext = async () => {
  if (!currentQuestion.value) return

  // ── Фаза 1: отправить ответ ──────────────────────────────────────────────────
  if (phase.value === 'answering') {
    if (!hasAnswer.value) return

    const answerPayload = buildAnswerPayload()
    if (!answerPayload) return

    try {
      const answer = await quizStore.submitAnswer(
          {
            id: currentQuestion.value.attempt.id,
            answer: answerPayload,
          } as SubmitAnswer
      )

      lastResult.value  = answer.attempt.result ?? null
      answeredCount.value++
      if (answer.attempt.result?.is_correct) correctCount.value++
      phase.value = 'submitted'

      const result = answer.progress

      // Проверяем is_finished — для exam mode тест может закончиться сразу
      if (result.is_finished) {
        examResult.value = result
        finishQuiz()
        return
      }

      if (answer.attempt.result?.is_correct === true) {
        if (result.earned_points && result.earned_points > 0) {
          headerStore.showNotification(t('quiz.notificationPoints', { n: result.earned_points }), 'success', 2000)
        } else {
          headerStore.showNotification(t('quiz.notificationCorrect'), 'success', 2000)
        }
      }
      if (answer.attempt.result?.is_correct === false) {
        headerStore.showNotification(t('quiz.notificationWrong'), 'error', 2000)
      }
    } catch (e) {
      console.error('Ошибка при отправке ответа', e)
    }

    // ── Фаза 2: перейти к следующему вопросу ─────────────────────────────────────
  } else {
    try {
      const next = await quizStore.nextQuestion(currentQuestion.value.attempt.quiz_attempt_id)
      currentQuestion.value = next
      currentAnswer.value   = null
      lastResult.value      = null
      phase.value           = 'answering'
      console.log("question", next)
    } catch {
      // Сервер вернул ошибку — тест завершён
      finishQuiz()
    }
  }
}

const finishQuiz = () => {
  stopTimer()
  finished.value = true
}
</script>

<template>
  <div class="quiz-runner">

    <!-- Загрузка -->
    <div v-if="loading" class="loading-state">
      <div class="skeleton-q" />
      <div class="skeleton-opt" v-for="i in 4" :key="i" />
    </div>

    <!-- Ошибка при старте: нет вопросов или сервер недоступен -->
    <div v-else-if="startError" class="finish-screen">
      <div class="finish-icon">😕</div>
      <h2 class="finish-title">{{ t('quiz.cantStart') }}</h2>
      <p class="finish-sub">
        {{ t('quiz.cantStartDesc') }}
      </p>
      <button class="finish-btn" @click="emit('finish')">{{ t('quiz.backToList') }}</button>
    </div>

    <!-- Экран чтения контекста перед стартом -->
    <div v-else-if="showingContext && context" class="context-reading">
      <div class="context-card">
        <div class="context-badge">{{ t('quiz.readText') }}</div>
        <h3 class="context-title">{{ context.title }}</h3>
        <p class="context-text">{{ context.text }}</p>

        <div v-if="context.rule" class="context-rule">
          <p class="rule-label">{{ t('quiz.rule') }}</p>
          <p class="rule-text">{{ context.rule }}</p>
        </div>
      </div>

      <p class="context-hint">
        {{ t('quiz.contextHint') }}
      </p>
    </div>

    <!-- Финальный экран -->
    <div v-else-if="finished" class="finish-screen">
      <!-- Exam mode: детальный результат -->
      <template v-if="examResult">
        <div class="exam-result">
          <div class="exam-result-icon">{{ examResult.score >= 70 ? '🎉' : examResult.score >= 40 ? '💪' : '📚' }}</div>
          <h2 class="exam-result-title">
            {{ examResult.score >= 70 ? t('quiz.excellent') : examResult.score >= 40 ? t('quiz.notBad') : t('quiz.needWork') }}
          </h2>

          <div class="exam-score-ring">
            <svg viewBox="0 0 120 120" class="score-ring-svg">
              <circle cx="60" cy="60" r="50" fill="none" stroke="#E5E7EB" stroke-width="8" />
              <circle
                  cx="60" cy="60" r="50" fill="none"
                  :stroke="examResult.score >= 70 ? '#22c55e' : examResult.score >= 40 ? '#f59e0b' : '#ef4444'"
                  stroke-width="8" stroke-linecap="round"
                  :stroke-dasharray="314"
                  :stroke-dashoffset="314 - (examResult.score / 100) * 314"
                  class="score-ring-progress"
              />
            </svg>
            <div class="score-ring-label">
              <span class="score-ring-value">{{ examResult.score }}%</span>
            </div>
          </div>

          <div class="exam-stats-grid">
            <div class="exam-stat">
              <span class="exam-stat-icon">✅</span>
              <span class="exam-stat-value">{{ examResult.correct_count }}</span>
              <span class="exam-stat-label">{{ t('quiz.correctCount') }}</span>
            </div>
            <div class="exam-stat">
              <span class="exam-stat-icon">❌</span>
              <span class="exam-stat-value">{{ examResult.total_count - examResult.correct_count }}</span>
              <span class="exam-stat-label">{{ t('quiz.errors') }}</span>
            </div>
            <div class="exam-stat">
              <span class="exam-stat-icon">📝</span>
              <span class="exam-stat-value">{{ examResult.total_count }}/{{ examResult.total_questions }}</span>
              <span class="exam-stat-label">{{ t('quiz.questions') }}</span>
            </div>
            <div class="exam-stat">
              <span class="exam-stat-icon">⭐</span>
              <span class="exam-stat-value">{{ examResult.earned_points }}</span>
              <span class="exam-stat-label">{{ t('quiz.pointsEarned') }}</span>
            </div>
          </div>

          <button class="finish-btn" @click="emit('finish')">{{ t('quiz.backToQuiz') }}</button>
        </div>
      </template>

      <!-- Practice mode: простой финиш -->
      <template v-else>
        <div class="finish-icon">🎉</div>
        <h2 class="finish-title">{{ t('quiz.finished') }}</h2>
        <p class="finish-sub">
          {{ t('quiz.answeredN', { n: answeredCount }) }}
        </p>
        <button class="finish-btn" @click="emit('finish')">{{ t('quiz.backToQuiz') }}</button>
      </template>
    </div>

    <!-- Тест -->
    <template v-else-if="currentQuestion">

      <!-- Прогресс-бар и счётчик для быстрого теста -->
      <div v-if="props.mode === 'exam' && props.questionLimit" class="exam-progress">
        <div class="exam-progress-info">
          <span class="exam-progress-label">{{ t('quiz.questionNofM', { n: answeredCount + 1, m: props.questionLimit }) }}</span>
          <span class="exam-progress-score">✅ {{ correctCount }}</span>
        </div>
        <div class="exam-progress-track">
          <div
              class="exam-progress-fill"
              :style="{ width: ((answeredCount) / props.questionLimit * 100) + '%' }"
          />
        </div>
      </div>

      <!-- Счётчик (для practice mode) -->
      <p v-else class="counter">
        {{ t('quiz.questionN', { n: currentQuestion?.order }) }}
      </p>

      <!-- Карточка вопроса -->
      <Transition name="qslide" mode="out-in">
        <div class="question-card" :key="currentQuestion.id">

          <SingleChoice
              v-if="currentQuestion.type === 'single_choice'"
              :question="currentQuestion"
              :disabled="phase === 'submitted'"
              :result="lastResult"
              @answer="onAnswer"
          />

          <MultipleChoice
              v-else-if="currentQuestion.type === 'multiple_choice'"
              :question="currentQuestion"
              :disabled="phase === 'submitted'"
              :result="lastResult"
              @answer="onAnswer"
          />

          <Matching
              v-else-if="currentQuestion.type === 'matching'"
              :question="currentQuestion"
              :disabled="phase === 'submitted'"
              :result="lastResult"
              @answer="onAnswer"
          />

          <InputQuestion
              v-else-if="currentQuestion.type === 'input'"
              :question="currentQuestion"
              :disabled="phase === 'submitted'"
              :result="lastResult"
              @answer="onAnswer"
          />

        </div>
      </Transition>

    </template>

    <!-- Модалка контекста (доступна во время прохождения) -->
    <ContextModal :context="props.context" />

  </div>
</template>

<style scoped lang="scss">
.quiz-runner {
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* ── Экран чтения контекста ── */
.context-reading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.context-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 24px 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.context-badge {
  display: inline-flex;
  align-self: flex-start;
  padding: 6px 12px;
  background: rgba(78, 190, 194, 0.1);
  border: 1px solid rgba(78, 190, 194, 0.25);
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #234970;
}

.context-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #234970;
  line-height: 1.3;
}

.context-text {
  margin: 0;
  font-size: 15px;
  color: #374151;
  line-height: 1.7;
  white-space: pre-wrap;
}

.context-rule {
  background: rgba(78, 190, 194, 0.08);
  border-left: 3px solid #4EBEC2;
  border-radius: 0 12px 12px 0;
  padding: 12px 14px;
}

.rule-label {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #4EBEC2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rule-text {
  margin: 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.55;
}

.context-hint {
  margin: 0;
  font-size: 13px;
  color: #9CA3AF;
  text-align: center;
  line-height: 1.5;
  padding: 0 12px;
}

/* ── Прогресс-бар ── */
.progress-bar-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
}

.progress-track {
  flex: 1;
  height: 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.07);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #4EBEC2, #234970);
  border-radius: 8px;
  transition: width 0.35s ease;
}

.timer {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #234970;
  background: rgba(255, 255, 255, 0.8);
  padding: 4px 10px;
  border-radius: 20px;
  border: 1.5px solid rgba(35, 73, 112, 0.15);
  transition: all 0.3s;
  white-space: nowrap;

  &.danger {
    color: #ef4444;
    border-color: rgba(239, 68, 68, 0.3);
    background: rgba(239, 68, 68, 0.07);
    animation: pulse-timer 1s ease infinite;
  }
}

@keyframes pulse-timer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.7; }
}

.counter {
  margin: 0;
  font-size: 13px;
  color: #9CA3AF;
  font-weight: 500;
}

/* ── Exam progress bar ── */
.exam-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.exam-progress-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.exam-progress-label {
  font-size: 13px;
  font-weight: 600;
  color: #234970;
}

.exam-progress-score {
  font-size: 13px;
  font-weight: 600;
  color: #22c55e;
}

.exam-progress-track {
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.exam-progress-fill {
  height: 100%;
  border-radius: 6px;
  background: linear-gradient(90deg, #4EBEC2, #234970);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* ── Карточка вопроса ── */
.question-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
}

/* ── Баннер результата ── */
.result-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 16px;
  border: 1.5px solid;

  &.result-correct {
    background: rgba(34, 197, 94, 0.08);
    border-color: rgba(34, 197, 94, 0.35);
    color: #166534;
  }

  &.result-wrong {
    background: rgba(239, 68, 68, 0.08);
    border-color: rgba(239, 68, 68, 0.35);
    color: #991b1b;
  }
}

.result-icon {
  font-size: 20px;
  line-height: 1.4;
  flex-shrink: 0;
}

.result-text {
  display: flex;
  flex-direction: column;
  gap: 4px;

  strong {
    font-size: 15px;
    font-weight: 700;
  }
}

.result-explanation {
  margin: 0;
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.5;
}

/* ── Transitions ── */
.result-fade-enter-active,
.result-fade-leave-active {
  transition: all 0.3s ease;
}
.result-fade-enter-from,
.result-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

.qslide-enter-active,
.qslide-leave-active {
  transition: all 0.22s ease;
}
.qslide-enter-from {
  opacity: 0;
  transform: translateY(12px);
}
.qslide-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ── Финальный экран ── */
.finish-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 12px;
  padding: 40px 20px;
}

.finish-icon  { font-size: 64px; }

.finish-title {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #234970;
}

.finish-sub {
  margin: 0;
  font-size: 15px;
  color: #6B7280;
}

.finish-btn {
  margin-top: 16px;
  padding: 14px 32px;
  background: linear-gradient(135deg, #4EBEC2, #234970);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);
  transition: transform 0.2s;

  &:active { transform: scale(0.96); }
}

/* ── Skeleton ── */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.skeleton-q {
  height: 28px;
  border-radius: 10px;
  background: rgba(0,0,0,0.07);
  animation: pulse 1.4s ease infinite;
  width: 80%;
}

.skeleton-opt {
  height: 52px;
  border-radius: 16px;
  background: rgba(0,0,0,0.06);
  animation: pulse 1.4s ease infinite;

  &:nth-child(2) { animation-delay: 0.15s; }
  &:nth-child(3) { animation-delay: 0.3s;  }
  &:nth-child(4) { animation-delay: 0.45s; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

/* ── Exam Result Screen ── */
.exam-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 8px 0;
}

.exam-result-icon {
  font-size: 56px;
}

.exam-result-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #234970;
}

.exam-score-ring {
  position: relative;
  width: 140px;
  height: 140px;
}

.score-ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.score-ring-progress {
  transition: stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.score-ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.score-ring-value {
  font-size: 32px;
  font-weight: 800;
  color: #234970;
}

.exam-stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.exam-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 14px 10px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
}

.exam-stat-icon {
  font-size: 20px;
}

.exam-stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #234970;
}

.exam-stat-label {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
}
</style>
