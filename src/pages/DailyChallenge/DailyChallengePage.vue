<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDailyChallenge, startDailyChallenge, submitDailyAnswer } from '@/features/mainPage/dailyChallenge/api.ts'
import type { DailyChallengeData } from '@/features/mainPage/dailyChallenge/api.ts'
import type { QuestionPublic, AttemptResult, UserAnswerPayload } from '@/features/quizPage/types.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import { useI18n } from 'vue-i18n'
import DoneIcon from '@iconify-vue/solar/confetti-minimalistic-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-linear'
import FireIcon from '@iconify-vue/solar/fire-linear'
import { http } from '@/shared/api/http.ts'

import SingleChoice from '@/features/quizPage/quiz/questions/SingleChoice.vue'
import MultipleChoice from '@/features/quizPage/quiz/questions/MultipleChoice.vue'
import Matching from '@/features/quizPage/quiz/questions/Matching.vue'
import InputQuestion from '@/features/quizPage/quiz/questions/InputQuestion.vue'

const router = useRouter()
const headerStore = useHeaderStore()
const navStore = useNavStore()
const { t } = useI18n()

const challenge = ref<DailyChallengeData | null>(null)
const currentQuestion = ref<QuestionPublic | null>(null)
const loading = ref(true)
const phase = ref<'answering' | 'submitted'>('answering')
const lastResult = ref<AttemptResult | null>(null)
const currentAnswer = ref<any>(null)
const finished = ref(false)
const correctCount = ref(0)
const currentIndex = ref(0)

const hasAnswer = computed(() => {
  const a = currentAnswer.value
  if (a === null || a === undefined) return false
  if (typeof a === 'string') return a.trim().length > 0
  if (Array.isArray(a)) return a.length > 0
  if (typeof a === 'object') return Object.keys(a).length > 0
  return true
})

// Reactively update nav button state
watch([hasAnswer, phase], () => syncNav())

onMounted(async () => {
  headerStore.setTitle(t('daily.title'))
  headerStore.setLeftAction({ icon: BsArrowLeft, onClick: goBack })
  syncNav()

  try {
    const { data } = await getDailyChallenge()
    challenge.value = data
    correctCount.value = data.correct_count
    currentIndex.value = data.answered_count

    if (data.completed || !data.question_ids?.length) {
      finished.value = true
      loading.value = false
      return
    }

    await loadNextQuestion()
  } catch (e) {
    console.error(e)
    finished.value = true
  } finally {
    loading.value = false
  }
})

onUnmounted(() => {
  headerStore.reset()
  navStore.showTabs()
})

async function loadNextQuestion() {
  try {
    const { data } = await startDailyChallenge()
    currentQuestion.value = data as QuestionPublic
    phase.value = 'answering'
    currentAnswer.value = null
    lastResult.value = null
  } catch (e: any) {
    // 400 = already completed, 404 = no questions
    finished.value = true
  }
}

function syncNav() {
  navStore.showActions([
    { label: t('common.back'), icon: BsArrowLeft, variant: 'default', onClick: goBack },
    {
      label: phase.value === 'submitted' ? t('common.next') : t('quiz.answer'),
      variant: 'primary',
      disabled: phase.value === 'answering' ? !hasAnswer.value : false,
      onClick: phase.value === 'submitted' ? nextQuestion : submitAnswer,
    },
  ])
}

async function submitAnswer() {
  if (!currentQuestion.value || !hasAnswer.value) return

  const payload = buildPayload()
  if (!payload) return

  try {
    const { data } = await http.post(`/attempts/${currentQuestion.value.attempt.id}/submit`, { answer: payload })
    const result = data as any
    lastResult.value = result.attempt.result
    phase.value = 'submitted'

    const isCorrect = result.attempt.result.is_correct
    if (isCorrect) correctCount.value++
    currentIndex.value++

    // Track in daily challenge
    await submitDailyAnswer(currentQuestion.value.id, isCorrect)
  } catch (e) {
    console.error(e)
  }
}

function nextQuestion() {
  if (challenge.value && currentIndex.value >= challenge.value.total_questions) {
    finished.value = true
    return
  }
  loadNextQuestion()
}

