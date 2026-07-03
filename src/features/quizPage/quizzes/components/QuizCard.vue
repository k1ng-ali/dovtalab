<script setup lang="ts">
import type { QuizIn } from '@/features/quizPage/types.ts'
import { computed } from 'vue'
import { MdRoundFavorite } from '@kalimahapps/vue-icons'

const props = defineProps<{
  quiz: QuizIn
}>()

// ── Детерминированный градиент по quiz.id ──────────────────────────────────
const GRADIENTS = [
  ['#4EBEC2', '#234970'],  // teal → navy (фирменный)
  ['#6366F1', '#8B5CF6'],  // indigo → violet
  ['#F59E0B', '#EF4444'],  // amber → red
  ['#10B981', '#059669'],  // emerald
  ['#EC4899', '#8B5CF6'],  // pink → violet
  ['#3B82F6', '#06B6D4'],  // blue → cyan
]

const gradient = computed(() => GRADIENTS[props.quiz.id % GRADIENTS.length])
const iconStyle = computed(() => ({
  background: `linear-gradient(135deg, ${gradient.value[0]}22, ${gradient.value[1]}33)`,
  color: gradient.value[0],
}))
const dotStyle = computed(() => ({
  background: `linear-gradient(135deg, ${gradient.value[0]}, ${gradient.value[1]})`,
}))

// ── Данные ─────────────────────────────────────────────────────────────────
const totalQuestions = computed(() => props.quiz.details?.total_questions ?? null)
const contextsCount  = computed(() => props.quiz.details?.contexts_count ?? null)
const progress       = computed(() => props.quiz.details?.progress ?? null)

const progressPercent = computed(() => {
  const p = progress.value
  if (!p || !p.total_questions) return 0
  return Math.round((p.answered_count / p.total_questions) * 100)
})

const accuracyPercent = computed(() => {
  const p = progress.value
  if (!p || !p.answered_count) return 0
  return Math.round((p.correct_count / p.answered_count) * 100)
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
  return mins > 0 ? `${mins} мин` : null
})
</script>

<template>
  <div class="quiz-card">

    <!-- Иконка с градиентом -->
    <div class="icon-wrapper" :style="iconStyle">
      <span class="icon-emoji">📘</span>
      <span v-if="isCompleted" class="done-dot" :style="dotStyle" />
    </div>

    <!-- Контент -->
    <div class="content">

      <!-- Заголовок + избранное -->
      <div class="top">
        <h3 class="title">{{ quiz.title }}</h3>
        <MdRoundFavorite v-if="quiz.on_fav" class="fav-icon" />
      </div>

      <!-- Описание -->
      <p class="description">{{ quiz.description }}</p>

      <!-- Бейджи -->
      <div class="badges">
        <span v-if="timeLabel" class="badge badge--time">⏱ {{ timeLabel }}</span>
        <span v-if="totalQuestions" class="badge badge--questions">
          📝 {{ totalQuestions }} вопр.
        </span>
        <span v-if="contextsCount" class="badge badge--contexts">
          📂 {{ contextsCount }} разд.
        </span>
        <span v-if="isCompleted" class="badge badge--done">
          ✓ × {{ progress!.completed_attempts }}
        </span>
        <span v-if="!isCompleted && progress?.best_score != null" class="badge badge--score">
          🏆 {{ progress!.best_score }}%
        </span>
      </div>

      <!-- Прогресс-бар -->
      <div v-if="hasProgress && !isCompleted" class="progress-wrap">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{
              width: progressPercent + '%',
              background: `linear-gradient(90deg, ${gradient[0]}, ${gradient[1]})`
            }"
          />
          <div
            class="accuracy-fill"
            :style="{
              width: Math.round(progressPercent * accuracyPercent / 100) + '%',
              background: `linear-gradient(90deg, ${gradient[0]}cc, ${gradient[1]}cc)`
            }"
          />
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
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;

  &:active {
    transform: scale(0.97);
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
}

/* ── Icon ─────────────────────────────────────────────────────────────────── */
.icon-wrapper {
  position: relative;
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: background 0.3s ease;
}

.icon-emoji {
  line-height: 1;
}

.done-dot {
  position: absolute;
  top: -3px;
  right: -3px;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #F6F6F6;
}

/* ── Content ──────────────────────────────────────────────────────────────── */
.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
}

.top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 8px;
}

.title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #234970;
  line-height: 1.3;
  // обрезаем если очень длинный
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.fav-icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
  color: #EF4444;
  fill: #EF4444;
  margin-top: 2px;
}

.description {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ── Badges ───────────────────────────────────────────────────────────────── */
.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  margin-top: 2px;
}

.badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 8px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;

  &--time {
    background: rgba(0, 0, 0, 0.05);
    color: #6B7280;
  }

  &--questions {
    background: rgba(78, 190, 194, 0.1);
    color: #234970;
  }

  &--contexts {
    background: rgba(99, 102, 241, 0.1);
    color: #6366F1;
  }

  &--done {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
    font-weight: 600;
  }

  &--score {
    background: rgba(245, 158, 11, 0.12);
    color: #D97706;
    font-weight: 600;
  }
}

/* ── Progress ─────────────────────────────────────────────────────────────── */
.progress-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 2px;
}

.progress-track {
  position: relative;
  flex: 1;
  height: 5px;
  border-radius: 5px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  height: 100%;
  border-radius: 5px;
  opacity: 0.35;
  transition: width 0.4s ease;
}

.accuracy-fill {
  position: absolute;
  height: 100%;
  border-radius: 5px;
  transition: width 0.4s ease;
  z-index: 2;
}

.progress-label {
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 600;
  color: #9CA3AF;
}
</style>
