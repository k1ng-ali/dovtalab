<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { QuizIn, ContextIn, QuizMode } from '@/features/quizPage/types.ts'
import { useQuiz } from '@/features/quizPage/store.ts'
import MdRoundFavoriteBorder from '@iconify-vue/solar/heart-linear'
import MdRoundFavorite from '@iconify-vue/solar/heart-bold'
import CopyIcon from '@iconify-vue/solar/copy-linear'
import ListIcon from '@iconify-vue/solar/notebook-linear'
import CupIcon from '@iconify-vue/solar/cup-star-linear'
import TimeIcon from '@iconify-vue/solar/stopwatch-linear'
import AdaptiveIcon from '@iconify-vue/solar/lightbulb-bolt-linear'
import RocketIcon from '@iconify-vue/solar/rocket-2-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-bold'
import { subjectInitials, subjectTint } from '@/shared/lib/subjectTint.ts'
import {useHeaderStore} from "@/shared/stores/useHeaderStore.ts";
import KnowledgeMap from '@/features/quizPage/knowledgeMap/KnowledgeMap.vue'
import ReviewBadge from '@/features/quizPage/review/ReviewBadge.vue'
import ProBadge from '@/features/subscription/ProBadge.vue'
import SubscriptionModal from '@/features/subscription/SubscriptionModal.vue'
import { useUserStore } from '@/features/user/store.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  quiz: QuizIn
  selectedContext: ContextIn | null
  selectedMode: QuizMode
  examQuestionLimit: number
}>()

const emit = defineEmits<{
  (e: 'select-context', ctx: ContextIn | null): void
  (e: 'select-mode', mode: QuizMode): void
  (e: 'set-exam-limit', limit: number): void
  (e: 'train-cluster', clusterId: number): void
  (e: 'start-review'): void
}>()

const quizStore = useQuiz()
const userStore = useUserStore()
const contexts  = ref<ContextIn[]>([])
const loading   = ref(false)
const adaptiveAvailable = ref(false)
const showSubModal = ref(false)
const copied = ref(false)
const Stats = computed(() => quizStore.quizStat(props.quiz.id))
const headerStore = useHeaderStore()
const tint = computed(() => subjectTint(props.quiz.id))

