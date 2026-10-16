<script setup lang="ts">
// Главное действие дня: задание от учителя → вызов дня → выбор теста.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { StudentAssignment } from '@/features/classroom/types.ts'
import type { DailyChallengeData } from '@/features/mainPage/dailyChallenge/api.ts'
import { dueLeft, questionsCount } from '@/features/classroom/format.ts'

const props = defineProps<{
  assignment: StudentAssignment | null
  daily: DailyChallengeData | null
}>()

const { t } = useI18n()
const router = useRouter()

const dailyAvailable = computed(() =>
  !!props.daily && !props.daily.empty && props.daily.total_questions > 0
)

const mode = computed<'assignment' | 'daily' | 'dailyDone' | 'explore'>(() => {
  if (props.assignment) return 'assignment'
  if (dailyAvailable.value && !props.daily!.completed) return 'daily'
  if (dailyAvailable.value) return 'dailyDone'
  return 'explore'
})

function go() {
  if (mode.value === 'assignment') router.push(`/assignment/${props.assignment!.id}`)
  else if (mode.value === 'daily') router.push('/daily')
  else router.push('/quiz')
}
</script>

<template>
  <section class="hero ui-hero" :aria-label="t('home.todayAssignment')">
    <!-- 1. Задание от учителя -->
    <template v-if="mode === 'assignment' && assignment">
      <span class="ui-chip ui-chip--on-dark">{{ t('home.todayAssignment') }}</span>
      <div class="hero__text">
        <b class="hero__title">{{ assignment.title }}</b>
        <span class="hero__meta">
          {{ assignment.classroom_title }} · {{ t('classes.questions', { n: questionsCount(assignment) }) }}
          <template v-if="assignment.time_limit_min"> · {{ t('classes.minutes', { n: assignment.time_limit_min }) }}</template>
          · {{ dueLeft(assignment.due_at) }}
        </span>
      </div>
      <button type="button" class="ui-btn ui-btn--light hero__cta" @click="go">
        {{ assignment.student_status === 'in_progress' ? t('classes.continue') : t('home.startAssignment') }}
      </button>
    </template>

    <!-- 2. Вызов дня -->
    <template v-else-if="mode === 'daily' && daily">
      <span class="ui-chip ui-chip--on-dark">{{ t('home.todayDaily') }}</span>
      <div class="hero__text">
        <b class="hero__title">{{ t('daily.title') }}</b>
        <span class="hero__meta">
          {{ daily.streak > 0 ? t('home.dailyQuestions', { n: daily.total_questions, s: daily.streak }) : t('daily.progress', { n: daily.answered_count, m: daily.total_questions }) }}
        </span>
      </div>
      <div class="hero__progress" v-if="daily.answered_count > 0">
        <span class="hero__bar"><span :style="{ width: (daily.answered_count / daily.total_questions) * 100 + '%' }" /></span>
        <span>{{ daily.answered_count }}/{{ daily.total_questions }}</span>
      </div>
      <button type="button" class="ui-btn ui-btn--light hero__cta" @click="go">
        {{ daily.answered_count > 0 ? t('home.continueDaily') : t('home.startDaily') }}
      </button>
    </template>

    <!-- 3. Вызов пройден / нечего делать — выбрать тест -->
    <template v-else>
      <span class="ui-chip ui-chip--on-dark">{{ mode === 'dailyDone' ? t('home.dailyDone') : t('home.todayContinue') }}</span>
      <div class="hero__text">
        <b class="hero__title">{{ t('home.chooseTest') }}</b>
        <span class="hero__meta" v-if="mode === 'dailyDone'">{{ t('home.dailyDoneHint') }}</span>
      </div>
      <button type="button" class="ui-btn ui-btn--light hero__cta" @click="go">{{ t('home.allTests') }}</button>
    </template>
  </section>
</template>

<style scoped lang="scss">
.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 22px;

  &__text { display: flex; flex-direction: column; gap: 4px; }
  &__title { font-size: 24px; line-height: 1.2; }
  &__meta { font-size: 14px; color: rgba(255, 255, 255, 0.92); }

  &__progress {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    font-size: 13px;
    font-weight: 700;
  }

  &__bar {
    flex: 1;
    height: 6px;
    border-radius: 3px;
    background: rgba(255, 255, 255, 0.25);
    overflow: hidden;

    span { display: block; height: 100%; border-radius: 3px; background: #FFFFFF; }
  }

  &__cta { align-self: stretch; min-height: 50px; font-size: 16px; }

  @media (min-width: 1024px) {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 24px;
    padding: 30px 34px;

    > .ui-chip, .hero__text, .hero__progress { grid-column: 1; }
    > .ui-chip { justify-self: start; }
    &__title { font-size: 30px; }
    &__cta { grid-column: 2; grid-row: 1 / span 3; align-self: center; padding: 0 30px; min-height: 54px; }
  }
}
</style>
