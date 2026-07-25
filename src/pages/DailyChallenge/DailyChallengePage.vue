<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { getDailyChallenge, startDailyChallenge, submitDailyAnswer } from '@/features/mainPage/dailyChallenge/api.ts'
import type { DailyChallengeData } from '@/features/mainPage/dailyChallenge/api.ts'
import type { QuestionPublic, AttemptResult, UserAnswerPayload } from '@/features/quizPage/types.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import { BsArrowLeft } from '@kalimahapps/vue-icons'
import { http } from '@/shared/api/http.ts'

import SingleChoice from '@/features/quizPage/quiz/questions/SingleChoice.vue'
import MultipleChoice from '@/features/quizPage/quiz/questions/MultipleChoice.vue'
import Matching from '@/features/quizPage/quiz/questions/Matching.vue'
import InputQuestion from '@/features/quizPage/quiz/questions/InputQuestion.vue'

const router = useRouter()
const headerStore = useHeaderStore()
const navStore = useNavStore()

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
  headerStore.setTitle('Ежедневный вызов')
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
    { label: 'Назад', icon: BsArrowLeft, variant: 'default', onClick: goBack },
    {
      label: phase.value === 'submitted' ? 'Далее' : 'Ответить',
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
  <div class="daily-page">
    <!-- Loading -->
    <div v-if="loading" class="dc-loading">
      <div class="spinner" />
    </div>

    <!-- Finished -->
    <div v-else-if="finished" class="dc-finished">
      <div class="finish-icon">🎉</div>
      <h2 class="finish-title">Челлендж завершён!</h2>
      <div class="finish-stats" v-if="challenge">
        <span class="finish-stat">✅ {{ correctCount }} / {{ challenge.total_questions }} правильно</span>
        <span class="finish-stat" v-if="challenge.streak">🔥 Streak: {{ challenge.streak + 1 }} дней</span>
      </div>
      <button class="finish-btn" @click="goBack">На главную</button>
    </div>

    <!-- Question -->
    <div v-else-if="currentQuestion" class="dc-question">
      <div class="dc-progress-header">
        <span>Вопрос {{ currentIndex + 1 }} / {{ challenge?.total_questions }}</span>
        <span class="dc-correct">✅ {{ correctCount }}</span>
      </div>

      <div class="dc-progress-bar">
        <div class="dc-progress-fill" :style="{ width: (currentIndex / (challenge?.total_questions ?? 10) * 100) + '%' }" />
      </div>

      <div class="question-card" :key="currentQuestion.id">
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
    </div>
  </div>
</template>

<style scoped lang="scss">
.daily-page {
  min-height: 100vh;
  background: #F6F6F6;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 80px 20px 120px;
}

.dc-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.spinner {
  width: 32px;
  height: 32px;
  border: 3px solid rgba(0,0,0,0.1);
  border-top-color: #4EBEC2;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Question ── */
.dc-question {
  width: 100%;
  max-width: 700px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.dc-progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.dc-correct {
  font-weight: 600;
  color: #10B981;
}

.dc-progress-bar {
  height: 5px;
  border-radius: 5px;
  background: rgba(0,0,0,0.06);
  overflow: hidden;
}

.dc-progress-fill {
  height: 100%;
  border-radius: 5px;
  background: linear-gradient(90deg, #4EBEC2, #234970);
  transition: width 0.3s ease;
}

.question-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  padding: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
}

/* ── Finished ── */
.dc-finished {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  text-align: center;
  padding-top: 60px;
  max-width: 400px;
}

.finish-icon {
  font-size: 64px;
}

.finish-title {
  color: #234970;
  margin: 0;
}

.finish-stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.finish-stat {
  font-size: 16px;
  color: #4B5563;
}

.finish-btn {
  margin-top: 20px;
  padding: 12px 32px;
  background: linear-gradient(135deg, #4EBEC2, #234970);
  color: #fff;
  border: none;
  border-radius: 16px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.2s;

  &:active {
    transform: scale(0.97);
  }
}
</style>
