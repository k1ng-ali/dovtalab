<script setup lang="ts">
import { useStats } from "@/features/mainPage/statistic/store.ts"
import { computed, onMounted } from "vue"
import { timeFormat } from "@/shared/utils.ts"
import { useRouter } from "vue-router"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const router = useRouter()
const statStore = useStats()
const userStats = computed(() => statStore.stats)
const attemptHistory = computed(() => statStore.attempts)

const isEmpty = computed(() => !userStats.value || userStats.value.total_quizzes_completed === 0)

// SVG ring progress
const ringRadius = 54
const ringCircumference = 2 * Math.PI * ringRadius
const ringOffset = computed(() => {
  const pct = userStats.value?.accuracy_percent ?? 0
  return ringCircumference - (pct / 100) * ringCircumference
})

// Accuracy color
const accuracyColor = computed(() => {
  const pct = userStats.value?.accuracy_percent ?? 0
  if (pct >= 75) return '#22c55e'
  if (pct >= 50) return '#f59e0b'
  return '#ef4444'
})

// Weekly activity chart — two lines: correct (green) + incorrect (red)
const correctData = computed(() => userStats.value?.weekly_activity?.correct ?? [0, 0, 0, 0, 0, 0, 0])
const incorrectData = computed(() => userStats.value?.weekly_activity?.incorrect ?? [0, 0, 0, 0, 0, 0, 0])

const maxWeekly = computed(() => {
  const allValues = [...correctData.value, ...incorrectData.value]
  return Math.max(...allValues, 1)
})

const weekDayLabels = computed(() => {
  const dayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const
  const labels: string[] = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dow = d.getDay()
    const idx = dow === 0 ? 6 : dow - 1
    labels.push(t(`stats.weekDays.${dayKeys[idx]}`))
  }
  return labels
})

// Chart coordinate helpers
const xStart = 30
const xEnd = 250
const yTop = 20
const yBottom = 90

const toPoints = (data: number[]) => {
  const max = maxWeekly.value
  return data.map((val, i) => ({
    x: xStart + (i / 6) * (xEnd - xStart),
    y: yBottom - (val / max) * (yBottom - yTop),
    value: val,
  }))
}

