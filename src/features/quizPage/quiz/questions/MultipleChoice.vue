<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { QuestionPublic, AttemptResult} from '@/features/quizPage/types.ts'
import {isMultipleAnswer} from "@/features/quizPage/types.ts"
import CheckIcon from '@iconify-vue/solar/check-read-linear'
import CorrectIcon from '@iconify-vue/solar/check-circle-bold'
import CloseIcon from '@iconify-vue/solar/close-circle-bold'
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
  <div class="ui-q">
    <div class="ui-q__card ui-card">
      <p class="ui-q__text">{{ question.text }}</p>
      <img v-if="question.image_url" :src="question.image_url" class="ui-q__image" alt="" />
    </div>

    <p class="ui-q__hint" v-if="payload?.max_choices">
      {{ $t('questions.maxChoices', { n: payload.max_choices }) }}
    </p>

    <div class="ui-q__options">
      <div
          v-for="opt in options"
          :key="opt.id"
          class="ui-answer"
          :class="[optionClass(opt.id), { locked: disabled }]"
          role="checkbox"
          :aria-checked="isSelected(opt.id)"
          @click="toggle(opt.id)"
      >
        <span class="ui-answer__mark ui-answer__mark--box">
          <CheckIcon v-if="isSelected(opt.id) || (result && correctIds.has(opt.id))" />
        </span>
        <span class="ui-answer__text">{{ opt.text }}</span>
        <CorrectIcon v-if="result && correctIds.has(opt.id)" class="ui-answer__state" />
        <CloseIcon v-else-if="result && isSelected(opt.id)" class="ui-answer__state" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.ui-answer__mark--box { font-size: 18px; }
</style>
