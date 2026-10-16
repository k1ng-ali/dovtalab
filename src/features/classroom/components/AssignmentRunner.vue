<script setup lang="ts">
// Прохождение задания учителя: старт/продолжение, таймер, скрытая обратная связь, сдача.
// Переиспользует компоненты вопросов из quizPage и обычные /attempts/{id}/submit|next.
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import * as quizApi from '@/features/quizPage/api.ts'
import * as api from '../api.ts'
import { assignmentError, questionsCount } from '../format.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import SingleChoice from '@/features/quizPage/quiz/questions/SingleChoice.vue'
import MultipleChoice from '@/features/quizPage/quiz/questions/MultipleChoice.vue'
import Matching from '@/features/quizPage/quiz/questions/Matching.vue'
import InputQuestion from '@/features/quizPage/quiz/questions/InputQuestion.vue'
import type { AttemptResult, QuestionPublic, UserAnswerPayload } from '@/features/quizPage/types.ts'
import type { AssignmentFinish, StudentAssignment } from '../types.ts'

const props = defineProps<{
  assignment: StudentAssignment
}>()

const emit = defineEmits<{
  (e: 'finished', result: AssignmentFinish | null): void
  (e: 'error', message: string): void
}>()

const { t } = useI18n()
const navStore = useNavStore()
const headerStore = useHeaderStore()

// ── State ─────────────────────────────────────────────────────────────────────
const loading = ref(true)
const question = ref<QuestionPublic | null>(null)
const hideFeedback = ref(true)
const expiresAt = ref<number | null>(null)
const now = ref(Date.now())
const phase = ref<'answering' | 'submitted'>('answering')
const lastResult = ref<AttemptResult | null>(null)
const currentAnswer = ref<any>(null)
const answeredCount = ref(0)
const isBusy = ref(false)
const isFinishing = ref(false)

const total = computed(() => questionsCount(props.assignment))

let timer: ReturnType<typeof setInterval> | null = null

// ── Таймер ────────────────────────────────────────────────────────────────────
const secondsLeft = computed(() =>
  expiresAt.value == null ? null : Math.max(0, Math.floor((expiresAt.value - now.value) / 1000))
)

const timeText = computed(() => {
  const s = secondsLeft.value
  if (s == null) return ''
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
})

watch(secondsLeft, (s) => {
  if (s === 0 && !isFinishing.value) {
    headerStore.showNotification(t('classes.timeUp'), 'error', 2500)
    finish()
  }
})

// ── Ответ ─────────────────────────────────────────────────────────────────────
const hasAnswer = computed(() => {
  const a = currentAnswer.value
  if (a === null || a === undefined) return false
  if (typeof a === 'string') return a.trim().length > 0
  if (Array.isArray(a)) return a.length > 0
  if (typeof a === 'object') return Object.keys(a).length > 0
  return true
})

function buildAnswer(): UserAnswerPayload | null {
  const q = question.value
  const a = currentAnswer.value
  if (!q || a === null || a === undefined) return null
  switch (q.type) {
    case 'single_choice': return { type: 'single_choice', selected_option_id: a as number }
    case 'multiple_choice': return { type: 'multiple_choice', selected_option_ids: a as number[] }
    case 'matching': return { type: 'matching', pairs: a as Record<string, number> }
    case 'input': return { type: 'input', answer_text: String(a) }
    default: return null
  }
}

function onAnswer(val: any) {
  if (phase.value === 'answering') currentAnswer.value = val
}

// ── Навигатор: «Сдать работу» + «Ответить/Дальше» ────────────────────────────
function syncNav() {
  navStore.showActions([
    {
      label: t('classes.submitWork'),
      variant: 'default',
      disabled: isFinishing.value || loading.value,
      onClick: confirmFinish,
    },
    {
      label: phase.value === 'submitted' ? t('classes.next') : t('classes.answer'),
      variant: 'primary',
      disabled: isBusy.value || (phase.value === 'answering' && !hasAnswer.value),
      onClick: submitOrNext,
    },
  ])
}

watch([hasAnswer, phase, isBusy, isFinishing, loading], syncNav)

// ── Поток ─────────────────────────────────────────────────────────────────────
async function start() {
  loading.value = true
  try {
    const { data } = await api.startAssignment(props.assignment.id)
    question.value = data as QuestionPublic
    hideFeedback.value = data.hide_feedback
    expiresAt.value = data.expires_at ? new Date(data.expires_at).getTime() : null
    // Продолжение: сколько уже отвечено
    answeredCount.value = data.answered_count
  } catch (e) {
    emit('error', assignmentError(e))
  } finally {
    loading.value = false
  }
}

