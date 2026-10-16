<script setup lang="ts">
import { ref, onMounted } from 'vue'
import RepeatIcon from '@iconify-vue/solar/restart-linear'
import ArrowRight from '@iconify-vue/solar/alt-arrow-right-linear'
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
  <button
    v-if="!loading && pending > 0"
    type="button"
    class="review ui-card"
    @click="emit('start-review')"
  >
    <span class="ui-tile-icon review__icon"><RepeatIcon /></span>
    <span class="review__text">
      <b class="review__title">{{ $t('review.title') }}</b>
      <span class="review__desc">{{ $t('review.pending', pending) }}</span>
    </span>
    <span class="review__count">{{ pending }}</span>
    <ArrowRight class="review__arrow" />
  </button>

  <!-- Очередь есть, но повторять пока нечего -->
  <div
    v-else-if="!loading && totalInQueue > 0 && pending === 0"
    class="review review--upcoming ui-card"
  >
    <span class="ui-tile-icon review__icon"><RepeatIcon /></span>
    <span class="review__text">
      <b class="review__title">{{ $t('review.title') }}</b>
      <span class="review__desc">{{ $t('review.queued', { n: totalInQueue }) }}</span>
    </span>
  </div>
</template>

<style scoped lang="scss">
.review {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 16px;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: transform 0.18s ease;

  &:active { transform: scale(0.99); }

  &--upcoming {
    cursor: default;
    &:active { transform: none; }
    .review__icon { background: rgba(35, 73, 112, 0.08); color: var(--c-ink-2); }
  }

  &__icon { width: 40px; height: 40px; border-radius: 12px; font-size: 20px; }
  &__text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  &__title { font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
  &__desc { font-size: 12px; color: var(--c-muted); }

  &__count {
    min-width: 26px;
    height: 26px;
    padding: 0 8px;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: var(--r-pill);
    background: var(--grad-primary);
    color: #FFFFFF;
    font-size: 13px;
    font-weight: 800;
  }

  &__arrow { font-size: 18px; color: var(--c-muted); }
}
</style>
