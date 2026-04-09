<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { QuestionPublic, AttemptResult} from '@/features/quizPage/types.ts'
import {isMultipleAnswer} from "@/features/quizPage/types.ts"
const props = defineProps<{
  question: QuestionPublic
  disabled?: boolean
  result?: AttemptResult | null
}>()

const emit = defineEmits<{
  (e: 'answer', ids: number[]): void
}>()

const selected = ref<Set<number>>(new Set())

watch(() => props.question.id, () => {
  selected.value = new Set()
  emit('answer', [])
})

// payload — это напрямую MultipleChoicePublic, без обёртки
const payload    = computed(() => props.question.payload.multiple_choice)
const options    = computed(() => payload.value?.options ?? [])
const maxChoices = computed(() => payload.value?.max_choices ?? Infinity)

const toggle = (id: number) => {
  if (props.disabled) return
  const s = new Set(selected.value)
  if (s.has(id)) {
    s.delete(id)
  } else if (s.size < maxChoices.value) {
    s.add(id)
  }
  selected.value = s
  emit('answer', [...s])
}

const isSelected = (id: number) => selected.value.has(id)

// Правильные id из ответа сервера
const correctIds = computed(() => {
  const ans = props.result?.correct_answer
  return new Set(isMultipleAnswer(ans) ? ans.selected_option_ids : [])
})

const optionClass = (id: number) => {
  if (!props.result) {
    return { selected: isSelected(id) }
  }
  if (correctIds.value.has(id)) return { correct: true }
  if (isSelected(id) && !correctIds.value.has(id)) return { wrong: true }
  return {}
}
</script>

<template>
  <div class="multiple-choice">
    <p class="question-text">{{ question.text }}</p>

    <p class="hint" v-if="payload?.max_choices">
      Выберите до {{ payload.max_choices }} вариантов
    </p>

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
          @click="toggle(opt.id)"
      >
        <div class="checkbox" :class="optionClass(opt.id)">
          <span v-if="isSelected(opt.id) || (result && correctIds.has(opt.id))" class="check">✓</span>
        </div>
        <span class="option-text">{{ opt.text }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.multiple-choice {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.question-text {
  margin: 0;
  font-size: 17px;
  font-weight: 600;
  color: #234970;
  line-height: 1.5;
}

.hint {
  margin: 0;
  font-size: 13px;
  color: #9CA3AF;
}

.question-image {
  width: 100%;
  border-radius: 16px;
  object-fit: cover;
  max-height: 200px;
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

.checkbox {
  width: 22px;
  height: 22px;
  border-radius: 7px;
  border: 2px solid rgba(35, 73, 112, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s;
  font-size: 14px;
  font-weight: 700;
  color: #fff;

  &.selected { background: #4EBEC2; border-color: #4EBEC2; }
  &.correct  { background: #22c55e; border-color: #22c55e; }
  &.wrong    { background: #ef4444; border-color: #ef4444; }
}

.option-text {
  font-size: 15px;
  color: #374151;
  line-height: 1.4;
  flex: 1;
}
</style>