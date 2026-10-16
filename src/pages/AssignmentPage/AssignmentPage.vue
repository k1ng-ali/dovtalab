<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import { useClassroomStore } from '@/features/classroom/store.ts'
import AssignmentRunner from '@/features/classroom/components/AssignmentRunner.vue'
import AssignmentReview from '@/features/classroom/components/AssignmentReview.vue'
import { attemptsText, dueLeft, formatDateTime, questionsCount } from '@/features/classroom/format.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import type { AssignmentFinish } from '@/features/classroom/types.ts'

type View = 'info' | 'run' | 'result'

const route = useRoute()
const router = useRouter()
const store = useClassroomStore()
const { current: assignment, review } = storeToRefs(store)
const headerStore = useHeaderStore()
const navStore = useNavStore()
const { t } = useI18n()

const view = ref<View>('info')
const isLoading = ref(true)
const notFound = ref(false)
const finishResult = ref<AssignmentFinish | null>(null)
const errorText = ref('')

const assignmentId = computed(() => Number(route.params.assignmentId))

const isDone = computed(() =>
  assignment.value?.student_status === 'completed' || assignment.value?.student_status === 'late'
)

const startLabel = computed(() => {
  const a = assignment.value
  if (!a) return ''
  if (a.student_status === 'in_progress') return t('classes.continue')
  if (isDone.value) return t('classes.retry')
  return t('classes.start')
})

const rules = computed(() => {
  const a = assignment.value
  if (!a) return []
  const list = [a.mode === 'exam' ? t('classes.ruleExam') : t('classes.rulePractice')]
  if (a.time_limit_min) list.push(t('classes.ruleTimer', { n: a.time_limit_min }))
  const answers: Record<string, string> = {
    immediately: t('classes.ruleImmediate'),
    after_finish: t('classes.ruleAfterFinish'),
    after_due: t('classes.ruleAfterDue'),
    never: t('classes.ruleNever'),
  }
  list.push(answers[a.show_answers] ?? '')
  if (a.allow_late && a.due_at) list.push(t('classes.ruleLate'))
  return list
})

// ── Загрузка ─────────────────────────────────────────────────────────────────
async function load() {
  isLoading.value = true
  notFound.value = false
  errorText.value = ''
  try {
    const a = await store.fetchAssignment(assignmentId.value)
    if (a.can_view_result && isDone.value) store.fetchReview(a.id).catch(() => {})
  } catch {
    notFound.value = true
  } finally {
    isLoading.value = false
  }
}

onMounted(load)
watch(assignmentId, load)

onUnmounted(() => {
  headerStore.reset()
  navStore.showTabs()
  store.resetCurrent()
})

// ── Header / Navigator по экрану ─────────────────────────────────────────────
watch([view, assignment, isLoading], () => {
  headerStore.setTitle(assignment.value?.title ?? t('classes.title'))
  headerStore.setRightAction(null)

  if (view.value === 'run') {
    headerStore.setLeftAction({ icon: BsArrowLeft, onClick: () => backToInfo() })
    return // навигатором управляет AssignmentRunner
  }

  headerStore.setLeftAction({ icon: BsArrowLeft, onClick: () => router.push('/classes') })

  const a = assignment.value
  if (view.value === 'info' && a && a.can_start) {
    navStore.showActions([
      { label: t('common.back'), icon: BsArrowLeft, variant: 'default', onClick: () => router.push('/classes') },
      { label: startLabel.value, variant: 'primary', onClick: () => startRun() },
    ])
  } else {
    navStore.showActions([
      { label: t('classes.backToList'), icon: BsArrowLeft, variant: 'default', onClick: () => router.push('/classes') },
    ])
  }
}, { immediate: true })

// ── Действия ─────────────────────────────────────────────────────────────────
function startRun() {
  errorText.value = ''
  finishResult.value = null
  view.value = 'run'
}

async function backToInfo() {
  view.value = 'info'
  await load()
}

async function onFinished(result: AssignmentFinish | null) {
  finishResult.value = result
  view.value = 'result'
  await load()
}

function onRunError(message: string) {
  errorText.value = message
  view.value = 'info'
  load()
}

const shownScore = computed(() => finishResult.value?.score ?? assignment.value?.best_score ?? null)

const scoreEmoji = computed(() => {
  const s = shownScore.value
  if (s == null) return '📨'
  return s >= 70 ? '🎉' : s >= 40 ? '💪' : '📚'
})

</script>

