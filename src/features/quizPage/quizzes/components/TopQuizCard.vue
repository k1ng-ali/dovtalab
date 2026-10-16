<script setup lang="ts">
// Популярный тест: стеклянная карточка с местом и плашкой предмета.
import { computed } from 'vue'
import ListIcon from '@iconify-vue/solar/notebook-linear'
import type { QuizIn } from '@/features/quizPage/types.ts'
import { subjectInitials, subjectTint } from '@/shared/lib/subjectTint.ts'

const props = defineProps<{
  quiz: QuizIn
  index: number
}>()

const tint = computed(() => subjectTint(props.quiz.id))
const totalQuestions = computed(() => props.quiz.details?.total_questions ?? 0)
</script>

<template>
  <div class="top-card ui-card">
    <div class="top-card__head">
      <span class="top-card__tile" :style="{ background: tint.bg, color: tint.color }">{{ subjectInitials(quiz.title) }}</span>
      <span class="top-card__rank" :class="{ 'top-card__rank--first': index === 0 }">{{ index + 1 }}</span>
    </div>
    <h4 class="top-card__title">{{ quiz.title }}</h4>
    <p v-if="quiz.description" class="top-card__desc">{{ quiz.description }}</p>
    <span v-if="totalQuestions" class="ui-chip top-card__meta"><ListIcon />{{ $t('units.questionsShort', { n: totalQuestions }) }}</span>
  </div>
</template>

<style scoped lang="scss">
.top-card {
  flex-shrink: 0;
  width: 210px;
  min-height: 160px;
  box-sizing: border-box;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease;

  &:hover { box-shadow: 0 14px 34px rgba(23, 46, 74, 0.12); }
  &:active { transform: scale(0.97); }

  &__head { display: flex; justify-content: space-between; align-items: center; }

  &__tile {
    width: 44px;
    height: 44px;
    border-radius: 14px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 15px;
    font-weight: 800;
  }

  &__rank {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(35, 73, 112, 0.08);
    color: var(--c-ink-2);
    font-size: 13px;
    font-weight: 800;

    &--first { background: var(--grad-primary); color: #FFFFFF; }
  }

  &__title {
    margin: 0;
    font-size: 15px;
    font-weight: 700;
    color: var(--c-navy-900);
    line-height: 1.3;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__desc {
    margin: 0;
    font-size: 12px;
    color: var(--c-muted);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__meta { margin-top: auto; align-self: flex-start; font-weight: 600; :deep(svg) { font-size: 14px; } }
}
</style>