const copyHashCode = async () => {
  try {
    await navigator.clipboard.writeText(props.quiz.hash_code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback для мобильных браузеров
    const el = document.createElement('textarea')
    el.value = props.quiz.hash_code
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

onMounted(async () => {
  await quizStore.fetchQuizStat(props.quiz.id)
  headerStore.reset()
  headerStore.setTitle(props.quiz.title)

  // Проверяем доступность адаптивного обучения
  try {
    const result = await quizStore.checkAdaptiveAvailable(props.quiz.id)
    adaptiveAvailable.value = result.available
  } catch {
    adaptiveAvailable.value = false
  }

  if (props.quiz.contexts?.length) {
    contexts.value = props.quiz.contexts
    return
  }
  loading.value = true
  try {
    contexts.value = await quizStore.fetchContexts(props.quiz.id)
  } finally {
    loading.value = false
  }
})

const totalTimeSpent = computed(() => {
  if (!Stats.value) return null
  let total = 0
  if (Stats.value.current_attempt_stat?.duration_sec) {
    total += Stats.value.current_attempt_stat.duration_sec
  }
  if (Stats.value.completed_attempt_stats?.length) {
    for (const a of Stats.value.completed_attempt_stats) {
      if (a.duration_sec) total += a.duration_sec
    }
  }
  if (total === 0) return null

  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)

  if (h > 0) return t('units.hMin', { h, m })
  if (m > 0) return t('units.min', { n: m })
  return t('units.sec', { n: Math.floor(total) })
})

const addToFavorite = async (id: number) => {
  await quizStore.addFavorite(id)
  props.quiz.on_fav = true
}

const deleteFavorite = async (id: number) => {
  await quizStore.deleteFavorite(id)
  props.quiz.on_fav = false
}

const toggleContext = (ctx: ContextIn) => {
  if (props.selectedContext?.id === ctx.id) {
    emit('select-context', null)
  } else {
    emit('select-context', ctx)
  }
}

const quickAvailable = computed(() => (Stats.value?.total_questions ?? 0) >= 15)

// Варианты количества вопросов для быстрого теста
const quickTestOptions = computed(() => {
  const total = Stats.value?.total_questions ?? 0
  const options = [15, 20, 25, 30].filter(n => n <= total)
  // Добавляем "все" если total не входит в стандартные
  if (total > 0 && !options.includes(total) && total > 30) {
    options.push(total)
  }
  return options
})
</script>

<template>
  <div class="quiz-info">

    <!-- ── Шапка ── -->
    <section class="hero ui-card">
      <div class="hero__top">
        <span class="hero__tile" :style="{ background: tint.bg, color: tint.color }">{{ subjectInitials(quiz.title) }}</span>
        <div class="hero__actions">
          <button type="button" class="hash-code" @click="copyHashCode">
            <CopyIcon />
            <span class="hash-value">{{ quiz.hash_code }}</span>
            <span class="hash-copied" :class="{ visible: copied }">{{ $t('quizInfo.copied') }}</span>
          </button>
          <button
              type="button"
              class="ui-icon-btn fav-btn"
              :class="{ active: quiz.on_fav }"
              @click="quiz.on_fav ? deleteFavorite(quiz.id) : addToFavorite(quiz.id)"
          >
            <MdRoundFavorite v-if="quiz.on_fav" />
            <MdRoundFavoriteBorder v-else />
          </button>
        </div>
      </div>

      <h2 class="hero__title">{{ quiz.title }}</h2>
      <p v-if="quiz.description" class="hero__desc">{{ quiz.description }}</p>

      <!-- Мини-статистика -->
      <div class="hero__stats" v-if="Stats?.total_questions">
        <span class="ui-chip"><ListIcon />{{ $t('plural.questions', Stats.total_questions) }}</span>
        <span class="ui-chip ui-chip--success" v-if="Stats?.completed_attempt_stats?.length">
          <CupIcon />{{ $t('quizInfo.completedTimes', { n: Stats.completed_attempt_stats.length }) }}
        </span>
        <span class="ui-chip" v-if="totalTimeSpent"><TimeIcon />{{ totalTimeSpent }}</span>
      </div>
    </section>

    <!-- ── Режимы ── -->
    <div class="modes ui-card ui-card--list" v-if="adaptiveAvailable || quickAvailable">
      <!-- Адаптивное обучение -->
      <div
          v-if="adaptiveAvailable"
          class="mode ui-row"
          :class="{ active: props.selectedMode === 'adaptive' }"
          @click="userStore.is_pro ? emit('select-mode', props.selectedMode === 'adaptive' ? 'practice' : 'adaptive') : (showSubModal = true)"
      >
        <span class="ui-tile-icon mode__icon"><AdaptiveIcon /></span>
        <span class="mode__text">
          <b class="mode__title">{{ $t('quizInfo.adaptiveTitle') }}</b>
          <span class="mode__desc">{{ $t('quizInfo.adaptiveDesc') }}</span>
        </span>
        <span v-if="userStore.is_pro" class="ui-switch" :class="{ on: props.selectedMode === 'adaptive' }" />
        <ProBadge v-else @click="showSubModal = true" />
      </div>

      <!-- Быстрый тест -->
      <div
          v-if="quickAvailable"
          class="mode mode--quick"
          :class="{ active: props.selectedMode === 'exam', disabled: props.selectedMode === 'adaptive' }"
      >
        <div class="ui-row mode__head" @click="props.selectedMode !== 'adaptive' && emit('select-mode', props.selectedMode === 'exam' ? 'practice' : 'exam')">
          <span class="ui-tile-icon mode__icon"><RocketIcon /></span>
          <span class="mode__text">
            <b class="mode__title">{{ $t('quizInfo.quickTitle') }}</b>
            <span class="mode__desc">{{ $t('quizInfo.quickDesc') }}</span>
          </span>
          <span class="ui-switch" :class="{ on: props.selectedMode === 'exam' }" />
        </div>

        <!-- Количество вопросов (показывается только при активном режиме) -->
        <Transition name="slide-down">
          <div v-if="props.selectedMode === 'exam'" class="quick-options" @click.stop>
            <span class="quick-options__label">{{ $t('quizInfo.questionCount') }}</span>
            <div class="ui-segmented quick-options__pills">
              <button
                  v-for="n in quickTestOptions"
                  :key="n"
                  type="button"
                  class="ui-segmented__item"
                  :class="{ active: props.examQuestionLimit === n }"
                  @click="emit('set-exam-limit', n)"
              >
                {{ n }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ── Повторение ── -->
    <ReviewBadge :quiz-id="quiz.id" @start-review="emit('start-review')" />

    <!-- ── Карта знаний ── -->
    <KnowledgeMap :quiz-id="quiz.id" @train-topic="(id) => emit('train-cluster', id)" @open-subscription="showSubModal = true" />

    <!-- ── Контексты ── -->
    <section class="section" v-if="!loading && contexts.length > 0">
      <div class="section__head">
        <h3 class="ui-section-head__title">{{ $t('quizInfo.contexts') }}</h3>
        <p class="section__hint">{{ $t('quizInfo.contextsHint') }}</p>
      </div>

      <div class="context-list">
        <div
            v-for="ctx in contexts"
            :key="ctx.id"
            class="context-card ui-card ui-option"
            :class="{ selected: selectedContext?.id === ctx.id }"
            @click="toggleContext(ctx)"
        >
          <div class="context-card__top">
            <span class="context-card__name">{{ ctx.title }}</span>
            <CheckIcon v-if="selectedContext?.id === ctx.id" class="context-card__check" />
            <span v-else-if="ctx.detail?.questions" class="ui-chip">
              {{ $t('units.questionsShort', { n: ctx.detail.questions }) }}
            </span>
          </div>
          <p class="context-card__text" v-if="ctx.text">{{ ctx.text }}</p>
        </div>
      </div>
    </section>

    <!-- Скелетон загрузки контекстов -->
    <div class="section" v-if="loading">
      <div class="ui-skeleton skeleton-title" />
      <div class="ui-skeleton skeleton-card" v-for="i in 2" :key="i" />
    </div>

    <!-- Subscription Modal -->
    <SubscriptionModal
      :visible="showSubModal"
      @close="showSubModal = false"
      @activated="showSubModal = false"
    />

  </div>
</template>

<style scoped lang="scss">
.quiz-info {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Hero ── */
.hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 18px;

  &__top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 6px;
  }

  &__tile {
    width: 56px;
    height: 56px;
    flex-shrink: 0;
    border-radius: 18px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 19px;
    font-weight: 800;
  }

  &__actions { display: flex; align-items: center; gap: 8px; min-width: 0; }

  &__title {
    margin: 0;
    font-size: var(--fs-h1);
    font-weight: 800;
    line-height: 1.2;
    color: var(--c-navy-900);
  }

  &__desc {
    margin: 0;
    font-size: 14px;
    color: var(--c-muted);
    line-height: 1.5;
  }

  &__stats {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
    padding-top: 12px;
    border-top: 1px solid var(--c-line);

    :deep(svg) { font-size: 14px; }
  }
}

.fav-btn {
  font-size: 22px;
  color: var(--c-ink-2);

  &.active { color: #E5484D; background: rgba(229, 72, 77, 0.1); }
}

/* ── Hash Code ── */
.hash-code {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 42px;
  padding: 0 14px;
  border: none;
  border-radius: var(--r-pill);
  background: rgba(35, 73, 112, 0.08);
  color: var(--c-ink-2);
  font-family: inherit;
  font-size: 16px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.18s ease, background 0.18s ease;

  &:active { transform: scale(0.95); background: var(--c-teal-tint); }
}

.hash-value {
  font-size: 12px;
  font-weight: 700;
  color: var(--c-navy-900);
  font-family: ui-monospace, 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.3px;
}

.hash-copied {
  position: absolute;
  top: -32px;
  left: 50%;
  transform: translateX(-50%) scale(0.8);
  background: var(--c-navy-900);
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: var(--r-pill);
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.visible { opacity: 1; transform: translateX(-50%) scale(1); }
}

/* ── Режимы ── */
.mode {
  cursor: pointer;
  user-select: none;
  transition: background 0.2s ease;

  &.active { background: rgba(231, 245, 246, 0.7); }
  &.disabled { opacity: 0.45; pointer-events: none; }

  &--quick { display: block; }

  &__head { border-bottom: none; }

  &__icon { width: 40px; height: 40px; border-radius: 12px; font-size: 20px; }

  &__text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  &__title { font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
  &__desc { font-size: 12px; color: var(--c-muted); line-height: 1.35; }
}

.quick-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 16px 14px;

  &__label { font-size: 13px; font-weight: 600; color: var(--c-muted); }
  &__pills { background: rgba(23, 46, 74, 0.05); }
}

/* ── Slide-down transition ── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
  overflow: hidden;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 120px;
}

/* ── Контексты ── */
.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 6px;

  &__head { padding: 0 6px; display: flex; flex-direction: column; gap: 2px; }
  &__hint { margin: 0; font-size: 13px; color: var(--c-muted); line-height: 1.4; }
}

.context-list {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;

  @media (min-width: 1024px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.context-card {
  padding: 14px 16px;

  &__top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 4px;
  }

  &__name { font-weight: 700; font-size: 15px; color: var(--c-navy-900); }
  &__check { font-size: 22px; color: var(--c-teal-600); }

  &__text {
    margin: 0;
    font-size: 13px;
    color: var(--c-muted);
    line-height: 1.45;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
}

/* ── Skeleton ── */
.skeleton-title { height: 20px; width: 140px; border-radius: 8px; }
.skeleton-card { height: 72px; }
</style>