<template>
  <div class="assignment-page">
    <div class="page-body">

      <div v-if="isLoading && !assignment" class="skeleton skeleton--big" />

      <div v-else-if="notFound" class="empty">
        <p class="empty__icon">🔍</p>
        <p class="empty__title">{{ t('classes.notFoundAssignment') }}</p>
      </div>

      <Transition v-else-if="assignment" name="slide" mode="out-in">

        <!-- 1. Информация о задании -->
        <div v-if="view === 'info'" key="info" class="stack">
          <div class="hero">
            <span class="hero__class">{{ assignment.classroom_title }}</span>
            <h1 class="hero__title">{{ assignment.title }}</h1>
            <span v-if="assignment.teacher_name" class="hero__teacher">
              {{ t('classes.teacher', { name: assignment.teacher_name }) }}
            </span>

            <div class="hero__stats">
              <div class="stat">
                <b>{{ questionsCount(assignment) }}</b>
                <span>{{ t('quiz.questions') }}</span>
              </div>
              <div class="stat">
                <b>{{ assignment.time_limit_min ? t('classes.minutes', { n: assignment.time_limit_min }) : '∞' }}</b>
                <span>⏱</span>
              </div>
              <div class="stat">
                <b :class="{ 'stat--over': assignment.student_status === 'missed' }">{{ dueLeft(assignment.due_at) }}</b>
                <span>{{ assignment.due_at ? formatDateTime(assignment.due_at) : '' }}</span>
              </div>
            </div>

            <div class="hero__status">
              <span class="badge" :class="`badge--${assignment.student_status}`">
                {{ t(`classes.status.${assignment.student_status}`) }}
              </span>
              <span v-if="assignment.best_score != null" class="hero__score">{{ assignment.best_score }}%</span>
              <span class="hero__attempts">{{ attemptsText(assignment) }}</span>
            </div>
          </div>

          <p v-if="errorText" class="error">{{ errorText }}</p>

          <div v-if="assignment.description" class="card">
            <h3 class="card__title">{{ t('classes.instruction') }}</h3>
            <p class="card__text">{{ assignment.description }}</p>
          </div>

          <div class="card">
            <h3 class="card__title">{{ t('classes.rules') }}</h3>
            <ul class="rules">
              <li v-for="r in rules" :key="r">{{ r }}</li>
            </ul>
          </div>

          <template v-if="review && isDone">
            <h3 class="section-title">{{ t('classes.viewResult') }}</h3>
            <AssignmentReview :review="review" />
          </template>
          <p v-else-if="isDone && !assignment.can_view_result" class="hint">{{ t('classes.resultHidden') }}</p>
        </div>

        <!-- 2. Прохождение -->
        <div v-else-if="view === 'run'" key="run">
          <AssignmentRunner :assignment="assignment" @finished="onFinished" @error="onRunError" />
        </div>

        <!-- 3. Результат -->
        <div v-else key="result" class="stack">
          <div class="result">
            <div class="result__icon">{{ scoreEmoji }}</div>
            <h2 class="result__title">{{ t('classes.submitted') }}</h2>
            <template v-if="shownScore != null">
              <div class="result__score">{{ shownScore }}%</div>
              <p v-if="finishResult?.correct_count != null" class="result__sub">
                {{ t('classes.correctCount') }}: {{ finishResult.correct_count }} / {{ finishResult.total_questions }}
              </p>
            </template>
            <p v-else class="result__sub">{{ t('classes.submittedAfterDue') }}</p>
          </div>

          <template v-if="review">
            <h3 class="section-title">{{ t('classes.viewResult') }}</h3>
            <AssignmentReview :review="review" />
          </template>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.assignment-page {
  min-height: 100vh;
  background: transparent;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
}

.page-body {
  padding: 20px;
  padding-top: calc(80px + var(--sat));
  padding-bottom: calc(110px + var(--sab));
  max-width: 720px;
  width: 100%;
  box-sizing: border-box;
}

.stack { display: flex; flex-direction: column; gap: 14px; }

.hero {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  border-radius: 24px;
  background: var(--grad-primary);
  color: #fff;
  box-shadow: 0 8px 28px rgba(35, 73, 112, 0.25);

  &__class { font-size: 12px; font-weight: 600; opacity: 0.85; }
  &__title { margin: 0; font-size: 22px; font-weight: 800; line-height: 1.25; }
  &__teacher { font-size: 13px; opacity: 0.85; }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 8px;
    margin-top: 12px;
  }

  &__status { display: flex; align-items: center; gap: 10px; margin-top: 12px; flex-wrap: wrap; }
  &__score { font-size: 20px; font-weight: 800; }
  &__attempts { font-size: 12px; opacity: 0.85; margin-left: auto; }
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.15);
  text-align: center;

  b { font-size: 14px; white-space: nowrap; }
  span { font-size: 11px; opacity: 0.8; }
  &--over { color: #fecaca; }
}

.badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);

  &--completed { background: rgba(16, 185, 129, 0.9); }
  &--late { background: rgba(245, 158, 11, 0.9); }
  &--missed { background: rgba(239, 68, 68, 0.9); }
  &--in_progress { background: rgba(59, 130, 246, 0.9); }
}

.card {
  padding: 16px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);

  &__title { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: #234970; }
  &__text { margin: 0; font-size: 14px; color: #374151; white-space: pre-line; line-height: 1.6; }
}

.rules {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  color: #374151;
}

.section-title { margin: 8px 4px 0; font-size: 15px; font-weight: 700; color: #234970; }

.hint { margin: 0; font-size: 13px; color: #6B7280; text-align: center; }

.error {
  margin: 0;
  padding: 12px 14px;
  border-radius: 14px;
  background: rgba(239, 68, 68, 0.08);
  color: #EF4444;
  font-size: 14px;
}

.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 28px 20px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
  text-align: center;

  &__icon { font-size: 52px; }
  &__title { margin: 0; font-size: 20px; color: #234970; }
  &__score {
    font-size: 44px;
    font-weight: 800;
    background: var(--grad-primary);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }
  &__sub { margin: 0; font-size: 14px; color: #6B7280; }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 40px 20px;
  text-align: center;

  &__icon { font-size: 48px; margin: 0; }
  &__title { margin: 0; font-size: 16px; font-weight: 700; color: #234970; }
}

.skeleton {
  border-radius: 24px;
  background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;

  &--big { height: 220px; }
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

.slide-enter-active, .slide-leave-active { transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from { opacity: 0; transform: translateX(30px); }
.slide-leave-to { opacity: 0; transform: translateX(-30px); }
</style>