function buildPayload(): UserAnswerPayload | null {
  if (!currentQuestion.value) return null
  const q = currentQuestion.value
  const a = currentAnswer.value

  if (q.type === 'single_choice') return { type: 'single_choice', selected_option_id: a }
  if (q.type === 'multiple_choice') return { type: 'multiple_choice', selected_option_ids: a }
  if (q.type === 'matching') return { type: 'matching', pairs: a }
  if (q.type === 'input') return { type: 'input', answer_text: a }
  return null
}

function goBack() {
  router.push('/')
}
</script>

<template>
  <div class="daily ui-page">
    <!-- Загрузка -->
    <template v-if="loading">
      <div class="ui-skeleton daily__skeleton-bar" />
      <div class="ui-skeleton daily__skeleton-q" />
      <div class="ui-skeleton daily__skeleton-opt" v-for="i in 4" :key="i" />
    </template>

    <!-- Итог -->
    <div v-else-if="finished" class="finish ui-card">
      <span class="finish__icon"><DoneIcon /></span>
      <h2 class="finish__title">{{ $t('daily.finished') }}</h2>
      <div class="finish__stats" v-if="challenge">
        <span class="ui-chip ui-chip--teal"><CheckIcon />{{ $t('daily.correctOf', { n: correctCount, m: challenge.total_questions }) }}</span>
        <span class="ui-chip ui-chip--warning" v-if="challenge.streak"><FireIcon />{{ $t('daily.streak') }}: {{ $t('plural.days', challenge.streak + 1) }}</span>
      </div>
      <button type="button" class="ui-btn ui-btn--primary ui-btn--block" @click="goBack">{{ $t('daily.toHome') }}</button>
    </div>

    <!-- Вопрос -->
    <template v-else-if="currentQuestion">
      <div class="progress">
        <div class="progress__info">
          <span class="progress__label">{{ $t('daily.questionOf', { n: currentIndex + 1, m: challenge?.total_questions }) }}</span>
          <span class="ui-chip ui-chip--teal"><CheckIcon />{{ correctCount }}</span>
        </div>
        <div class="ui-progress">
          <div class="ui-progress__fill" :style="{ width: (currentIndex / (challenge?.total_questions ?? 10) * 100) + '%' }" />
        </div>
      </div>

      <div class="question" :key="currentQuestion.id">
        <SingleChoice
          v-if="currentQuestion.type === 'single_choice'"
          :question="currentQuestion"
          :disabled="phase === 'submitted'"
          :result="lastResult ?? undefined"
          @answer="(v) => { currentAnswer = v }"
        />
        <MultipleChoice
          v-else-if="currentQuestion.type === 'multiple_choice'"
          :question="currentQuestion"
          :disabled="phase === 'submitted'"
          :result="lastResult ?? undefined"
          @answer="(v) => { currentAnswer = v }"
        />
        <Matching
          v-else-if="currentQuestion.type === 'matching'"
          :question="currentQuestion"
          :disabled="phase === 'submitted'"
          :result="lastResult ?? undefined"
          @answer="(v) => { currentAnswer = v }"
        />
        <InputQuestion
          v-else-if="currentQuestion.type === 'input'"
          :question="currentQuestion"
          :disabled="phase === 'submitted'"
          :result="lastResult ?? undefined"
          @answer="(v) => { currentAnswer = v }"
        />
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
.daily {
  max-width: 760px;

  &__skeleton-bar { height: 28px; }
  &__skeleton-q { height: 120px; }
  &__skeleton-opt { height: 58px; border-radius: var(--r-md); }
}

.progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 6px;

  &__info { display: flex; justify-content: space-between; align-items: center; }
  &__label { font-size: 13px; font-weight: 700; color: var(--c-muted); }
  :deep(.ui-chip svg) { font-size: 14px; }
}

.question { display: flex; flex-direction: column; }

/* ── Итог ── */
.finish {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 14px;
  max-width: 440px;
  width: 100%;
  margin: 24px auto 0;
  padding: 30px 20px 20px;
  box-sizing: border-box;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    border-radius: 26px;
    background: var(--grad-primary);
    color: #FFFFFF;
    font-size: 38px;
    box-shadow: var(--shadow-hero);
  }

  &__title { margin: 0; font-size: var(--fs-h1); font-weight: 800; color: var(--c-navy-900); }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    margin-bottom: 6px;

    :deep(svg) { font-size: 14px; }
  }
}
</style>
