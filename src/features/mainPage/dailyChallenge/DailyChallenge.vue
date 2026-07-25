<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getDailyChallenge } from './api.ts'
import type { DailyChallengeData } from './api.ts'
import { useRouter } from 'vue-router'

const router = useRouter()
const data = ref<DailyChallengeData | null>(null)
const loading = ref(true)

onMounted(async () => {
  try {
    const resp = await getDailyChallenge()
    data.value = resp.data
  } catch {
    // silently fail
  } finally {
    loading.value = false
  }
})

const progressPercent = computed(() => {
  if (!data.value || data.value.total_questions === 0) return 0
  return Math.round((data.value.answered_count / data.value.total_questions) * 100)
})

const hasChallenge = computed(() =>
  data.value && !data.value.empty && data.value.total_questions > 0
)

const startChallenge = () => {
  router.push('/daily')
}
</script>

<template>
  <!-- Skeleton -->
  <div v-if="loading" class="dc-skeleton">
    <div class="skeleton-bar" />
  </div>

  <!-- Daily Challenge Card -->
  <div v-else-if="hasChallenge" class="daily-challenge" :class="{ completed: data!.completed }" @click="startChallenge">
    <!-- Decorative gradient strip -->
    <div class="dc-gradient-strip" />

    <div class="dc-body">
      <!-- Header -->
      <div class="dc-header">
        <div class="dc-left">
          <div class="dc-icon-wrap">
            <span class="dc-icon">{{ data!.completed ? '✅' : '🎯' }}</span>
          </div>
          <div class="dc-title-block">
            <span class="dc-title">Ежедневный вызов</span>
            <span class="dc-subtitle" v-if="!data!.completed">
              {{ data!.answered_count }} из {{ data!.total_questions }} вопросов
            </span>
            <span class="dc-subtitle done" v-else>Завершён на сегодня</span>
          </div>
        </div>

        <!-- Streak -->
        <div class="dc-streak" v-if="data!.streak > 0">
          <span class="streak-fire">🔥</span>
          <span class="streak-count">{{ data!.streak }}</span>
          <span class="streak-label">дн.</span>
        </div>
      </div>

      <!-- Progress bar -->
      <div class="dc-progress" v-if="!data!.completed">
        <div class="dc-progress-track">
          <div class="dc-progress-fill" :style="{ width: progressPercent + '%' }" />
        </div>
        <span class="dc-progress-pct">{{ progressPercent }}%</span>
      </div>

      <!-- Footer -->
      <div class="dc-footer">
        <div class="dc-stats" v-if="data!.answered_count > 0">
          <span class="dc-stat correct">✓ {{ data!.correct_count }}</span>
          <span class="dc-stat wrong" v-if="data!.answered_count - data!.correct_count > 0">
            ✗ {{ data!.answered_count - data!.correct_count }}
          </span>
        </div>
        <span class="dc-action" v-if="!data!.completed">
          {{ data!.answered_count === 0 ? 'Начать' : 'Продолжить' }}
          <span class="dc-arrow">→</span>
        </span>
        <span class="dc-action done" v-else>
          +{{ data!.correct_count * 3 }} очков
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.daily-challenge {
  position: relative;
  overflow: hidden;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 4px 24px rgba(35, 73, 112, 0.08), 0 1px 3px rgba(0,0,0,0.04);
  cursor: pointer;
  transition: all 0.25s ease;

  &:hover {
    box-shadow: 0 8px 32px rgba(35, 73, 112, 0.12), 0 2px 6px rgba(0,0,0,0.06);
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0) scale(0.99);
  }

  &.completed {
    opacity: 0.85;

    .dc-gradient-strip {
      background: linear-gradient(90deg, #10B981, #059669);
    }
  }
}

.dc-gradient-strip {
  height: 4px;
  width: 100%;
  background: linear-gradient(90deg, #4EBEC2, #234970, #7C3AED);
}

.dc-body {
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

/* ── Header ── */
.dc-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.dc-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.dc-icon-wrap {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(78, 190, 194, 0.1);
  border-radius: 14px;
}

.dc-icon {
  font-size: 22px;
}

.dc-title-block {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dc-title {
  font-size: 15px;
  font-weight: 700;
  color: #234970;
}

.dc-subtitle {
  font-size: 13px;
  color: #6B7280;

  &.done {
    color: #10B981;
    font-weight: 600;
  }
}

/* ── Streak ── */
.dc-streak {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: linear-gradient(135deg, rgba(245, 158, 11, 0.12), rgba(239, 68, 68, 0.08));
  border-radius: 14px;
}

.streak-fire {
  font-size: 16px;
}

.streak-count {
  font-size: 16px;
  font-weight: 800;
  color: #D97706;
}

.streak-label {
  font-size: 11px;
  color: #92400E;
  font-weight: 500;
}

/* ── Progress ── */
.dc-progress {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dc-progress-track {
  flex: 1;
  height: 7px;
  border-radius: 7px;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.dc-progress-fill {
  height: 100%;
  border-radius: 7px;
  background: linear-gradient(90deg, #4EBEC2, #234970);
  transition: width 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.dc-progress-pct {
  font-size: 12px;
  font-weight: 700;
  color: #234970;
  min-width: 32px;
  text-align: right;
}

/* ── Footer ── */
.dc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.dc-stats {
  display: flex;
  gap: 10px;
}

.dc-stat {
  font-size: 13px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 10px;

  &.correct {
    color: #059669;
    background: rgba(16, 185, 129, 0.1);
  }

  &.wrong {
    color: #DC2626;
    background: rgba(239, 68, 68, 0.08);
  }
}

.dc-action {
  font-size: 14px;
  font-weight: 600;
  color: #234970;

  &.done {
    color: #10B981;
  }
}

.dc-arrow {
  display: inline-block;
  margin-left: 4px;
  transition: transform 0.2s ease;

  .daily-challenge:hover & {
    transform: translateX(3px);
  }
}

/* ── Skeleton ── */
.dc-skeleton {
  .skeleton-bar {
    height: 120px;
    border-radius: 22px;
    background: rgba(0, 0, 0, 0.04);
    animation: pulse 1.4s ease infinite;
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}

/* ── Desktop fix ── */
@media (min-width: 768px) {
  .daily-challenge {
    max-width: 100%;
  }
}
</style>
