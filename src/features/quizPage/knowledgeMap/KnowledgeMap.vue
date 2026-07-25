<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { getKnowledgeMap } from './api.ts'
import type { KnowledgeMapResponse, MasteryLevel } from './types.ts'
import { useUserStore } from '@/features/user/store.ts'
import ProBadge from '@/features/subscription/ProBadge.vue'

const props = defineProps<{
  quizId: number
}>()

const emit = defineEmits<{
  (e: 'train-topic', clusterId: number): void
  (e: 'open-subscription'): void
}>()

const data = ref<KnowledgeMapResponse | null>(null)
const loading = ref(false)
const error = ref(false)
const expanded = ref(false)
const userStore = useUserStore()

onMounted(async () => {
  loading.value = true
  try {
    const resp = await getKnowledgeMap(props.quizId)
    data.value = resp.data
  } catch {
    error.value = true
  } finally {
    loading.value = false
  }
})

const masteryConfig: Record<MasteryLevel, { label: string; emoji: string; color: string; bg: string }> = {
  not_started: { label: 'Не начато', emoji: '⚪', color: '#9CA3AF', bg: 'rgba(156,163,175,0.08)' },
  weak:        { label: 'Нужна практика', emoji: '🔴', color: '#EF4444', bg: 'rgba(239,68,68,0.08)' },
  learning:    { label: 'В процессе', emoji: '🟡', color: '#F59E0B', bg: 'rgba(245,158,11,0.08)' },
  strong:      { label: 'Освоено', emoji: '🟢', color: '#10B981', bg: 'rgba(16,185,129,0.08)' },
}

const hasTopics = computed(() => data.value && data.value.topics.length > 0)

const progressPercent = computed(() => {
  if (!data.value || !data.value.topics.length) return 0
  const topics = data.value.topics
  const totalQuestions = topics.reduce((sum, t) => sum + t.total_questions, 0)
  if (totalQuestions === 0) return 0

  const weightedSum = topics.reduce((sum, t) => {
    return sum + (t.answers_count / t.total_questions) * t.accuracy
  }, 0)

  return Math.round((weightedSum / topics.length) * 100)
})
</script>

<template>
  <!-- Skeleton -->
  <div v-if="loading" class="km-skeleton">
    <div class="skeleton-bar" />
  </div>

  <!-- Content -->
  <div v-else-if="hasTopics" class="knowledge-map">
    <!-- Summary card (always visible) -->
    <div class="km-header" :class="{ 'pro-glow': userStore.is_pro }" @click="expanded = !expanded">
      <div class="km-header-top">
        <span class="km-title">🗺️ Карта знаний</span>
        <span class="km-progress">{{ progressPercent }}% освоено</span>
      </div>

      <div class="km-summary-pills">
        <span class="km-pill" v-if="data!.summary.strong > 0">
          🟢 {{ data!.summary.strong }}
        </span>
        <span class="km-pill" v-if="data!.summary.learning > 0">
          🟡 {{ data!.summary.learning }}
        </span>
        <span class="km-pill" v-if="data!.summary.weak > 0">
          🔴 {{ data!.summary.weak }}
        </span>
        <span class="km-pill" v-if="data!.summary.not_started > 0">
          ⚪ {{ data!.summary.not_started }}
        </span>
      </div>

      <!-- Skill Level -->
      <div v-if="data!.skill_level" class="km-skill">
        <div class="skill-bar">
          <div
            v-for="i in 5"
            :key="i"
            class="skill-segment"
            :class="{ active: i <= data!.skill_level.level }"
          />
        </div>
        <div class="skill-info">
          <span class="skill-name">{{ data!.skill_level.level_name }}</span>
          <span class="skill-percentile">Лучше {{ data!.skill_level.percentile }}% пользователей</span>
        </div>
      </div>

      <!-- Expand button -->
      <button class="km-expand-btn" :class="{ expanded }">
        <span class="km-expand-icon">▾</span>
        <span class="km-expand-label">{{ expanded ? 'Скрыть темы' : 'Показать темы' }}</span>
      </button>
    </div>

    <!-- Topic cards (collapsible) -->
    <Transition name="collapse">
      <div v-if="expanded" class="km-topics">
        <div
          v-for="topic in data!.topics"
          :key="topic.cluster_id"
          class="km-topic-card"
          :style="{ borderLeftColor: masteryConfig[topic.mastery_level].color }"
        >
          <div class="topic-top">
            <span class="topic-emoji">{{ masteryConfig[topic.mastery_level].emoji }}</span>
            <div class="topic-info">
              <span class="topic-name">{{ topic.name }}</span>
              <span class="topic-desc" v-if="topic.description">{{ topic.description }}</span>
            </div>
            <button
              v-if="userStore.is_pro"
              class="train-btn"
              @click.stop="emit('train-topic', topic.cluster_id)"
            >
              Тренировать
            </button>
            <ProBadge v-else @click="emit('open-subscription')" />
          </div>

          <div class="topic-bottom">
            <div class="topic-stats">
              <span class="topic-accuracy" v-if="topic.answers_count > 0">
                {{ Math.round(topic.accuracy * 100) }}% точность
              </span>
              <span class="topic-count">
                {{ topic.answers_count }} / {{ topic.total_questions }} вопр.
              </span>
            </div>

            <!-- Progress double-bar: coverage + accuracy -->
            <div class="topic-bar" v-if="topic.answers_count > 0">
              <div
                class="topic-bar-coverage"
                :style="{ width: Math.round((topic.answers_count / topic.total_questions) * 100) + '%' }"
              />
              <div
                class="topic-bar-accuracy"
                :style="{
                  width: Math.round((topic.answers_count / topic.total_questions) * topic.accuracy * 100) + '%',
                  background: masteryConfig[topic.mastery_level].color
                }"
              />
            </div>

            <span
              class="topic-badge"
              :style="{ background: masteryConfig[topic.mastery_level].bg, color: masteryConfig[topic.mastery_level].color }"
            >
              {{ masteryConfig[topic.mastery_level].label }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.knowledge-map {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ── Header ── */
.km-header {
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: box-shadow 0.2s ease;

  &:active {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  &.pro-glow {
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.12);
    border-color: rgba(124, 58, 237, 0.15);
  }
}

.km-header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.km-title {
  font-size: 16px;
  font-weight: 700;
  color: #234970;
}

.km-progress {
  font-size: 13px;
  font-weight: 600;
  color: #10B981;
}

.km-summary-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}

.km-pill {
  font-size: 13px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.04);
  border-radius: 20px;
  font-weight: 500;
  color: #4B5563;
}

