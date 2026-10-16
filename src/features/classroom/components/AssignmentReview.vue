<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UserAnswerPayload } from '@/features/quizPage/types.ts'
import type { AnswerReviewItem, AttemptReview } from '../types.ts'
import CorrectIcon from '@iconify-vue/solar/check-circle-bold'
import WrongIcon from '@iconify-vue/solar/close-circle-bold'

defineProps<{ review: AttemptReview }>()

const { t } = useI18n()

function optionText(item: AnswerReviewItem, id: number) {
  const options = item.payload.single_choice?.options ?? item.payload.multiple_choice?.options ?? []
  return options.find(o => o.id === id)?.text ?? `#${id}`
}

function answerText(item: AnswerReviewItem, a: UserAnswerPayload | null) {
  if (!a) return t('classes.noAnswer')
  switch (a.type) {
    case 'single_choice': return optionText(item, a.selected_option_id)
    case 'multiple_choice': return a.selected_option_ids.map(id => optionText(item, id)).join(', ') || t('classes.noAnswer')
    case 'input': return a.answer_text
    case 'matching': {
      const left = item.payload.matching?.left ?? []
      const right = item.payload.matching?.right ?? []
      const pairs = Object.entries(a.pairs)
      if (!pairs.length) return t('classes.noAnswer')
      return pairs.map(([l, r]) =>
        `${left.find(x => String(x.id) === l)?.text ?? l} → ${right.find(x => x.id === r)?.text ?? r}`
      ).join('; ')
    }
  }
  return '—'
}
</script>

<template>
  <div class="review">
    <div v-for="(item, i) in review.items" :key="item.question_id" class="item ui-card"
         :class="item.is_correct === true ? 'item--ok' : item.is_correct === false ? 'item--bad' : 'item--none'">
      <div class="item__head">
        <span class="item__num">{{ i + 1 }}</span>
        <CorrectIcon v-if="item.is_correct === true" class="item__mark" />
        <WrongIcon v-else-if="item.is_correct === false" class="item__mark" />
        <span v-else class="item__mark">—</span>
      </div>
      <p class="item__text">{{ item.text }}</p>
      <img v-if="item.image_url" :src="item.image_url" alt="" class="item__img" />
      <p class="item__line"><span>{{ t('classes.yourAnswer') }}</span>{{ answerText(item, item.answer) }}</p>
      <p v-if="item.is_correct !== true && item.correct_answer" class="item__line item__line--correct">
        <span>{{ t('classes.correctAnswer') }}</span>{{ answerText(item, item.correct_answer) }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.review { display: flex; flex-direction: column; gap: 10px; }

.item {
  padding: 14px 16px;

  &--ok .item__mark { color: var(--c-correct); }
  &--bad .item__mark { color: var(--c-wrong); }
  &--none .item__mark { color: var(--c-muted-2); }

  &__head { display: flex; justify-content: space-between; align-items: center; }

  &__num {
    min-width: 24px;
    height: 24px;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(35, 73, 112, 0.08);
    font-size: 12px;
    font-weight: 800;
    color: var(--c-ink-2);
  }

  &__mark { font-size: 22px; font-weight: 800; }
  &__text { margin: 8px 0 10px; font-size: 15px; font-weight: 700; line-height: 1.45; color: var(--c-navy-900); }
  &__img { max-width: 100%; max-height: 200px; border-radius: 12px; margin-bottom: 8px; }

  &__line {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin: 0 0 6px;
    padding: 8px 12px;
    border-radius: 12px;
    background: rgba(23, 46, 74, 0.04);
    font-size: 14px;
    color: var(--c-ink);

    span { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; color: var(--c-muted); }

    &--correct { background: var(--c-teal-tint); span { color: var(--c-teal-600); } }
  }
}
</style>
