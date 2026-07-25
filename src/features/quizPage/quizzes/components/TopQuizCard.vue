<script setup lang="ts">
import type { QuizIn } from '@/features/quizPage/types.ts'
import { computed } from 'vue'

const props = defineProps<{
  quiz: QuizIn
  index: number
}>()

const GRADIENTS: [string, string][] = [
  ['#4EBEC2', '#234970'],
  ['#6366F1', '#8B5CF6'],
  ['#F59E0B', '#EF4444'],
  ['#10B981', '#059669'],
  ['#EC4899', '#8B5CF6'],
  ['#3B82F6', '#06B6D4'],
]

const gradient = computed((): [string, string] => GRADIENTS[props.quiz.id % GRADIENTS.length]!)

const cardStyle = computed(() => ({
  background: `linear-gradient(135deg, ${gradient.value[0]}, ${gradient.value[1]})`,
}))

const totalQuestions = computed(() => props.quiz.details?.total_questions ?? 0)

const medals = ['🥇', '🥈', '🥉']
const medal = computed(() => medals[props.index] ?? '')
</script>

<template>
  <div class="top-card" :style="cardStyle">
    <span class="medal">{{ medal }}</span>
    <h4 class="title">{{ quiz.title }}</h4>
    <p class="desc">{{ quiz.description }}</p>
    <div class="meta">
      <span v-if="totalQuestions" class="meta-item">📝 {{ totalQuestions }} вопр.</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.top-card {
  flex-shrink: 0;
  width: 200px;
  min-height: 140px;
  border-radius: 20px;
  padding: 16px;
  color: white;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: -30%;
    right: -20%;
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.08);
  }

  &:active {
    transform: scale(0.95);
  }
}

.medal {
  font-size: 22px;
  margin-bottom: 6px;
}

.title {
  margin: 0;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.desc {
  margin: 4px 0 0;
  font-size: 11px;
  opacity: 0.8;
  line-height: 1.3;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.meta {
  margin-top: 8px;
  display: flex;
  gap: 6px;
}

.meta-item {
  font-size: 11px;
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
}
</style>
