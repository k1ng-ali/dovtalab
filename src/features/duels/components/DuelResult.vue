<script setup lang="ts">
import { computed } from 'vue'
import type { DuelResult } from '../types.ts'

const props = defineProps<{
  result: DuelResult
  currentUserId: number | null
}>()

const isWinner = computed(() => props.result.winner_user_id === props.currentUserId)
</script>

<template>
  <div class="result-card">
    <div class="trophy-badge">{{ isWinner ? '🏆' : '⚔️' }}</div>
    <h2 class="title">{{ isWinner ? 'Победа!' : 'Дуэль завершена' }}</h2>
    <p class="subtitle">{{ isWinner ? 'Вы оказались быстрее и точнее' : 'Хорошая игра!' }}</p>

    <div class="scores-table">
      <div
        v-for="score in result.scores"
        :key="score.user_id"
        class="score-row"
        :class="{ highlight: score.user_id === currentUserId }"
      >
        <span class="rank">#{{ score.rank }}</span>
        <span class="player-name">{{ score.user_id === currentUserId ? 'Вы' : 'Соперник' }}</span>
        <div class="stats">
          <span class="correct">✅ {{ score.correct_count }}</span>
          <span class="time">⏱ {{ (score.total_response_time_ms / 1000).toFixed(1) }} сек</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.result-card {
  max-width: 480px;
  margin: 0 auto;
  padding: 36px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 10px 32px rgba(0, 0, 0, 0.08);
}

.trophy-badge {
  font-size: 56px;
  margin-bottom: 8px;
}

.title {
  margin: 0 0 6px;
  font-size: 24px;
  color: #234970;
}

.subtitle {
  margin: 0 0 24px;
  font-size: 14px;
  color: #718096;
}

.scores-table {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.score-row {
  display: flex;
  align-items: center;
  padding: 14px 18px;
  border-radius: 16px;
  background: #f8fafc;
  font-size: 14px;

  &.highlight {
    background: rgba(78, 190, 194, 0.12);
    border: 1px solid rgba(78, 190, 194, 0.3);
    font-weight: 700;
  }
}

.rank {
  font-weight: 800;
  color: #4ebec2;
  width: 32px;
  text-align: left;
}

.player-name {
  flex: 1;
  text-align: left;
  color: #234970;
}

.stats {
  display: flex;
  gap: 12px;
  font-size: 13px;
  color: #718096;
}
</style>