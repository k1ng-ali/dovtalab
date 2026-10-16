<script setup lang="ts">
import type { QuizIn } from '@/features/quizPage/types.ts'
import { computed } from 'vue'
import MdRoundFavorite from '@iconify-vue/solar/heart-bold'
import ClockIcon from '@iconify-vue/solar/stopwatch-linear'
import ListIcon from '@iconify-vue/solar/notebook-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-linear'
import { subjectInitials, subjectTint } from '@/shared/lib/subjectTint.ts'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const props = defineProps<{
  quiz: QuizIn
}>()

// ── Плашка предмета ────────────────────────────────────────────────────────
const tint = computed(() => subjectTint(props.quiz.id))
const initials = computed(() => subjectInitials(props.quiz.title))

// ── Данные ─────────────────────────────────────────────────────────────────
const totalQuestions = computed(() => props.quiz.details?.total_questions ?? null)
const contextsCount  = computed(() => props.quiz.details?.contexts_count ?? null)
const progress       = computed(() => props.quiz.details?.progress ?? null)

const progressPercent = computed(() => {
  const p = progress.value
  if (!p || !p.total_questions) return 0
  return Math.round((p.answered_count / p.total_questions) * 100)
})

const hasProgress = computed(() =>
  progress.value !== null &&
  (progress.value.answered_count > 0 || progress.value.completed_attempts > 0)
)

const isCompleted = computed(() =>
  (progress.value?.completed_attempts ?? 0) > 0
)

const timeLabel = computed(() => {
  const mins = Math.floor(props.quiz.time_limit / 60)
  return mins > 0 ? t('units.min', { n: mins }) : null
})
</script>

<template>
  <div class="quiz-card ui-card">
    <div class="tile" :style="{ background: tint.bg, color: tint.color }">
      {{ initials }}
      <span v-if="isCompleted" class="tile__done" :title="t('quiz.finished')"><CheckIcon /></span>
    </div>

    <div class="content">
      <div class="top">
        <h3 class="title">{{ quiz.title }}</h3>
        <MdRoundFavorite v-if="quiz.on_fav" class="fav-icon" />
      </div>

      <p v-if="quiz.description" class="description">{{ quiz.description }}</p>
      <span v-if="quiz.creator_name" class="author">{{ quiz.creator_name }}</span>

      <div class="badges">
        <span v-if="totalQuestions" class="ui-chip"><ListIcon />{{ $t('units.questionsShort', { n: totalQuestions }) }}</span>
        <span v-if="timeLabel" class="ui-chip"><ClockIcon />{{ timeLabel }}</span>
        <span v-if="contextsCount" class="ui-chip">{{ $t('units.sectionsShort', { n: contextsCount }) }}</span>
        <span v-if="isCompleted" class="ui-chip ui-chip--success">× {{ progress!.completed_attempts }}</span>
        <span v-if="!isCompleted && progress?.best_score != null" class="ui-chip ui-chip--teal">{{ progress!.best_score }}%</span>
      </div>

      <div v-if="hasProgress && !isCompleted" class="progress-wrap">
        <div class="ui-progress progress-track">
          <div class="ui-progress__fill" :style="{ width: progressPercent + '%' }" />
        </div>
        <span class="progress-label">{{ progressPercent }}%</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quiz-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover { box-shadow: 0 14px 34px rgba(23, 46, 74, 0.12); }
  &:active { transform: scale(0.98); }
}

.tile {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 17px;
  font-weight: 800;

  &__done {
    position: absolute;
    right: -5px;
    bottom: -5px;
    display: flex;
    padding: 2px;
    border-radius: 50%;
    background: #FFFFFF;
    color: var(--c-success);
    font-size: 16px;
  }
}

.content { flex: 1; display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }

.title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-navy-900);
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fav-icon { flex-shrink: 0; font-size: 18px; color: #E5484D; margin-top: 2px; }

.description {
  margin: 0;
  font-size: 13px;
  color: var(--c-muted);
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.author { font-size: 12px; color: var(--c-muted-2); font-weight: 500; }

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 2px;

  .ui-chip { font-weight: 600; }
  .ui-chip :deep(svg) { font-size: 14px; }
}

.progress-wrap { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
.progress-track { flex: 1; }
.progress-label { flex-shrink: 0; font-size: 12px; font-weight: 700; color: var(--c-muted); }
</style>
