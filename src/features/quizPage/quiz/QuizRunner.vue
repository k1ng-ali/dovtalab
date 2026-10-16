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
import SadIcon from '@iconify-vue/solar/sad-circle-linear'
import ReadIcon from '@iconify-vue/solar/book-2-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-linear'
import CloseIcon from '@iconify-vue/solar/close-circle-linear'
import ListIcon from '@iconify-vue/solar/notebook-linear'
import StarIcon from '@iconify-vue/solar/star-linear'
import DoneIcon from '@iconify-vue/solar/confetti-minimalistic-linear'

const props = defineProps<{
  quiz: QuizIn
  context: ContextIn | null
  mode?: QuizMode
  questionLimit?: number
  clusterId?: number | null
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
    currentQuestion.value = await quizStore.startQuiz(props.quiz.id, props.context?.id, props.mode ?? 'practice', props.questionLimit, props.clusterId ?? undefined)
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
    currentQuestion.value = await quizStore.startQuiz(props.quiz.id, undefined, props.mode ?? 'practice', props.questionLimit, props.clusterId ?? undefined)
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
      <div class="ui-skeleton skeleton-q" />
      <div class="ui-skeleton skeleton-opt" v-for="i in 4" :key="i" />
    </div>

    <!-- Ошибка при старте: нет вопросов или сервер недоступен -->
    <div v-else-if="startError" class="finish ui-card">
      <span class="finish__icon finish__icon--muted"><SadIcon /></span>
      <h2 class="finish__title">{{ t('quiz.cantStart') }}</h2>
      <p class="finish__sub">{{ t('quiz.cantStartDesc') }}</p>
      <button type="button" class="ui-btn ui-btn--primary ui-btn--block" @click="emit('finish')">{{ t('quiz.backToList') }}</button>
    </div>

    <!-- Экран чтения контекста перед стартом -->
    <div v-else-if="showingContext && context" class="context-reading">
      <div class="context-card ui-card">
        <span class="ui-chip ui-chip--teal context-card__badge"><ReadIcon />{{ t('quiz.readText') }}</span>
        <h3 class="context-card__title">{{ context.title }}</h3>
        <p class="context-card__text">{{ context.text }}</p>

        <div v-if="context.rule" class="context-card__rule">
          <p class="context-card__rule-label">{{ t('quiz.rule') }}</p>
          <p class="context-card__rule-text">{{ context.rule }}</p>
        </div>
      </div>

      <p class="context-reading__hint">{{ t('quiz.contextHint') }}</p>
    </div>

    <!-- Финальный экран -->
    <div v-else-if="finished" class="finish ui-card">
      <!-- Exam mode: детальный результат -->
      <template v-if="examResult">
        <h2 class="finish__title">
          {{ examResult.score >= 70 ? t('quiz.excellent') : examResult.score >= 40 ? t('quiz.notBad') : t('quiz.needWork') }}
        </h2>

        <div class="score-ring">
          <svg viewBox="0 0 120 120" width="148" height="148" class="score-ring__svg">
            <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(23, 46, 74, 0.08)" stroke-width="10" />
            <circle
                cx="60" cy="60" r="50" fill="none"
                :stroke="examResult.score >= 40 ? 'var(--c-correct)' : 'var(--c-wrong)'"
                stroke-width="10" stroke-linecap="round"
                :stroke-dasharray="314"
                :stroke-dashoffset="314 - (examResult.score / 100) * 314"
                class="score-ring__progress"
            />
          </svg>
          <span class="score-ring__value">{{ examResult.score }}%</span>
        </div>

        <div class="finish__stats">
          <div class="ui-stat">
            <span class="ui-stat__label"><CheckIcon class="ic-correct" />{{ t('quiz.correctCount') }}</span>
            <b class="ui-stat__value">{{ examResult.correct_count }}</b>
          </div>
          <div class="ui-stat">
            <span class="ui-stat__label"><CloseIcon class="ic-wrong" />{{ t('quiz.errors') }}</span>
            <b class="ui-stat__value">{{ examResult.total_count - examResult.correct_count }}</b>
          </div>
          <div class="ui-stat">
            <span class="ui-stat__label"><ListIcon />{{ t('quiz.questions') }}</span>
            <b class="ui-stat__value">{{ examResult.total_count }}/{{ examResult.total_questions }}</b>
          </div>
          <div class="ui-stat">
            <span class="ui-stat__label"><StarIcon />{{ t('quiz.pointsEarned') }}</span>
            <b class="ui-stat__value">{{ examResult.earned_points }}</b>
          </div>
        </div>

        <button type="button" class="ui-btn ui-btn--primary ui-btn--block" @click="emit('finish')">{{ t('quiz.backToQuiz') }}</button>
      </template>

      <!-- Practice mode: простой финиш -->
      <template v-else>
        <span class="finish__icon"><DoneIcon /></span>
        <h2 class="finish__title">{{ t('quiz.finished') }}</h2>
        <p class="finish__sub">{{ t('quiz.answeredN', { n: answeredCount }) }}</p>
        <button type="button" class="ui-btn ui-btn--primary ui-btn--block" @click="emit('finish')">{{ t('quiz.backToQuiz') }}</button>
      </template>
    </div>

    <!-- Тест -->
    <template v-else-if="currentQuestion">

      <!-- Прогресс-бар и счётчик для быстрого теста -->
      <div v-if="props.mode === 'exam' && props.questionLimit" class="exam-progress">
        <div class="exam-progress__info">
          <span class="exam-progress__label">{{ t('quiz.questionNofM', { n: answeredCount + 1, m: props.questionLimit }) }}</span>
          <span class="ui-chip ui-chip--teal"><CheckIcon />{{ correctCount }}</span>
        </div>
        <div class="ui-progress">
          <div class="ui-progress__fill" :style="{ width: ((answeredCount) / props.questionLimit * 100) + '%' }" />
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
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Чтение контекста ── */
.context-reading {
  display: flex;
  flex-direction: column;
  gap: 12px;

  &__hint {
    margin: 0;
    text-align: center;
    font-size: 13px;
    color: var(--c-muted);
  }
}

.context-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;

  &__badge { align-self: flex-start; :deep(svg) { font-size: 14px; } }

  &__title {
    margin: 0;
    font-size: var(--fs-h2);
    font-weight: 800;
    color: var(--c-navy-900);
  }

  &__text {
    margin: 0;
    font-size: 16px;
    line-height: 1.65;
    color: var(--c-ink);
    white-space: pre-wrap;
  }

  &__rule {
    padding: 12px 14px;
    border-radius: var(--r-md);
    background: var(--c-teal-tint);
  }

  &__rule-label {
    margin: 0 0 4px;
    font-size: 12px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--c-teal-600);
  }

  &__rule-text { margin: 0; font-size: 14px; line-height: 1.5; color: var(--c-ink); }
}

