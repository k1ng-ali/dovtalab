<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QuestionPublic, AttemptResult} from '@/features/quizPage/types.ts'
import {isSingleAnswer} from "@/features/quizPage/types.ts"

const props = defineProps<{
  question: QuestionPublic
  disabled?: boolean
  result?: AttemptResult | null
}>()

const emit = defineEmits<{
  (e: 'answer', optionId: number | null): void
}>()

const selected = ref<number | null>(null)

watch(() => props.question.id, () => {
  selected.value = null
  emit('answer', null)
})

const select = (id: number) => {
  if (props.disabled) return
  selected.value = id
  emit('answer', id)
}

const options = props.question.payload.single_choice?.options ?? []

// Правильный id из ответа сервера
const correctId = computed(() =>{
  const ans = props.result?.correct_answer
  return isSingleAnswer(ans) ? ans.selected_option_id : null
})

const optionClass = (id: number) => {
  if (!props.result) return { selected: selected.value === id }

  if (selected.value === id) {
    return selected.value === correctId.value ? { correct: true } : { wrong: true }
  }

  if (correctId.value === id) return { correct: true }

  return {}
}

const radioClass = (id: number) => {
  if (!props.result) return { selected: selected.value === id }

  if (selected.value === id) {
    return selected.value === correctId.value ? { correct: true } : { wrong: true }
  }

  if (correctId.value === id) return { correct: true }

  return {}
}

</script>

<template>
  <div class="single-choice">
    <p class="question-text">{{ question.text }}</p>

    <img
        v-if="question.image_url"
        :src="question.image_url"
        class="question-image"
        alt=""
    />

    <div class="options">
      <div
          v-for="opt in options"
          :key="opt.id"
          class="option"
          :class="optionClass(opt.id)"
          :style="disabled ? { cursor: 'default', pointerEvents: 'none' } : {}"
          @click="select(opt.id)"
      >
        <div class="option-radio" :class="radioClass(opt.id)">
          <div class="radio-dot"
               v-if="selected === opt.id || (result && correctId === opt.id)"
               :class="radioClass(opt.id)"
          />
        </div>
        <span class="option-text">{{ opt.text }}</span>
        <span v-if="result && correctId === opt.id" class="answer-icon">✓</span>
        <span v-else-if="result && selected === opt.id && correctId !== opt.id" class="answer-icon wrong-icon">✗</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.single-choice {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.question-text {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #234970;
  line-height: 1.5;
}

.question-image {
  width: 100%;           /* масштаб по ширине контейнера */
  aspect-ratio: 1 / 1;   /* сохраняем соотношение сторон 1:1 */
  border-radius: 16px;
  object-fit: cover;     /* изображение полностью заполнит квадрат, обрезая лишнее */
  max-width: 400px;      /* если нужно ограничить по ширине */
}

.options {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.75);
  border: 1.5px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:active { transform: scale(0.98); }

  &.selected {
    border-color: rgba(78, 190, 194, 0.7);
    background: rgba(78, 190, 194, 0.1);
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.2);
  }

  &.correct {
    border-color: rgba(34, 197, 94, 0.7);
    background: rgba(34, 197, 94, 0.1);
    box-shadow: 0 4px 16px rgba(34, 197, 94, 0.2);
  }

  &.wrong {
    border-color: rgba(239, 68, 68, 0.7);
    background: rgba(239, 68, 68, 0.08);
    box-shadow: 0 4px 16px rgba(239, 68, 68, 0.15);
  }
}

.option-radio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid rgba(35, 73, 112, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: border-color 0.2s, background 0.2s;

  &.selected { border-color: #4EBEC2; }
  &.correct  { border-color: #22c55e; background: #22c55e; }
  &.wrong    { border-color: #ef4444; background: #ef4444; }
}

.radio-dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
  background: #4EBEC2;

  &.correct { background: #fff; }
  &.wrong   { background: #fff; }
}

.option-text {
  font-size: 15px;
  color: #374151;
  line-height: 1.4;
  flex: 1;
}

.answer-icon {
  font-size: 16px;
  font-weight: 700;
  color: #22c55e;
  flex-shrink: 0;
}

.wrong-icon {
  color: #ef4444;
}
</style>