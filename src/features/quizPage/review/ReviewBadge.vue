<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getReviewPending } from './api.ts'

const props = defineProps<{
  quizId: number
}>()

const emit = defineEmits<{
  (e: 'start-review'): void
}>()

const pending = ref(0)
const totalInQueue = ref(0)
const loading = ref(true)

onMounted(async () => {
  try {
    const { data } = await getReviewPending(props.quizId)
    pending.value = data.pending
    totalInQueue.value = data.total_in_queue
  } catch {
    // Ничего — просто не показываем виджет
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div
    v-if="!loading && pending > 0"
    class="review-badge"
    @click="emit('start-review')"
  >
    <div class="review-left">
      <span class="review-icon">🔁</span>
      <div class="review-text">
        <span class="review-title">Повторение</span>
        <span class="review-desc">
          {{ pending }} {{ pending === 1 ? 'вопрос' : pending < 5 ? 'вопроса' : 'вопросов' }} готовы к повторению
        </span>
      </div>
    </div>
    <span class="review-count">{{ pending }}</span>
  </div>

  <!-- Subtle indicator when queue exists but nothing due yet -->
  <div
    v-else-if="!loading && totalInQueue > 0 && pending === 0"
    class="review-badge upcoming"
  >
    <div class="review-left">
      <span class="review-icon">🔁</span>
      <div class="review-text">
        <span class="review-title">Повторение</span>
        <span class="review-desc">
          {{ totalInQueue }} в очереди — повторение скоро
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.review-badge {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(78, 190, 194, 0.4);
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(78, 190, 194, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;

  &:active {
    transform: scale(0.98);
    box-shadow: 0 2px 8px rgba(78, 190, 194, 0.2);
  }

  &.upcoming {
    border-color: rgba(0, 0, 0, 0.06);
    box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
    cursor: default;

    &:active {
      transform: none;
      box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
    }
  }
}

.review-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.review-icon {
  font-size: 24px;
}

.review-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.review-title {
  font-size: 14px;
  font-weight: 600;
  color: #234970;
}

.review-desc {
  font-size: 12px;
  color: #6B7280;
}

.review-count {
  min-width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  background: #4EBEC2;
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}
</style>
