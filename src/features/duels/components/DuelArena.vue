<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import type { DuelGameState } from '../types.ts'
import type { UserAnswerPayload } from '@/features/quizPage/types.ts'
import type { QuestionPublic } from '@/features/quizPage/types.ts'
import SingleChoice from '@/features/quizPage/quiz/questions/SingleChoice.vue'
import MultipleChoice from '@/features/quizPage/quiz/questions/MultipleChoice.vue'
import Matching from '@/features/quizPage/quiz/questions/Matching.vue'
import InputQuestion from '@/features/quizPage/quiz/questions/InputQuestion.vue'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  gameState: DuelGameState
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  (e: 'answer', answer: UserAnswerPayload): void
}>()

const navStore = useNavStore()
const { t } = useI18n()

const currentAnswer = ref<any>(null)
const hasSubmitted = ref(false)
const answerResult = ref<boolean | null>(null)

// Адаптируем DTO под единый интерфейс QuestionPublic
const questionPublic = computed<QuestionPublic>(() => {
  const q = props.gameState.question
  return {
    id: q.id,
    text: q.text,
    type: q.type as QuestionPublic['type'],
    payload: q.payload as QuestionPublic['payload'],
    order: q.round_number,
    attempt: null as any,
  }
})

const hasAnswer = computed(() => {
  const a = currentAnswer.value
  if (a === null || a === undefined) return false
  if (typeof a === 'string') return a.trim().length > 0
  if (Array.isArray(a)) return a.length > 0
  if (typeof a === 'object') return Object.keys(a).length > 0
  return true
})

// ── Таймер раунда ─────────────────────────────────────────────────────
// Сервер отдаёт остаток в мс, дедлайн считаем по локальным часам от момента получения
const roundDeadline = ref<number | null>(null)
const now = ref(Date.now())
let tickTimer: ReturnType<typeof setInterval> | null = null

function resetDeadline() {
  const left = props.gameState.question.round_time_left_ms
  roundDeadline.value = left === null || left === undefined ? null : Date.now() + left
}

const secondsLeft = computed(() =>
  roundDeadline.value === null ? null : Math.max(0, Math.ceil((roundDeadline.value - now.value) / 1000))
)
const isTimeUp = computed(() => secondsLeft.value === 0)

// Синхронизация кнопки в нижнем баре через NavStore
watch([hasAnswer, hasSubmitted, isTimeUp, () => props.isSubmitting], () => {
  navStore.updateAction(1, {
    label: hasSubmitted.value ? t('duels.waitingOpponent') : isTimeUp.value ? t('duels.timeUp') : t('quiz.answer'),
    disabled: !hasAnswer.value || hasSubmitted.value || isTimeUp.value || props.isSubmitting,
  })
})

// Ответ не принят (сеть, 422) — даём отправить снова
function resetSubmit() {
  hasSubmitted.value = false
}

defineExpose({ resetSubmit })

function buildAnswerPayload(): UserAnswerPayload | null {
  const a = currentAnswer.value
  const type = questionPublic.value.type

  if (type === 'single_choice') return { type, selected_option_id: Number(a) }
  if (type === 'multiple_choice') return { type, selected_option_ids: a as number[] }
  if (type === 'matching') return { type, pairs: a as Record<string, number> }
  if (type === 'input') return { type, answer_text: String(a) }
  return null
}

function submit() {
  if (hasSubmitted.value || !hasAnswer.value || isTimeUp.value) return
  const payload = buildAnswerPayload()
  if (!payload) return

  hasSubmitted.value = true
  emit('answer', payload)
}

// Сброс состояния при смене раунда
watch(
  () => props.gameState.question.round_number,
  () => {
    currentAnswer.value = null
    hasSubmitted.value = false
    answerResult.value = null
    resetDeadline()
  }
)

onMounted(() => {
  resetDeadline()
  tickTimer = setInterval(() => (now.value = Date.now()), 250)
  window.addEventListener('duel-submit-answer', submit)
})

onUnmounted(() => {
  if (tickTimer) clearInterval(tickTimer)
  window.removeEventListener('duel-submit-answer', submit)
})
</script>

<template>
  <div class="duel-arena">
    <div class="round-tracker">
      <span>{{ $t('duels.roundNofM', { n: gameState.question.round_number, m: gameState.question.total_questions }) }}</span>
      <span v-if="secondsLeft !== null" class="round-timer" :class="{ urgent: secondsLeft <= 5 }">
        ⏱ {{ $t('units.sec', { n: secondsLeft }) }}
      </span>
    </div>

    <div class="question-card">
      <SingleChoice
        v-if="questionPublic.type === 'single_choice'"
        :key="questionPublic.id"
        :question="questionPublic"
        :disabled="hasSubmitted || isSubmitting || isTimeUp"
        @answer="currentAnswer = $event"
      />
      <MultipleChoice
        v-else-if="questionPublic.type === 'multiple_choice'"
        :key="questionPublic.id + '-multiple'"
        :question="questionPublic"
        :disabled="hasSubmitted || isSubmitting || isTimeUp"
        @answer="currentAnswer = $event"
      />
      <Matching
        v-else-if="questionPublic.type === 'matching'"
        :key="questionPublic.id + '-matching'"
        :question="questionPublic"
        :disabled="hasSubmitted || isSubmitting || isTimeUp"
        @answer="currentAnswer = $event"
      />
      <InputQuestion
        v-else-if="questionPublic.type === 'input'"
        :key="questionPublic.id + '-input'"
        :question="questionPublic"
        :disabled="hasSubmitted || isSubmitting || isTimeUp"
        @answer="currentAnswer = $event"
      />
    </div>

    <div v-if="hasSubmitted" class="waiting-indicator">
      <div class="loader-dot" />
      <span>{{ $t('duels.answerSent') }}</span>
    </div>
    <div v-else-if="isTimeUp" class="waiting-indicator">
      <div class="loader-dot" />
      <span>{{ $t('duels.timeUpDesc') }}</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.duel-arena {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.round-tracker {
  display: flex;
  justify-content: center;
  gap: 12px;
  text-align: center;
  span {
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    color: #4ebec2;
    text-transform: uppercase;
  }
  .round-timer {
    color: #234970;
    font-variant-numeric: tabular-nums;
    &.urgent {
      color: #e5484d;
    }
  }
}

.question-card {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
}

.waiting-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(78, 190, 194, 0.08);
  color: #234970;
  font-size: 13px;
  font-weight: 600;
}

.loader-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #4ebec2;
  animation: pulse 1s infinite alternate;
}

@keyframes pulse {
  0% { transform: scale(0.8); opacity: 0.4; }
  100% { transform: scale(1.2); opacity: 1; }
}
</style>