// Smooth cubic bezier path from points (clamped to chart bounds)
const smoothPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return ''
  let d = `M ${points[0]!.x},${points[0]!.y}`
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(i - 1, 0)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(i + 2, points.length - 1)]!

    const tension = 0.25
    const cp1x = p1.x + (p2.x - p0.x) * tension
    const cp1y = Math.min(Math.max(p1.y + (p2.y - p0.y) * tension, yTop), yBottom)
    const cp2x = p2.x - (p3.x - p1.x) * tension
    const cp2y = Math.min(Math.max(p2.y - (p3.y - p1.y) * tension, yTop), yBottom)

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`
  }
  return d
}

// Smooth area path (line + close at bottom)
const smoothAreaPath = (points: { x: number; y: number }[]): string => {
  if (points.length < 2) return ''
  const linePath = smoothPath(points)
  const last = points[points.length - 1]!
  const first = points[0]!
  return `${linePath} L ${last.x},${yBottom} L ${first.x},${yBottom} Z`
}

const correctPoints = computed(() => toPoints(correctData.value))
const incorrectPoints = computed(() => toPoints(incorrectData.value))

const correctLinePath = computed(() => smoothPath(correctPoints.value))
const incorrectLinePath = computed(() => smoothPath(incorrectPoints.value))
const correctAreaPath = computed(() => smoothAreaPath(correctPoints.value))
const incorrectAreaPath = computed(() => smoothAreaPath(incorrectPoints.value))

// X positions for day labels
const dayLabelX = computed(() =>
    Array.from({ length: 7 }, (_, i) => xStart + (i / 6) * (xEnd - xStart))
)

// Score color for attempts
const scoreColor = (score?: number) => {
  if (!score && score !== 0) return '#9CA3AF'
  if (score >= 75) return '#22c55e'
  if (score >= 50) return '#f59e0b'
  return '#ef4444'
}

onMounted(async () => {
  try {
    await statStore.fetchStats()
    await statStore.fetchAttemptsHistory(0, 5)
  } catch (error) {
    console.error(error)
  }
})

const goToQuiz = () => router.push('/quiz')
</script>

<template>
  <div class="statistics">
    <div class="section-header">
      <h2 class="section-title">{{ t('stats.title') }}</h2>
    </div>

    <!-- ════════════════ EMPTY STATE ════════════════ -->
    <div v-if="isEmpty" class="empty-state">
      <div class="empty-illustration">
        <svg width="120" height="120" viewBox="0 0 120 120" fill="none">
          <circle cx="60" cy="60" r="54" stroke="#E5E7EB" stroke-width="6" stroke-dasharray="8 6" />
          <path d="M42 65 L54 77 L78 53" stroke="#4EBEC2" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity="0.4" />
          <circle cx="60" cy="60" r="12" fill="#4EBEC2" opacity="0.1" />
        </svg>
      </div>
      <h3 class="empty-title">{{ t('stats.emptyTitle') }}</h3>
      <p class="empty-desc">
        {{ t('stats.emptyDesc') }}
      </p>
      <button class="empty-cta" @click="goToQuiz">
        {{ t('stats.startFirst') }}
      </button>
    </div>

    <!-- ════════════════ STATS CONTENT ════════════════ -->
    <template v-else>

      <!-- ── Accuracy Ring + Key Stats ── -->
      <div class="hero-stats">
        <div class="ring-wrap">
          <svg class="ring-svg" viewBox="0 0 120 120">
            <circle
                cx="60" cy="60" :r="ringRadius"
                fill="none" stroke="#E5E7EB" stroke-width="8"
            />
            <circle
                cx="60" cy="60" :r="ringRadius"
                fill="none" :stroke="accuracyColor" stroke-width="8"
                stroke-linecap="round"
                :stroke-dasharray="ringCircumference"
                :stroke-dashoffset="ringOffset"
                class="ring-progress"
            />
          </svg>
          <div class="ring-label">
            <span class="ring-value">{{ userStats?.accuracy_percent ?? 0 }}%</span>
            <span class="ring-sub">{{ t('stats.accuracy') }}</span>
          </div>
        </div>

        <div class="key-stats">
          <div class="key-stat">
            <span class="key-icon">🔥</span>
            <span class="key-number">{{ userStats?.streak_days ?? 0 }}</span>
            <span class="key-label">{{ t('stats.streakDay') }}</span>
          </div>
          <div class="key-stat">
            <span class="key-icon">⭐</span>
            <span class="key-number">{{ userStats?.total_points ?? 0 }}</span>
            <span class="key-label">{{ t('common.points') }}</span>
          </div>
          <div class="key-stat">
            <span class="key-icon">📝</span>
            <span class="key-number">{{ userStats?.total_quizzes_completed ?? 0 }}</span>
            <span class="key-label">{{ t('stats.testsCompleted') }}</span>
          </div>
        </div>
      </div>

      <!-- ── Weekly Activity Chart (Two-line Diagram) ── -->
      <div class="weekly-section">
        <h4 class="sub-title">{{ t('stats.weeklyActivity') }}</h4>

        <!-- Legend -->
        <div class="chart-legend">
          <span class="legend-item"><span class="legend-dot correct"></span> {{ t('stats.correct') }}</span>
          <span class="legend-item"><span class="legend-dot incorrect"></span> {{ t('stats.incorrect') }}</span>
        </div>

        <div class="weekly-chart">
          <svg class="line-chart" viewBox="0 0 280 120">
            <!-- Gradient definitions -->
            <defs>
              <linearGradient id="correctGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#22c55e" stop-opacity="0.25" />
                <stop offset="100%" stop-color="#22c55e" stop-opacity="0.02" />
              </linearGradient>
              <linearGradient id="incorrectGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#ef4444" stop-opacity="0.2" />
                <stop offset="100%" stop-color="#ef4444" stop-opacity="0.02" />
              </linearGradient>
            </defs>

            <!-- Grid lines -->
            <line x1="20" y1="30" x2="260" y2="30" class="grid-line" />
            <line x1="20" y1="55" x2="260" y2="55" class="grid-line" />
            <line x1="20" y1="80" x2="260" y2="80" class="grid-line" />

            <!-- Correct area (gradient fill) + smooth line -->
            <path :d="correctAreaPath" fill="url(#correctGradient)" />
            <path :d="correctLinePath" class="chart-line chart-line--correct" />

            <!-- Incorrect area (gradient fill) + smooth line -->
            <path :d="incorrectAreaPath" fill="url(#incorrectGradient)" />
            <path :d="incorrectLinePath" class="chart-line chart-line--incorrect" />

            <!-- Correct dots -->
            <circle
                v-for="(point, i) in correctPoints"
                :key="'c'+i"
                :cx="point.x"
                :cy="point.y"
                :r="point.value > 0 ? 3 : 1.5"
                :class="point.value > 0 ? 'chart-dot chart-dot--correct active' : 'chart-dot'"
            />

            <!-- Incorrect dots -->
            <circle
                v-for="(point, i) in incorrectPoints"
                :key="'ic'+i"
                :cx="point.x"
                :cy="point.y"
                :r="point.value > 0 ? 3 : 1.5"
                :class="point.value > 0 ? 'chart-dot chart-dot--incorrect active' : 'chart-dot'"
            />

            <!-- Day labels -->
            <text
                v-for="(label, i) in weekDayLabels"
                :key="'l'+i"
                :x="dayLabelX[i]"
                y="110"
                class="chart-day-label"
            >
              {{ label }}
            </text>
          </svg>
        </div>
      </div>

      <!-- ── Stats Grid ── -->
      <div class="stats-grid">
        <div class="stat-card">
          <span class="stat-icon">💠</span>
          <span class="stat-value">{{ userStats?.total_questions_answered ?? 0 }}</span>
          <span class="stat-label">{{ t('stats.answers') }}</span>
        </div>
        <div class="stat-card">
          <span class="stat-icon">✅</span>
          <span class="stat-value">{{ userStats?.correct_answers ?? 0 }}</span>
          <span class="stat-label">{{ t('stats.correctAnswers') }}</span>
        </div>
      </div>

      <!-- ── Attempt History ── -->
      <div class="history-section" v-if="attemptHistory && attemptHistory.length > 0">
        <h4 class="sub-title">{{ t('stats.lastAttempts') }}</h4>
        <div class="history-list">
          <div
              v-for="attempt in attemptHistory.filter(a => a.correct_count != null)"
              :key="attempt.quiz_attempt_id"
              class="history-item"
          >
            <div class="history-top">
              <h5 class="history-title">{{ attempt.quiz_title }}</h5>
              <span
                  class="history-score"
                  :style="{ color: scoreColor(attempt.questions_count ? Math.round((attempt.correct_count ?? 0) / attempt.questions_count * 100) : attempt.score) }"
              >
                {{ attempt.questions_count ? Math.round((attempt.correct_count ?? 0) / attempt.questions_count * 100) : (attempt.score ?? 0) }}%
              </span>
            </div>
            <div class="history-bar-track">
              <!-- Серый: отвечено / всего -->
              <div
                  class="history-bar-answered"
                  :style="{
                    width: attempt.questions_count ? ((attempt.total_count ?? 0) / attempt.questions_count * 100) + '%' : '100%'
                  }"
              />
              <!-- Цветной: правильно / всего -->
              <div
                  class="history-bar-fill"
                  :style="{
                    width: attempt.questions_count ? ((attempt.correct_count ?? 0) / attempt.questions_count * 100) + '%' : (attempt.score ?? 0) + '%',
                    background: scoreColor(attempt.questions_count ? Math.round((attempt.correct_count ?? 0) / attempt.questions_count * 100) : attempt.score)
                  }"
              />
            </div>
            <div class="history-meta">
              <span v-if="attempt.correct_count != null && attempt.questions_count">
                ✅ {{ attempt.correct_count }}/{{ attempt.questions_count }}
              </span>
              <span v-if="attempt.duration_sec">
                ⏱ {{ timeFormat(attempt.duration_sec) }}
              </span>
            </div>
          </div>
        </div>
      </div>

    </template>
  </div>
</template>

<style scoped lang="scss">
.statistics {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  color: #234970;
}

/* ════════════════ EMPTY STATE ════════════════ */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 32px 20px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
  gap: 12px;
}

.empty-illustration {
  margin-bottom: 8px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.empty-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #234970;
}

.empty-desc {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
  line-height: 1.5;
  max-width: 260px;
}

.empty-cta {
  margin-top: 8px;
  padding: 12px 24px;
  background: linear-gradient(135deg, #4EBEC2, #234970);
  color: #fff;
  border: none;
  border-radius: 24px;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(78, 190, 194, 0.3);
  transition: transform 0.2s;

  &:active { transform: scale(0.96); }
}

/* ════════════════ HERO STATS (Ring + Key) ════════════════ */
.hero-stats {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.ring-wrap {
  position: relative;
  width: 110px;
  height: 110px;
  flex-shrink: 0;
}

.ring-svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.ring-progress {
  transition: stroke-dashoffset 1s cubic-bezier(0.4, 0, 0.2, 1);
}

.ring-label {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.ring-value {
  font-size: 22px;
  font-weight: 800;
  color: #234970;
  line-height: 1;
}

.ring-sub {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
  margin-top: 2px;
}

.key-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
}

.key-stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.key-icon {
  font-size: 18px;
  width: 24px;
  text-align: center;
}

.key-number {
  font-size: 18px;
  font-weight: 700;
  color: #234970;
  min-width: 28px;
}

.key-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

/* ════════════════ WEEKLY ACTIVITY (Two-line Chart) ════════════════ */
.weekly-section {
  padding: 18px 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
}

.sub-title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: #234970;
}

.chart-legend {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;

  &.correct { background: #22c55e; }
  &.incorrect { background: #ef4444; }
}

.weekly-chart {
  display: flex;
  flex-direction: column;
}

.line-chart {
  width: 100%;
  height: auto;
  aspect-ratio: 280 / 120;
}

.grid-line {
  stroke: rgba(0, 0, 0, 0.06);
  stroke-width: 0.5;
  stroke-dasharray: 4 3;
}

.chart-line {
  fill: none;
  stroke-width: 1.8;
  stroke-linecap: round;
  stroke-linejoin: round;

  &--correct { stroke: #22c55e; }
  &--incorrect { stroke: #ef4444; }
}

.chart-dot {
  fill: #E5E7EB;
  stroke: white;
  stroke-width: 1;
  transition: all 0.3s ease;

  &.active {
    stroke: white;
    stroke-width: 1.5;
  }

  &--correct.active {
    fill: #22c55e;
  }

  &--incorrect.active {
    fill: #ef4444;
  }
}

.chart-day-label {
  font-size: 10px;
  fill: #9CA3AF;
  font-weight: 500;
  text-anchor: middle;
}

/* ════════════════ STATS GRID ════════════════ */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 16px 12px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  font-size: 22px;
}

.stat-value {
  font-size: 22px;
  font-weight: 800;
  color: #234970;
}

.stat-label {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 500;
}

/* ════════════════ HISTORY ════════════════ */
.history-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.history-title {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #234970;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-score {
  font-size: 15px;
  font-weight: 700;
  flex-shrink: 0;
  margin-left: 8px;
}

.history-bar-track {
  position: relative;
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.history-bar-answered {
  position: absolute;
  height: 100%;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.10);
  transition: width 0.5s ease;
}

.history-bar-fill {
  position: absolute;
  height: 100%;
  border-radius: 6px;
  transition: width 0.5s ease;
}

.history-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 500;
}
</style>
