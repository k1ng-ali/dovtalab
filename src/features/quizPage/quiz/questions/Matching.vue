<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QuestionPublic, AttemptResult } from '@/features/quizPage/types.ts'
import {isMatchingAnswer} from "@/features/quizPage/types.ts"
import ArrowIcon from '@iconify-vue/solar/arrow-right-linear'
import CorrectIcon from '@iconify-vue/solar/check-circle-bold'
import CloseIcon from '@iconify-vue/solar/close-circle-bold'
const props = defineProps<{
  question: QuestionPublic
  disabled?: boolean
  result?: AttemptResult | null
}>()

const emit = defineEmits<{
  (e: 'answer', pairs: Record<string, number>): void
}>()

// payload — обёрнутый: { matching: { left: [...], right: [...] } }
const payload    = computed(() => props.question.payload.matching)
const leftItems  = computed(() => payload.value?.left  ?? [])
const rightItems = computed(() => payload.value?.right ?? [])

const selectedLeft  = ref<number | null>(null)
const selectedRight = ref<number | null>(null)
const matched = ref<Record<string, number>>({})

watch(() => props.question.id, () => {
  selectedLeft.value = null; selectedRight.value = null; matched.value = {}
  emit('answer', {} as Record<string, number>)
})

const matchedLeftForRight = (rightId: number): number | null => {
  const entry = Object.entries(matched.value).find(([, v]) => v === rightId)
  return entry ? Number(entry[0]) : null
}

const emitPairs = () => {
  emit('answer', matched.value)
}

const tapLeft = (id: number) => {
  if (props.disabled) return
  if (matched.value[String(id)] != null) {
    delete matched.value[String(id)]; matched.value = { ...matched.value }; emitPairs(); return
  }
  if (selectedRight.value !== null) {
    matched.value = { ...matched.value, [String(id)]: selectedRight.value }
    selectedRight.value = null; emitPairs(); return
  }
  selectedLeft.value = selectedLeft.value === id ? null : id
}

const tapRight = (id: number) => {
  if (props.disabled) return
  const existingLeft = matchedLeftForRight(id)
  if (existingLeft !== null) {
    delete matched.value[String(existingLeft)]; matched.value = { ...matched.value }; emitPairs(); return
  }
  if (selectedLeft.value !== null) {
    matched.value = { ...matched.value, [String(selectedLeft.value)]: id }
    selectedLeft.value = null; emitPairs(); return
  }
  selectedRight.value = selectedRight.value === id ? null : id
}

const correctPairs = computed(() => {
  const ans = props.result?.correct_answer
  return isMatchingAnswer(ans) ? ans.pairs : null
})

const pairResultClass = (leftId: number): '' | 'correct' | 'wrong' => {
  if (!correctPairs.value) return ''
  const userRight   = matched.value[String(leftId)]
  const serverRight = correctPairs.value[String(leftId)]
  if (userRight === undefined) return ''
  return userRight === serverRight ? 'correct' : 'wrong'
}

const leftState = (id: number) => {
  if (correctPairs.value && matched.value[String(id)] != null) return pairResultClass(id) || 'matched'
  if (matched.value[String(id)] != null) return 'matched'
  if (selectedLeft.value === id)         return 'active'
  return 'idle'
}

const rightState = (id: number) => {
  const leftId = matchedLeftForRight(id)
  if (correctPairs.value && leftId !== null) return pairResultClass(leftId) || 'matched'
  if (leftId !== null)            return 'matched'
  if (selectedRight.value === id) return 'active'
  return 'idle'
}

// Номер пары — одинаковый бейдж слева и справа
const pairNumber = (leftId: number): number | null => {
  const i = Object.keys(matched.value).indexOf(String(leftId))
  return i === -1 ? null : i + 1
}
const pairNumberForRight = (rightId: number): number | null => {
  const leftId = matchedLeftForRight(rightId)
  return leftId === null ? null : pairNumber(leftId)
}
</script>