/* ── Счётчики ── */
.counter {
  margin: 0;
  padding: 0 6px;
  font-size: 13px;
  font-weight: 700;
  color: var(--c-muted);
}

.exam-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 6px;

  &__info { display: flex; justify-content: space-between; align-items: center; }
  &__label { font-size: 13px; font-weight: 700; color: var(--c-muted); }
  :deep(.ui-chip svg) { font-size: 14px; }
}

.question-card { display: flex; flex-direction: column; }

.qslide-enter-active,
.qslide-leave-active {
  transition: all 0.22s ease;
}
.qslide-enter-from { opacity: 0; transform: translateX(24px); }
.qslide-leave-to { opacity: 0; transform: translateX(-24px); }

/* ── Финиш ── */
.finish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 28px 20px 20px;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 72px;
    height: 72px;
    border-radius: 24px;
    background: var(--grad-primary);
    color: #FFFFFF;
    font-size: 36px;
    box-shadow: var(--shadow-hero);

    &--muted { background: rgba(35, 73, 112, 0.08); color: var(--c-ink-2); box-shadow: none; }
  }

  &__title { margin: 0; font-size: var(--fs-h1); font-weight: 800; color: var(--c-navy-900); }
  &__sub { margin: 0 0 6px; font-size: 14px; color: var(--c-muted); max-width: 320px; }

  &__stats {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
    width: 100%;
    margin-bottom: 6px;
    text-align: left;

    .ui-stat { box-shadow: none; background: rgba(255, 255, 255, 0.7); }
    .ui-stat__label { display: inline-flex; align-items: center; gap: 6px; }
  }
}

.ic-correct { color: var(--c-correct); }
.ic-wrong { color: var(--c-wrong); }

.score-ring {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 4px 0 6px;

  &__svg { transform: rotate(-90deg); }
  &__progress { transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1); }

  &__value {
    position: absolute;
    font-size: 34px;
    font-weight: 800;
    color: var(--c-navy-900);
  }
}

/* ── Загрузка ── */
.loading-state {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-q { height: 120px; }
.skeleton-opt { height: 58px; border-radius: var(--r-md); }
</style>