async function submitOrNext() {
  if (!question.value || isBusy.value || isFinishing.value) return

  if (phase.value === 'submitted') {
    await loadNext()
    return
  }

  const answer = buildAnswer()
  if (!answer) return
  isBusy.value = true
  try {
    const { data } = await quizApi.submitAnswer({ id: question.value.attempt.id, answer })
    answeredCount.value = data.progress.total_count

    if (data.progress.is_finished) {
      await finish()
      return
    }

    if (hideFeedback.value || !data.attempt.result) {
      // Обратная связь скрыта учителем — сразу следующий вопрос
      await loadNext()
      return
    }

    lastResult.value = data.attempt.result
    phase.value = 'submitted'
    headerStore.showNotification(
      data.attempt.result.is_correct ? t('classes.correct') : t('classes.wrong'),
      data.attempt.result.is_correct ? 'success' : 'error',
      1800,
    )
  } catch (e) {
    const message = assignmentError(e, t('duels.submitFailed'))
    if ((e as any)?.response?.status === 409) {
      // Время вышло / работа уже сдана
      headerStore.showNotification(message, 'error', 2500)
      await finish()
    } else {
      headerStore.showNotification(message, 'error', 2500)
    }
  } finally {
    isBusy.value = false
  }
}

async function loadNext() {
  if (!question.value) return
  isBusy.value = true
  try {
    const { data } = await quizApi.nextQuestion(question.value.attempt.quiz_attempt_id)
    question.value = data
    currentAnswer.value = null
    lastResult.value = null
    phase.value = 'answering'
  } catch {
    // 404 — вопросы закончились / время вышло
    await finish()
  } finally {
    isBusy.value = false
  }
}

function confirmFinish() {
  if (isFinishing.value) return
  Modal.confirm({
    title: t('classes.submitWork'),
    content: t('classes.submitConfirm'),
    okText: t('classes.submitWork'),
    cancelText: t('common.cancel'),
    onOk: finish,
  })
}

async function finish() {
  if (isFinishing.value) return
  isFinishing.value = true
  if (timer) clearInterval(timer)
  try {
    const { data } = await api.finishAssignment(props.assignment.id)
    emit('finished', data)
  } catch {
    emit('finished', null)
  }
}

onMounted(async () => {
  syncNav()
  timer = setInterval(() => { now.value = Date.now() }, 1000)
  await start()
  syncNav()
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<template>
  <div class="runner">
    <div v-if="loading" class="loading">
      <div class="skeleton skeleton--q" />
      <div class="skeleton" v-for="i in 4" :key="i" />
    </div>

    <template v-else-if="question">
      <!-- Прогресс + таймер -->
      <div class="progress">
        <div class="progress__info">
          <span class="progress__label">
            {{ t('classes.questionNofM', { n: Math.min(answeredCount + 1, total), m: total }) }}
          </span>
          <span v-if="secondsLeft != null" class="progress__timer" :class="{ 'progress__timer--low': secondsLeft < 60 }">
            ⏱ {{ timeText }}
          </span>
        </div>
        <div class="progress__track">
          <div class="progress__fill" :style="{ width: (answeredCount / Math.max(1, total)) * 100 + '%' }" />
        </div>
      </div>

      <Transition name="qslide" mode="out-in">
        <div class="question-card" :key="question.id">
          <SingleChoice v-if="question.type === 'single_choice'" :question="question"
                        :disabled="phase === 'submitted'" :result="lastResult" @answer="onAnswer" />
          <MultipleChoice v-else-if="question.type === 'multiple_choice'" :question="question"
                          :disabled="phase === 'submitted'" :result="lastResult" @answer="onAnswer" />
          <Matching v-else-if="question.type === 'matching'" :question="question"
                    :disabled="phase === 'submitted'" :result="lastResult" @answer="onAnswer" />
          <InputQuestion v-else-if="question.type === 'input'" :question="question"
                         :disabled="phase === 'submitted'" :result="lastResult" @answer="onAnswer" />
        </div>
      </Transition>
    </template>
  </div>
</template>

<style scoped lang="scss">
.runner {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px 0;
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__info { display: flex; justify-content: space-between; align-items: center; }
  &__label { font-size: 14px; font-weight: 600; color: #234970; }

  &__timer {
    padding: 4px 12px;
    border-radius: 20px;
    background: rgba(78, 190, 194, 0.12);
    color: #234970;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    font-size: 14px;

    &--low { background: rgba(239, 68, 68, 0.12); color: #EF4444; }
  }

  &__track { height: 6px; border-radius: 3px; background: rgba(0, 0, 0, 0.06); overflow: hidden; }
  &__fill {
    height: 100%;
    border-radius: 3px;
    background: linear-gradient(90deg, var(--c-teal-400), var(--c-teal-600));
    transition: width 0.3s ease;
  }
}

.loading { display: flex; flex-direction: column; gap: 10px; }

.skeleton {
  height: 52px;
  border-radius: 16px;
  background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;

  &--q { height: 110px; }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.qslide-enter-active, .qslide-leave-active { transition: all 0.22s ease; }
.qslide-enter-from { opacity: 0; transform: translateX(24px); }
.qslide-leave-to { opacity: 0; transform: translateX(-24px); }
</style>
