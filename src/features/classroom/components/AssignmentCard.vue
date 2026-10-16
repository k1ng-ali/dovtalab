<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import TaskIcon from '@iconify-vue/solar/document-text-linear'
import DoneIcon from '@iconify-vue/solar/check-circle-linear'
import MissedIcon from '@iconify-vue/solar/danger-triangle-linear'
import TimerIcon from '@iconify-vue/solar/stopwatch-linear'
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
  <button class="card ui-card" :class="{ 'card--compact': compact }" type="button"
          @click="emit('open', assignment)">
    <span class="card__icon" :class="{ 'card__icon--done': isDone, 'card__icon--missed': a.student_status === 'missed' }">
      <DoneIcon v-if="isDone" />
      <MissedIcon v-else-if="a.student_status === 'missed'" />
      <TaskIcon v-else />
    </span>

    <span class="card__body">
      <span class="card__class">{{ a.classroom_title }}</span>
      <b class="card__title">{{ a.title }}</b>
      <span class="card__meta">
        {{ t('classes.questions', { n: questionsCount(a) }) }}
        <template v-if="a.time_limit_min"> · <TimerIcon class="card__meta-icon" /> {{ t('classes.minutes', { n: a.time_limit_min }) }}</template>
        <template v-if="opensLater"> · {{ t('classes.opensAt', { date: formatDateTime(a.starts_at) }) }}</template>
      </span>
    </span>

    <span class="card__side">
      <template v-if="isDone">
        <span v-if="a.best_score != null" class="score" :class="scoreClass">{{ a.best_score }}%</span>
        <span class="ui-chip ui-chip--success">{{ t(`classes.status.${a.student_status}`) }}</span>
      </template>
      <template v-else>
        <span class="due" :class="{ 'due--urgent': isUrgent(a.due_at), 'due--over': a.student_status === 'missed' }">
          {{ dueLeft(a.due_at) }}
        </span>
        <span v-if="a.student_status === 'in_progress'" class="ui-chip ui-chip--teal">
          {{ t('classes.status.in_progress') }}
        </span>
      </template>
    </span>
  </button>
</template>

<style scoped lang="scss">
.card {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease;

  &:active { transform: scale(0.985); }
  &--compact { padding: 12px 14px; }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 13px;
    background: var(--c-teal-tint);
    color: var(--c-teal-600);
    font-size: 21px;

    &--done { background: var(--c-success-tint); color: var(--c-success); }
    &--missed { background: var(--c-warning-tint); color: var(--c-warning-text); }
  }

  &__body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  &__class { font-size: 12px; font-weight: 600; color: var(--c-teal-600); }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--c-navy-900);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta { font-size: 12px; color: var(--c-muted); }
  &__meta-icon { font-size: 13px; vertical-align: -2px; }

  &__side { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
}

.due {
  font-size: 12px;
  font-weight: 700;
  color: var(--c-muted);
  white-space: nowrap;

  &--urgent { color: var(--c-warning-text); }
  &--over { color: var(--c-danger); }
}

.score {
  font-size: 18px;
  font-weight: 800;
  color: var(--c-navy-900);

  &--good { color: var(--c-correct); }
  &--mid { color: var(--c-warning-text); }
  &--low { color: var(--c-danger); }
}
</style>