/* ── Skill Level ── */
.km-skill {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px solid rgba(0, 0, 0, 0.05);
  margin-bottom: 2px;
}

.skill-bar {
  display: flex;
  gap: 4px;
  height: 6px;
}

.skill-segment {
  flex: 1;
  border-radius: 3px;
  background: rgba(0, 0, 0, 0.08);
  transition: background 0.3s ease;

  &.active {
    background: linear-gradient(90deg, #4EBEC2, #234970);
  }
}

.skill-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.skill-name {
  font-size: 14px;
  font-weight: 600;
  color: #234970;
}

.skill-percentile {
  font-size: 12px;
  color: #6B7280;
}

/* ── Expand button ── */
.km-expand-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 0;
  border: none;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  background: transparent;
  cursor: pointer;
  font-family: inherit;
}

.km-expand-icon {
  font-size: 14px;
  color: #6B7280;
  transition: transform 0.3s ease;

  .expanded & {
    transform: rotate(180deg);
  }
}

.km-expand-label {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
}

/* ── Topic cards ── */
.km-topics {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.km-topic-card {
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-left: 4px solid;
  border-radius: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.topic-top {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.topic-emoji {
  font-size: 18px;
  flex-shrink: 0;
  margin-top: 1px;
}

.topic-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.topic-name {
  font-size: 14px;
  font-weight: 600;
  color: #234970;
  word-wrap: break-word;
  overflow-wrap: break-word;
}

.topic-desc {
  font-size: 12px;
  color: #6B7280;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.train-btn {
  flex-shrink: 0;
  align-self: flex-start;
  padding: 5px 12px;
  border: 1.5px solid rgba(35, 73, 112, 0.15);
  border-radius: 12px;
  font-size: 12px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  background: rgba(35, 73, 112, 0.05);
  color: #234970;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:active {
    transform: scale(0.95);
    background: rgba(35, 73, 112, 0.12);
  }
}

/* ── Bottom ── */
.topic-bottom {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-left: 28px;
}

.topic-stats {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #9CA3AF;
}

.topic-accuracy {
  font-weight: 600;
  color: #4B5563;
}

.topic-count {
  font-weight: 500;
}

.topic-bar {
  position: relative;
  height: 6px;
  width: 100%;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.topic-bar-coverage {
  position: absolute;
  height: 100%;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.10);
  transition: width 0.4s ease;
}

.topic-bar-accuracy {
  position: absolute;
  height: 100%;
  border-radius: 6px;
  transition: width 0.4s ease;
}

.topic-badge {
  align-self: flex-start;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 12px;
}

/* ── Collapse transition ── */
.collapse-enter-active,
.collapse-leave-active {
  transition: all 0.3s ease;
  overflow: hidden;
}

.collapse-enter-from,
.collapse-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  transform: translateY(0);
}

/* ── Skeleton ── */
.km-skeleton {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.skeleton-bar {
  height: 100px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.06);
  animation: pulse 1.4s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%      { opacity: 0.5; }
}
</style>
