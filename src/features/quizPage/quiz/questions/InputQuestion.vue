<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QuestionPublic, AttemptResult} from '@/features/quizPage/types.ts'
import {isInputAnswer} from "@/features/quizPage/types.ts"
import PenIcon from '@iconify-vue/solar/pen-linear'
import CorrectIcon from '@iconify-vue/solar/check-circle-bold'
import CloseIcon from '@iconify-vue/solar/close-circle-bold'

const props = defineProps<{
  question: QuestionPublic
  disabled?: boolean
  result?: AttemptResult | null
}>()

const emit = defineEmits<{
  (e: 'answer', value: string): void
}>()

const value = ref('')

watch(() => props.question.id, () => {
  value.value = ''
  emit('answer', '')
})

// payload — обёрнутый: { input: { numeric: bool, ... } }
const payload = computed(() => props.question.payload.input)

const onInput = (e: Event) => {
  if (props.disabled) return
  value.value = (e.target as HTMLInputElement).value
  emit('answer', value.value)
}

const inputClass = computed(() => {
  if (!props.result) return ''
  return props.result.is_correct ? 'input-correct' : 'input-wrong'
})

const correctValue = computed(() => {
  const ans = props.result?.correct_answer
  return isInputAnswer(ans) ? ans.answer_text : null
})
</script>

<template>
  <div class="ui-q">
    <div class="ui-q__card ui-card">
      <p class="ui-q__text">{{ question.text }}</p>
      <img v-if="question.image_url" :src="question.image_url" class="ui-q__image" alt="" />
    </div>

    <div class="input-wrapper">
      <input
          class="answer-input"
          :class="inputClass"
          :type="payload?.numeric ? 'number' : 'text'"
          :placeholder="$t('questions.inputPlaceholder')"
          :value="value"
          :disabled="disabled"
          @input="onInput"
          autocomplete="off" autocorrect="off" spellcheck="false"
      />
      <span class="input-icon" :class="inputClass">
        <template v-if="result">
          <CorrectIcon v-if="result.is_correct" />
          <CloseIcon v-else />
        </template>
        <PenIcon v-else />
      </span>
    </div>

    <div v-if="correctValue" class="correct-answer-hint">
      {{ $t('questions.correctAnswer') }} <strong>{{ correctValue }}</strong>
    </div>

    <p class="ui-q__hint" v-if="payload && !payload.numeric && !result">{{ $t('questions.caseInsensitive') }}</p>
  </div>
</template>

<style scoped lang="scss">
.input-wrapper { position: relative; }

.answer-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 58px;
  padding: 0 52px 0 20px;
  font-size: 17px;
  font-weight: 600;
  font-family: inherit;
  color: var(--c-navy-900);
  background: var(--glass-bg-strong);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: none;
  border-radius: var(--r-md);
  outline: none;
  box-shadow: inset 0 0 0 1px var(--c-line-2), var(--shadow-card);
  transition: box-shadow 0.2s ease;

  &::placeholder { color: var(--c-muted-2); font-weight: 500; }
  &:focus { box-shadow: inset 0 0 0 2px var(--c-teal-600), var(--shadow-card); }
  &:disabled { cursor: default; }
  &.input-correct { background: rgba(225, 241, 241, 0.92); box-shadow: inset 0 0 0 2px var(--c-correct), var(--shadow-card); }
  &.input-wrong   { background: rgba(253, 238, 226, 0.92); box-shadow: inset 0 0 0 2px var(--c-wrong), var(--shadow-card); }
}

.input-icon {
  position: absolute;
  right: 18px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 22px;
  color: var(--c-muted-2);
  pointer-events: none;

  &.input-correct { color: var(--c-correct); }
  &.input-wrong { color: var(--c-wrong); }
}

.correct-answer-hint {
  padding: 12px 16px;
  border-radius: var(--r-md);
  background: var(--c-teal-tint);
  font-size: 14px;
  color: var(--c-ink);

  strong { font-weight: 800; color: var(--c-correct); }
}
</style>
