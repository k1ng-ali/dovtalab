<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import type { QuestionPublic, AttemptResult } from '@/features/quizPage/types.ts'
import {isMatchingAnswer} from "@/features/quizPage/types.ts"
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

const matchedRightForLeft = (leftId: number) => matched.value[String(leftId)] ?? null
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
</script>

<template>
  <div class="matching">
    <p class="question-text">{{ question.text }}</p>

    <img
        v-if="question.image_url"
        :src="question.image_url"
        class="question-image"
        alt=""
    />

    <p class="hint">Нажмите элемент слева, затем справа — они соединятся</p>

    <div class="columns">
      <div class="column">
        <div v-for="item in leftItems" :key="item.id" class="match-item" :class="leftState(item.id)" @click="tapLeft(item.id)">
          {{ item.text }}
          <span v-if="matched[String(item.id)] != null" class="pair-badge">
            {{ rightItems.find(r => r.id === matchedRightForLeft(item.id))?.text?.slice(0, 8) }}…
          </span>
        </div>
      </div>

      <div class="divider">
        <div v-for="(_, i) in leftItems" :key="i" class="divider-line" />
      </div>

      <div class="column">
        <div v-for="item in rightItems" :key="item.id" class="match-item right" :class="rightState(item.id)" @click="tapRight(item.id)">
          {{ item.text }}
        </div>
      </div>
    </div>

    <div class="pairs-summary" v-if="Object.keys(matched).length">
      <p class="pairs-title">Составленные пары:</p>
      <div v-for="(rightId, leftId) in matched" :key="leftId" class="pair-row" :class="result ? pairResultClass(Number(leftId)) : ''">
        <span>{{ leftItems.find(l => l.id === Number(leftId))?.text }}</span>
        <span class="arrow">→</span>
        <span>{{ rightItems.find(r => r.id === rightId)?.text }}</span>
        <span v-if="result" class="pair-icon">{{ pairResultClass(Number(leftId)) === 'correct' ? '✅' : '❌' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.matching { display: flex; flex-direction: column; gap: 16px; }
.question-text { margin: 0; font-size: 17px; font-weight: 600; color: #234970; line-height: 1.5; }


.question-image {
  width: 100%;           /* масштаб по ширине контейнера */
  border-radius: 16px;
  object-fit: cover;     /* изображение полностью заполнит квадрат, обрезая лишнее */
  max-height: 500px;      /* если нужно ограничить по ширине */
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.05);
}

.hint { margin: 0; font-size: 13px; color: #9CA3AF; }

.columns { display: flex; gap: 0; align-items: flex-start; }
.column { flex: 1; display: flex; flex-direction: column; gap: 8px; }

.divider {
  display: flex; flex-direction: column; gap: 8px; padding: 0 6px;
  .divider-line { width: 2px; height: 44px; border-radius: 2px; background: rgba(35,73,112,0.15); margin: 0 auto; }
}

.match-item {
  padding: 10px 12px; border-radius: 14px; font-size: 13px; font-weight: 500; color: #374151;
  background: rgba(255,255,255,0.75); border: 1.5px solid rgba(255,255,255,0.9);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05); cursor: pointer; transition: all 0.2s ease;
  user-select: none; text-align: left; min-height: 44px;
  display: flex; flex-direction: column; justify-content: center; gap: 3px;
  &:active { transform: scale(0.97); }
  &.right { text-align: right; align-items: flex-end; }
  &.active   { border-color: #4EBEC2; background: rgba(78,190,194,0.1); box-shadow: 0 4px 14px rgba(78,190,194,0.25); }
  &.matched  { border-color: rgba(35,73,112,0.3); background: rgba(35,73,112,0.07); }
  &.correct  { border-color: rgba(34,197,94,0.7);  background: rgba(34,197,94,0.1);  }
  &.wrong    { border-color: rgba(239,68,68,0.7);  background: rgba(239,68,68,0.08); }
}

.pair-badge { font-size: 10px; color: #4EBEC2; font-weight: 600; }

.pairs-summary {
  background: rgba(255,255,255,0.7); border-radius: 16px; padding: 14px 16px;
  display: flex; flex-direction: column; gap: 8px; border: 1px solid rgba(255,255,255,0.9);
}
.pairs-title { margin: 0; font-size: 12px; font-weight: 600; color: #9CA3AF; text-transform: uppercase; letter-spacing: 0.5px; }
.pair-row {
  display: flex; align-items: center; gap: 8px; font-size: 13px; color: #374151;
  padding: 4px 6px; border-radius: 8px; transition: background 0.2s;
  .arrow { color: #4EBEC2; font-weight: 700; }
  .pair-icon { margin-left: auto; font-size: 14px; }
  &.correct { background: rgba(34,197,94,0.08); color: #166534; }
  &.wrong   { background: rgba(239,68,68,0.08); color: #991b1b; }
}
</style>