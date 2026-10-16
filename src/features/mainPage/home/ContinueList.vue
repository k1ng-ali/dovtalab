<script setup lang="ts">
// Последние попытки: точность считается от отвеченных, а не от всех вопросов теста.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ArrowRight from '@iconify-vue/solar/alt-arrow-right-linear'
import type { AttemptStat } from '@/features/mainPage/statistic/type.ts'
import { subjectInitials, subjectTint } from '@/shared/lib/subjectTint.ts'

const props = defineProps<{ attempts: AttemptStat[] }>()

const { t } = useI18n()
const router = useRouter()

// Одна строка на тест — самая свежая попытка
const items = computed(() => {
  const seen = new Set<number>()
  return props.attempts
    .filter(a => a.total_count != null && (a.total_count ?? 0) > 0)
    .filter(a => (seen.has(a.quiz_id) ? false : (seen.add(a.quiz_id), true)))
    .slice(0, 3)
})
</script>

<template>
  <section v-if="items.length" class="continue">
    <div class="ui-section-head">
      <h2 class="ui-section-head__title">{{ t('home.continue') }}</h2>
      <button type="button" class="ui-section-head__link" @click="router.push('/quiz')">{{ t('home.allTests') }}</button>
    </div>
    <div class="continue__list ui-card ui-card--list">
      <button v-for="a in items" :key="a.quiz_attempt_id" type="button" class="ui-row continue__row" @click="router.push('/quiz')">
        <span class="ui-tile-icon continue__tile" :style="{ background: subjectTint(a.quiz_id).bg, color: subjectTint(a.quiz_id).color }">
          {{ subjectInitials(a.quiz_title) }}
        </span>
        <span class="continue__text">
          <b class="continue__title">{{ a.quiz_title }}</b>
          <span class="continue__meta">
            {{ t('home.attemptLine', { c: a.correct_count ?? 0, a: a.total_count ?? 0, q: a.questions_count ?? '—' }) }}
          </span>
        </span>
        <ArrowRight class="continue__arrow" />
      </button>
    </div>
  </section>
</template>

<style scoped lang="scss">
.continue {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__row {
    width: 100%;
    border-left: none;
    border-right: none;
    border-top: none;
    background: transparent;
    font-family: inherit;
    text-align: left;
    cursor: pointer;

    &:hover { background: rgba(255, 255, 255, 0.5); }
  }

  &__tile { font-size: 14px; }
  &__text { display: flex; flex-direction: column; gap: 3px; flex: 1; min-width: 0; }
  &__title { font-size: 15px; color: var(--c-ink); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__meta { font-size: 13px; color: var(--c-muted); }
  &__arrow { font-size: 20px; color: var(--c-muted); flex-shrink: 0; }
}
</style>
