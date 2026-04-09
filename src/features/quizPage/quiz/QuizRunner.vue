<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import type {
  QuizIn,
  ContextIn,
  QuestionPublic,
  AttemptResult,
  UserAnswerPayload,
  SubmitAnswer
} from '@/features/quizPage/types.ts'
import { useQuiz }    from '@/features/quizPage/store.ts'
import { useNavStore } from '@/shared/stores/useNavStore'

import SingleChoice   from './questions/SingleChoice.vue'
import MultipleChoice from './questions/MultipleChoice.vue'
import Matching       from './questions/Matching.vue'
import InputQuestion  from './questions/InputQuestion.vue'
import ContextModal   from './ContextModal.vue'
import {useHeaderStore} from "@/shared/stores/useHeaderStore.ts";

const props = defineProps<{
  quiz: QuizIn
  context: ContextIn | null
}>()

const emit = defineEmits<{
  (e: 'finish'): void
}>()

const quizStore = useQuiz()
const navStore  = useNavStore()
const headerStore = useHeaderStore()

// ── Состояние ──────────────────────────────────────────────────────────────────
const loading         = ref(true)
const currentAnswer   = ref<any>(null)
const answeredCount   = ref(0)
const finished        = ref(false)

// Фаза: 'answering' — пользователь выбирает ответ, 'submitted' — ответ отправлен, показываем результат
const phase       = ref<'answering' | 'submitted'>('answering')
const lastResult  = ref<AttemptResult | null>(null)

// ── Текущий вопрос ──────────────────────────────────────────────────────────────
const currentQuestion = ref<QuestionPublic | null>(null)

// ── Таймер ─────────────────────────────────────────────────────────────────────
// const timeLeft  = ref(props.quiz.time_limit)
let timerHandle: ReturnType<typeof setInterval> | null = null
/*
const timerLabel = computed(() => {
  const m = Math.floor(timeLeft.value / 60).toString().padStart(2, '0')
  const s = (timeLeft.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

const timerPercent = computed(() => (timeLeft.value / props.quiz.time_limit) * 100)
const timerDanger  = computed(() => timerPercent.value < 20)

const startTimer = () => {
  timerHandle = setInterval(() => {
    if (timeLeft.value > 0) {
      timeLeft.value--
    } else {
      stopTimer()
      finishQuiz()
    }
  }, 1000)
}

 */

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

// ── Прогресс ───────────────────────────────────────────────────────────────────

/*
const progressPercent = computed(() => {
  if (!total.value) return 0
  return Math.round((answeredCount.value / total.value) * 100)
})
*/


// ── Синхронизируем кнопку в навбаре ───────────────────────────────────────────
const syncNavButton = () => {
  if (phase.value === 'submitted') {
    navStore.updateAction(1, {
      label:    'Продолжить',
      disabled: false,
      onClick:  () => submitOrNext(),
    })
  } else {
    navStore.updateAction(1, {
      label:    'Ответить',
      disabled: !hasAnswer.value,
      onClick:  () => submitOrNext(),
    })
  }
}

watch([hasAnswer, phase], syncNavButton)

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
      // Бэкенд ожидает поле answer_text (схема InputText), не value
      return { type: 'input', answer_text: String(a) }
    default:
      return null
  }
}

// ── Загрузка первого вопроса ───────────────────────────────────────────────────
onMounted(async () => {
  try {
    currentQuestion.value = await quizStore.startQuiz(props.quiz.id)
    console.log("question", currentQuestion)
  } finally {
    loading.value = false
    //startTimer()
  }

  syncNavButton()
})

//onUnmounted(() => stopTimer()) TODO вернуть логику таймера, когда бэкенд реализуется

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
      phase.value = 'submitted'

      const result = answer.progress
      if (answer.attempt.result?.is_correct === true) {
        if (result.earned_points && result.earned_points > 0) {
          headerStore.showNotification(`+${result.earned_points} баллов`, 'success', 2000)
        } else {
          headerStore.showNotification("Правильно 🎉", 'success', 2000)
        }
      }
      if (answer.attempt.result?.is_correct === false) {
        headerStore.showNotification("Неправильно", 'error', 2000)
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

    <!-- Финальный экран -->
    <div v-else-if="finished" class="finish-screen">
      <div class="finish-icon">🎉</div>
      <h2 class="finish-title">Тест завершён!</h2>
      <p class="finish-sub">
        Вы ответили на {{ answeredCount }} вопросов
      </p>
      <button class="finish-btn" @click="emit('finish')">Вернуться к тесту</button>
    </div>

    <!-- Тест -->
    <template v-else-if="currentQuestion">

      <!-- Прогресс + таймер
      <div class="progress-bar-wrap">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
        <div class="timer" :class="{ danger: timerDanger }">
          <span class="timer-icon">⏱</span>
          {{ timerLabel }}
        </div>
      </div>
      -->

      <!-- Счётчик -->
      <p class="counter">
        Вопрос {{currentQuestion?.order}}
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

      <!-- Результат ответа
      <Transition name="result-fade">
        <div
            v-if="phase === 'submitted' && lastResult"
            class="result-banner"
            :class="lastResult.is_correct ? 'result-correct' : 'result-wrong'"
        >
          <span class="result-icon">{{ lastResult.is_correct ? '✅' : '❌' }}</span>
          <div class="result-text">
            <strong>{{ lastResult.is_correct ? 'Правильно!' : 'Неправильно' }}</strong>
            <p v-if="lastResult.explanation" class="result-explanation">
              {{ lastResult.explanation }}
            </p>
          </div>
        </div>
      </Transition>-->

    </template>

    <!-- Модалка контекста -->
    <ContextModal :context="props.context" />

  </div>
</template>

<style scoped lang="scss">
.quiz-runner {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
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
</style>