<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QuestionPublic, AttemptResult} from '@/features/quizPage/types.ts'
import {isSingleAnswer} from "@/features/quizPage/types.ts"
import CheckIcon from '@iconify-vue/solar/check-circle-bold'
import CloseIcon from '@iconify-vue/solar/close-circle-bold'

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

const options = computed(() => props.question.payload.single_choice?.options ?? [])

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

const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
</script>

<template>
  <div class="ui-q">
    <div class="ui-q__card ui-card">
      <p class="ui-q__text">{{ question.text }}</p>
      <img v-if="question.image_url" :src="question.image_url" class="ui-q__image" alt="" />
    </div>

    <div class="ui-q__options" role="radiogroup">
      <div
          v-for="(opt, i) in options"
          :key="opt.id"
          class="ui-answer"
          :class="[optionClass(opt.id), { locked: disabled }]"
          role="radio"
          :aria-checked="selected === opt.id"
          @click="select(opt.id)"
      >
        <span class="ui-answer__mark">{{ LETTERS[i] }}</span>
        <span class="ui-answer__text">{{ opt.text }}</span>
        <CheckIcon v-if="result && correctId === opt.id" class="ui-answer__state" />
        <CloseIcon v-else-if="result && selected === opt.id" class="ui-answer__state" />
      </div>
    </div>
  </div>
</template>
