<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { dueLeft, formatDateTime, isUrgent, questionsCount } from '../format.ts'
import type { StudentAssignment } from '../types.ts'

const props = defineProps<{
  assignment: StudentAssignment
  compact?: boolean
}>()

const emit = defineEmits<{
  (e: 'open', assignment: StudentAssignment): void
}>()

const { t } = useI18n()

const a = computed(() => props.assignment)
const isDone = computed(() => a.value.student_status === 'completed' || a.value.student_status === 'late')
const opensLater = computed(() => !!a.value.starts_at && new Date(a.value.starts_at) > new Date())

const scoreClass = computed(() => {
  const s = a.value.best_score
  if (s == null) return ''
  return s >= 80 ? 'score--good' : s >= 50 ? 'score--mid' : 'score--low'
})
</script>

<template>
  <button class="card" :class="{ 'card--done': isDone, 'card--compact': compact }" type="button"
          @click="emit('open', assignment)">
    <div class="card__icon">{{ isDone ? '✅' : a.student_status === 'missed' ? '⚠️' : '📝' }}</div>

    <div class="card__body">
      <span class="card__class">{{ a.classroom_title }}</span>
      <span class="card__title">{{ a.title }}</span>
      <span class="card__meta">
        {{ t('classes.questions', { n: questionsCount(a) }) }}
        <template v-if="a.time_limit_min"> · ⏱ {{ t('classes.minutes', { n: a.time_limit_min }) }}</template>
        <template v-if="opensLater"> · {{ t('classes.opensAt', { date: formatDateTime(a.starts_at) }) }}</template>
      </span>
    </div>

    <div class="card__side">
      <template v-if="isDone">
        <span v-if="a.best_score != null" class="score" :class="scoreClass">{{ a.best_score }}%</span>
        <span class="status status--done">{{ t(`classes.status.${a.student_status}`) }}</span>
      </template>
      <template v-else>
        <span class="due" :class="{ 'due--urgent': isUrgent(a.due_at), 'due--over': a.student_status === 'missed' }">
          {{ dueLeft(a.due_at) }}
        </span>
        <span v-if="a.student_status === 'in_progress'" class="status status--progress">
          {{ t('classes.status.in_progress') }}
        </span>
      </template>
    </div>
  </button>
</template>

<style scoped lang="scss">
.card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active { transform: scale(0.97); }
  &--done { opacity: 0.85; }
  &--compact { padding: 12px 14px; box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05); }

  &__icon {
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 14px;
    background: rgba(78, 190, 194, 0.12);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 20px;
  }

  &__body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  &__class { font-size: 11px; font-weight: 600; color: var(--c-teal-600); }
  &__title {
    font-size: 15px;
    font-weight: 700;
    color: #234970;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  &__meta { font-size: 12px; color: #6B7280; }

  &__side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
}

.due {
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  white-space: nowrap;

  &--urgent { color: #f59e0b; }
  &--over { color: #EF4444; }
}

.score {
  font-size: 18px;
  font-weight: 800;
  color: #234970;

  &--good { color: #10B981; }
  &--mid { color: #f59e0b; }
  &--low { color: #EF4444; }
}

.status {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
  white-space: nowrap;

  &--done { background: rgba(16, 185, 129, 0.1); color: #059669; }
  &--progress { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
}
</style>
