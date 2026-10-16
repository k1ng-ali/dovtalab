<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import SentIcon from '@iconify-vue/solar/plain-linear'
import DoneIcon from '@iconify-vue/solar/confetti-minimalistic-linear'
import GoodIcon from '@iconify-vue/solar/dumbbell-large-linear'
import StudyIcon from '@iconify-vue/solar/book-2-linear'
import SearchIcon from '@iconify-vue/solar/magnifer-linear'
import ListIcon from '@iconify-vue/solar/notebook-linear'
import TimerIcon from '@iconify-vue/solar/stopwatch-linear'
import CalendarIcon from '@iconify-vue/solar/calendar-linear'
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

const scoreIcon = computed(() => {
  const s = shownScore.value
  if (s == null) return SentIcon
  return s >= 70 ? DoneIcon : s >= 40 ? GoodIcon : StudyIcon
})

</script>

<template>
  <div class="assignment ui-page">

    <div v-if="isLoading && !assignment" class="ui-skeleton assignment__skeleton" />

    <div v-else-if="notFound" class="ui-empty ui-card">
      <SearchIcon class="ui-empty__icon" />
      <p class="ui-empty__title">{{ t('classes.notFoundAssignment') }}</p>
    </div>

    <Transition v-else-if="assignment" name="slide" mode="out-in">

      <!-- 1. Информация о задании -->
      <div v-if="view === 'info'" key="info" class="stack">
        <section class="hero ui-hero">
          <span class="ui-chip ui-chip--on-dark hero__class">{{ assignment.classroom_title }}</span>
          <h1 class="hero__title">{{ assignment.title }}</h1>
          <span v-if="assignment.teacher_name" class="hero__teacher">
            {{ t('classes.teacher', { name: assignment.teacher_name }) }}
          </span>

          <div class="hero__stats">
            <div class="stat">
              <ListIcon />
              <b>{{ questionsCount(assignment) }}</b>
              <span>{{ t('quiz.questions') }}</span>
            </div>
            <div class="stat">
              <TimerIcon />
              <b>{{ assignment.time_limit_min ? t('classes.minutes', { n: assignment.time_limit_min }) : '∞' }}</b>
            </div>
            <div class="stat">
              <CalendarIcon />
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
        </section>

        <p v-if="errorText" class="error">{{ errorText }}</p>

        <div v-if="assignment.description" class="card ui-card">
          <h3 class="card__title">{{ t('classes.instruction') }}</h3>
          <p class="card__text">{{ assignment.description }}</p>
        </div>

        <div class="card ui-card">
          <h3 class="card__title">{{ t('classes.rules') }}</h3>
          <ul class="rules">
            <li v-for="r in rules" :key="r">{{ r }}</li>
          </ul>
        </div>

        <template v-if="review && isDone">
          <div class="ui-section-head">
            <h3 class="ui-section-head__title">{{ t('classes.viewResult') }}</h3>
          </div>
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
        <div class="result ui-card">
          <span class="result__icon"><component :is="scoreIcon" /></span>
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
          <div class="ui-section-head">
            <h3 class="ui-section-head__title">{{ t('classes.viewResult') }}</h3>
          </div>
          <AssignmentReview :review="review" />
        </template>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.assignment {
  max-width: 760px;

  &__skeleton { height: 240px; border-radius: var(--r-xl); }
}

.stack { display: flex; flex-direction: column; gap: 14px; }

/* ── Hero ── */
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  padding: 22px;

  &__class { margin-bottom: 4px; }
  &__title { margin: 0; font-size: 24px; font-weight: 800; line-height: 1.2; }
  &__teacher { font-size: 14px; color: rgba(255, 255, 255, 0.9); }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    width: 100%;
    margin-top: 12px;
  }

  &__status {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 12px;
    margin-top: 10px;
  }

  &__score { font-size: 20px; font-weight: 800; }
  &__attempts { font-size: 13px; color: rgba(255, 255, 255, 0.9); }
}

.stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 10px 12px;
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.14);

  svg { font-size: 18px; opacity: 0.9; margin-bottom: 2px; }
  b { font-size: 15px; font-weight: 800; line-height: 1.2; }
  span { font-size: 11px; color: rgba(255, 255, 255, 0.85); }

  &--over { color: #FFD2B0; }
}

.badge {
  padding: 4px 12px;
  border-radius: var(--r-pill);
  font-size: 12px;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;

  &--completed { background: #FFFFFF; color: var(--c-success); }
  &--late { background: #FFFFFF; color: var(--c-warning-text); }
  &--missed { background: #FFFFFF; color: var(--c-danger); }
  &--in_progress { background: #FFFFFF; color: var(--c-teal-600); }
}

.error {
  margin: 0;
  padding: 12px 16px;
  border-radius: var(--r-md);
  background: var(--c-danger-tint);
  color: var(--c-danger);
  font-size: 14px;
  font-weight: 600;
}

.card {
  padding: 16px 18px;

  &__title { margin: 0 0 8px; font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
  &__text { margin: 0; font-size: 14px; line-height: 1.55; color: var(--c-ink); white-space: pre-line; }
}

.rules {
  margin: 0;
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 14px;
  line-height: 1.45;
  color: var(--c-ink);

  li::marker { color: var(--c-teal-600); }
}

.hint { margin: 0; padding: 0 6px; font-size: 13px; color: var(--c-muted); text-align: center; }

/* ── Результат ── */
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 30px 20px 24px;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    margin-bottom: 6px;
    border-radius: 26px;
    background: var(--grad-primary);
    color: #FFFFFF;
    font-size: 38px;
    box-shadow: var(--shadow-hero);
  }

  &__title { margin: 0; font-size: var(--fs-h1); font-weight: 800; color: var(--c-navy-900); }
  &__score { font-size: 44px; font-weight: 800; line-height: 1.1; color: var(--c-teal-600); }
  &__sub { margin: 0; font-size: 14px; color: var(--c-muted); }
}

/* ── Slide transition ── */
.slide-enter-active,
.slide-leave-active { transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1); }
.slide-enter-from { opacity: 0; transform: translateX(30px); }
.slide-leave-to { opacity: 0; transform: translateX(-30px); }
</style>
