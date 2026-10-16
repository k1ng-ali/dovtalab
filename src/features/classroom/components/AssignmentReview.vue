<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import type { UserAnswerPayload } from '@/features/quizPage/types.ts'
import type { AnswerReviewItem, AttemptReview } from '../types.ts'

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
    <div v-for="(item, i) in review.items" :key="item.question_id" class="item"
         :class="item.is_correct === true ? 'item--ok' : item.is_correct === false ? 'item--bad' : 'item--none'">
      <div class="item__head">
        <span class="item__num">{{ i + 1 }}</span>
        <span class="item__mark">{{ item.is_correct === true ? '✓' : item.is_correct === false ? '✗' : '—' }}</span>
      </div>
      <p class="item__text">{{ item.text }}</p>
      <img v-if="item.image_url" :src="item.image_url" alt="" class="item__img" />
      <p class="item__line"><span>{{ t('classes.yourAnswer') }}:</span> {{ answerText(item, item.answer) }}</p>
      <p v-if="item.is_correct !== true && item.correct_answer" class="item__line item__line--correct">
        <span>{{ t('classes.correctAnswer') }}:</span> {{ answerText(item, item.correct_answer) }}
      </p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.review { display: flex; flex-direction: column; gap: 10px; }

.item {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 16px;
  border-left: 4px solid transparent;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  &--ok { border-left-color: #10B981; }
  &--bad { border-left-color: #EF4444; }
  &--none { border-left-color: rgba(0, 0, 0, 0.1); }

  &__head { display: flex; justify-content: space-between; }
  &__num { font-size: 12px; font-weight: 700; color: #9CA3AF; }
  &__mark { font-weight: 800; color: #374151; }
  &__text { margin: 4px 0 8px; font-size: 15px; font-weight: 600; color: #1F2937; }
  &__img { max-width: 100%; max-height: 200px; border-radius: 12px; margin-bottom: 8px; }

  &__line {
    margin: 2px 0;
    font-size: 14px;
    color: #374151;

    span { color: #9CA3AF; }
    &--correct { color: #059669; }
  }
}
</style>