<template>
  <div class="ui-q">
    <div class="ui-q__card ui-card">
      <p class="ui-q__text">{{ question.text }}</p>
      <img v-if="question.image_url" :src="question.image_url" class="ui-q__image" alt="" />
    </div>

    <p class="ui-q__hint">{{ $t('questions.matchingHint') }}</p>

    <div class="columns">
      <div class="column">
        <div
            v-for="item in leftItems"
            :key="item.id"
            class="match-item"
            :class="[leftState(item.id), { locked: disabled }]"
            @click="tapLeft(item.id)"
        >
          <span class="match-item__text">{{ item.text }}</span>
          <span v-if="pairNumber(item.id)" class="match-item__badge">{{ pairNumber(item.id) }}</span>
        </div>
      </div>

      <div class="column">
        <div
            v-for="item in rightItems"
            :key="item.id"
            class="match-item"
            :class="[rightState(item.id), { locked: disabled }]"
            @click="tapRight(item.id)"
        >
          <span v-if="pairNumberForRight(item.id)" class="match-item__badge">{{ pairNumberForRight(item.id) }}</span>
          <span class="match-item__text">{{ item.text }}</span>
        </div>
      </div>
    </div>

    <div class="pairs ui-card" v-if="Object.keys(matched).length">
      <p class="pairs__title">{{ $t('questions.pairs') }}</p>
      <div
          v-for="(rightId, leftId) in matched"
          :key="leftId"
          class="pairs__row"
          :class="result ? pairResultClass(Number(leftId)) : ''"
      >
        <span class="pairs__num">{{ pairNumber(Number(leftId)) }}</span>
        <span class="pairs__side">{{ leftItems.find(l => l.id === Number(leftId))?.text }}</span>
        <ArrowIcon class="pairs__arrow" />
        <span class="pairs__side">{{ rightItems.find(r => r.id === rightId)?.text }}</span>
        <template v-if="result">
          <CorrectIcon v-if="pairResultClass(Number(leftId)) === 'correct'" class="pairs__icon" />
          <CloseIcon v-else class="pairs__icon" />
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-items: start;
}

.column { display: flex; flex-direction: column; gap: 8px; }

.match-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 52px;
  padding: 10px 12px;
  box-sizing: border-box;
  border-radius: var(--r-md);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--shadow-card);
  font-size: 14px;
  line-height: 1.35;
  color: var(--c-ink);
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease;

  &:active { transform: scale(0.97); }
  &.locked { pointer-events: none; }

  &__text { flex: 1; min-width: 0; word-break: break-word; }

  &__badge {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 50%;
    background: var(--c-navy-900);
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 800;
  }

  &.active  { background: rgba(231, 245, 246, 0.9); box-shadow: inset 0 0 0 2px var(--c-teal-600), var(--shadow-card); }
  &.matched { background: rgba(255, 255, 255, 0.85); box-shadow: inset 0 0 0 1px var(--c-line-2), var(--shadow-card); }
  &.correct { background: rgba(225, 241, 241, 0.92); box-shadow: inset 0 0 0 2px var(--c-correct), var(--shadow-card); .match-item__badge { background: var(--c-correct); } }
  &.wrong   { background: rgba(253, 238, 226, 0.92); box-shadow: inset 0 0 0 2px var(--c-wrong), var(--shadow-card); .match-item__badge { background: var(--c-wrong); } }
}

.pairs {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px 16px;

  &__title {
    margin: 0 0 4px;
    font-size: 12px;
    font-weight: 700;
    color: var(--c-muted);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__row {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 12px;
    font-size: 13px;
    color: var(--c-ink);

    &.correct { background: rgba(11, 107, 112, 0.08); .pairs__icon { color: var(--c-correct); } }
    &.wrong   { background: rgba(232, 131, 58, 0.12); .pairs__icon { color: var(--c-wrong); } }
  }

  &__num {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    border-radius: 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(35, 73, 112, 0.1);
    font-size: 11px;
    font-weight: 800;
  }

  &__side { flex: 1; min-width: 0; }
  &__arrow { color: var(--c-teal-600); font-size: 16px; }
  &__icon { font-size: 18px; }
}
</style>
