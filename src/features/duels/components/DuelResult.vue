<script setup lang="ts">
import { computed } from 'vue'
import CupIcon from '@iconify-vue/solar/cup-star-bold-duotone'
import BoltIcon from '@iconify-vue/solar/bolt-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-linear'
import TimerIcon from '@iconify-vue/solar/stopwatch-linear'
import type { DuelResult } from '../types.ts'

const props = defineProps<{
  result: DuelResult
  currentUserId: number | null
}>()

const isWinner = computed(() => props.result.winner_user_id === props.currentUserId)
</script>

<template>
  <div class="result ui-card">
    <span class="result__badge" :class="{ 'result__badge--win': isWinner }">
      <CupIcon v-if="isWinner" />
      <BoltIcon v-else />
    </span>
    <h2 class="result__title">{{ isWinner ? $t('duels.victory') : $t('duels.finished') }}</h2>
    <p class="result__sub">{{ isWinner ? $t('duels.victorySub') : $t('duels.goodGame') }}</p>

    <div class="scores ui-card ui-card--list">
      <div
        v-for="score in result.scores"
        :key="score.user_id"
        class="ui-row score"
        :class="{ 'score--me': score.user_id === currentUserId }"
      >
        <span class="score__rank">{{ score.rank }}</span>
        <span class="score__name">{{ score.user_id === currentUserId ? $t('common.you') : $t('duels.opponent') }}</span>
        <span class="score__stat score__stat--correct"><CheckIcon />{{ score.correct_count }}</span>
        <span class="score__stat"><TimerIcon />{{ $t('units.sec', { n: (score.total_response_time_ms / 1000).toFixed(1) }) }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  max-width: 520px;
  margin: 0 auto;
  padding: 30px 20px 20px;
  text-align: center;

  &__badge {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    margin-bottom: 6px;
    border-radius: 26px;
    background: rgba(35, 73, 112, 0.08);
    color: var(--c-ink-2);
    font-size: 38px;

    &--win { background: var(--grad-primary); color: #FFFFFF; box-shadow: var(--shadow-hero); }
  }

  &__title { margin: 0; font-size: var(--fs-h1); font-weight: 800; color: var(--c-navy-900); }
  &__sub { margin: 0 0 14px; font-size: 14px; color: var(--c-muted); }
}

.scores { width: 100%; box-shadow: none; background: rgba(255, 255, 255, 0.7); }

.score {
  font-size: 14px;

  &--me { background: rgba(231, 245, 246, 0.8); font-weight: 700; }

  &__rank {
    width: 26px;
    height: 26px;
    flex-shrink: 0;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(35, 73, 112, 0.08);
    font-size: 13px;
    font-weight: 800;
    color: var(--c-navy-900);
  }

  &__name { flex: 1; text-align: left; color: var(--c-navy-900); }

  &__stat {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    color: var(--c-muted);

    &--correct { color: var(--c-correct); font-weight: 700; }
  }
}
</style>
