<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QuestionPublic, AttemptResult } from '@/features/quizPage/types.ts'

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

const correctValue = computed(() =>
    !props.result?.is_correct ? (props.result?.correct_answer?.answer_text ?? null) : null
)
</script>

<template>
  <div class="input-question">
    <p class="question-text">{{ question.text }}</p>
    <img v-if="question.image_url" :src="question.image_url" class="question-image" alt="" />

    <div class="input-wrapper">
      <input
          class="answer-input"
          :class="inputClass"
          :type="payload?.numeric ? 'number' : 'text'"
          placeholder="Введите ответ..."
          :value="value"
          :disabled="disabled"
          @input="onInput"
          autocomplete="off" autocorrect="off" spellcheck="false"
      />
      <span class="input-icon">
        <template v-if="result">{{ result.is_correct ? '✅' : '❌' }}</template>
        <template v-else>✏️</template>
      </span>
    </div>

    <div v-if="correctValue" class="correct-answer-hint">
      Правильный ответ: <strong>{{ correctValue }}</strong>
    </div>

    <p class="case-hint" v-if="payload && !payload.numeric && !result">Регистр не важен</p>
  </div>
</template>

<style scoped lang="scss">
.input-question { display: flex; flex-direction: column; gap: 16px; }
.question-text { margin: 0; font-size: 17px; font-weight: 600; color: #234970; line-height: 1.5; }
.question-image {
  width: 100%;           /* масштаб по ширине контейнера */
  aspect-ratio: 1 / 1;   /* сохраняем соотношение сторон 1:1 */
  border-radius: 16px;
  object-fit: cover;     /* изображение полностью заполнит квадрат, обрезая лишнее */
  max-width: 400px;      /* если нужно ограничить по ширине */
}
.input-wrapper { position: relative; }

.answer-input {
  width: 100%; box-sizing: border-box; padding: 14px 46px 14px 16px;
  font-size: 16px; font-family: inherit; color: #234970;
  background: rgba(255,255,255,0.85); border: 1.5px solid rgba(35,73,112,0.15);
  border-radius: 18px; outline: none; box-shadow: 0 3px 10px rgba(0,0,0,0.05);
  transition: border-color 0.2s, box-shadow 0.2s;
  &::placeholder { color: #C0C6CF; }
  &:focus { border-color: rgba(78,190,194,0.7); box-shadow: 0 0 0 3px rgba(78,190,194,0.12); }
  &:disabled { cursor: default; opacity: 0.85; }
  &.input-correct { border-color: rgba(34,197,94,0.7); background: rgba(34,197,94,0.06); box-shadow: 0 0 0 3px rgba(34,197,94,0.1); }
  &.input-wrong   { border-color: rgba(239,68,68,0.7);  background: rgba(239,68,68,0.05);  box-shadow: 0 0 0 3px rgba(239,68,68,0.1); }
}

.input-icon { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); font-size: 18px; pointer-events: none; }

.correct-answer-hint {
  font-size: 13px; color: #166534;
  background: rgba(34,197,94,0.08); border: 1px solid rgba(34,197,94,0.25);
  border-radius: 12px; padding: 10px 14px;
  strong { font-weight: 700; }
}

.case-hint { margin: 0; font-size: 12px; color: #9CA3AF; }
</style>