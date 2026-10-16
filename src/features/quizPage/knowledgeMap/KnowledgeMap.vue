<script setup lang="ts">
// Карта знаний: сводка по темам одной полосой, уровень и список тем по раскрытию.
import { ref, computed, onMounted } from 'vue'
import MapIcon from '@iconify-vue/solar/map-linear'
import ArrowDown from '@iconify-vue/solar/alt-arrow-down-linear'
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

// label — ключ i18n; порядок — от освоенных к не начатым
const LEVELS: MasteryLevel[] = ['strong', 'learning', 'weak', 'not_started']
const masteryConfig: Record<MasteryLevel, { label: string; color: string; bg: string }> = {
  strong:      { label: 'knowledgeMap.strong', color: 'var(--c-correct)', bg: 'var(--c-teal-tint)' },
  learning:    { label: 'knowledgeMap.learning', color: '#D9A21B', bg: 'rgba(217, 162, 27, 0.14)' },
  weak:        { label: 'knowledgeMap.weak', color: 'var(--c-wrong)', bg: 'var(--c-warning-tint)' },
  not_started: { label: 'knowledgeMap.notStarted', color: 'var(--c-empty)', bg: 'rgba(23, 46, 74, 0.06)' },
}

const hasTopics = computed(() => data.value && data.value.topics.length > 0)

const summaryParts = computed(() => {
  if (!data.value) return []
  const total = data.value.topics.length || 1
  return LEVELS
    .map(level => ({ level, n: data.value!.summary[level] ?? 0 }))
    .filter(p => p.n > 0)
    .map(p => ({ ...p, width: (p.n / total) * 100 }))
})

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
  <div v-if="loading" class="ui-skeleton km-skeleton" />

  <!-- Content -->
  <section v-else-if="hasTopics" class="km ui-card">
    <button type="button" class="km__head" :aria-expanded="expanded" @click="expanded = !expanded">
      <span class="ui-tile-icon km__icon"><MapIcon /></span>
      <span class="km__heading">
        <b class="km__title">{{ $t('knowledgeMap.title') }}</b>
        <span class="km__progress">{{ $t('knowledgeMap.mastered', { n: progressPercent }) }}</span>
      </span>
      <ArrowDown class="km__chevron" :class="{ open: expanded }" />
    </button>

    <!-- Сводка одной полосой -->
    <div class="km__bar" role="img" :aria-label="$t('knowledgeMap.mastered', { n: progressPercent })">
      <span
        v-for="p in summaryParts"
        :key="p.level"
        :style="{ width: p.width + '%', background: masteryConfig[p.level].color }"
      />
    </div>
    <div class="km__legend">
      <span v-for="p in summaryParts" :key="p.level" class="km__legend-item">
        <i :style="{ background: masteryConfig[p.level].color }" />{{ $t(masteryConfig[p.level].label) }} · {{ p.n }}
      </span>
    </div>

    <!-- Уровень навыка -->
    <div v-if="data!.skill_level" class="km__skill">
      <div class="km__skill-bar">
        <span v-for="i in 5" :key="i" :class="{ active: i <= data!.skill_level.level }" />
      </div>
      <span class="km__skill-name">{{ data!.skill_level.level_name }}</span>
      <span class="km__skill-pct">{{ $t('knowledgeMap.betterThan', { n: data!.skill_level.percentile }) }}</span>
    </div>

    <!-- Темы -->
    <Transition name="collapse">
      <div v-if="expanded" class="km__topics">
        <div v-for="topic in data!.topics" :key="topic.cluster_id" class="topic">
          <div class="topic__top">
            <i class="topic__dot" :style="{ background: masteryConfig[topic.mastery_level].color }" />
            <div class="topic__info">
              <span class="topic__name">{{ topic.name }}</span>
              <span class="topic__desc" v-if="topic.description">{{ topic.description }}</span>
            </div>
            <button
              v-if="userStore.is_pro"
              type="button"
              class="ui-btn ui-btn--secondary ui-btn--sm"
              @click.stop="emit('train-topic', topic.cluster_id)"
            >
              {{ $t('knowledgeMap.train') }}
            </button>
            <ProBadge v-else @click="emit('open-subscription')" />
          </div>

          <div class="topic__bar" v-if="topic.answers_count > 0">
            <span
              class="topic__bar-coverage"
              :style="{ width: Math.round((topic.answers_count / topic.total_questions) * 100) + '%' }"
            />
            <span
              class="topic__bar-accuracy"
              :style="{
                width: Math.round((topic.answers_count / topic.total_questions) * topic.accuracy * 100) + '%',
                background: masteryConfig[topic.mastery_level].color
              }"
            />
          </div>

          <div class="topic__meta">
            <span
              class="ui-chip"
              :style="{ background: masteryConfig[topic.mastery_level].bg, color: 'var(--c-ink-2)' }"
            >
              {{ $t(masteryConfig[topic.mastery_level].label) }}
            </span>
            <span v-if="topic.answers_count > 0">{{ $t('knowledgeMap.accuracy', { n: Math.round(topic.accuracy * 100) }) }}</span>
            <span>{{ $t('knowledgeMap.answered', { a: topic.answers_count, b: topic.total_questions }) }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </section>
</template>

<style scoped lang="scss">
.km-skeleton { height: 120px; }

.km {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 14px 16px 16px;

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 0;
    border: none;
    background: none;
    font-family: inherit;
    text-align: left;
    cursor: pointer;
  }

  &__icon { width: 40px; height: 40px; border-radius: 12px; font-size: 20px; }
  &__heading { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  &__title { font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
  &__progress { font-size: 12px; color: var(--c-muted); }

  &__chevron {
    font-size: 20px;
    color: var(--c-muted);
    transition: transform 0.25s ease;
    &.open { transform: rotate(180deg); }
  }

  &__bar {
    display: flex;
    gap: 3px;
    height: 10px;

    span { border-radius: 5px; min-width: 6px; }
  }

  &__legend {
    display: flex;
    flex-wrap: wrap;
    gap: 6px 14px;
    font-size: 12px;
    color: var(--c-muted);
  }

  &__legend-item {
    display: inline-flex;
    align-items: center;
    gap: 6px;

    i { width: 8px; height: 8px; border-radius: 50%; }
  }

  &__skill {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px 10px;
    padding-top: 12px;
    border-top: 1px solid var(--c-line);
  }

  &__skill-bar {
    display: flex;
    gap: 3px;

    span {
      width: 16px;
      height: 6px;
      border-radius: 3px;
      background: rgba(23, 46, 74, 0.1);
      &.active { background: var(--c-teal-600); }
    }
  }

  &__skill-name { font-size: 13px; font-weight: 700; color: var(--c-navy-900); }
  &__skill-pct { font-size: 12px; color: var(--c-muted); margin-left: auto; }

  &__topics {
    display: flex;
    flex-direction: column;
    border-top: 1px solid var(--c-line);
  }
}

.topic {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0;
  border-bottom: 1px solid var(--c-line);

  &:last-child { border-bottom: none; padding-bottom: 0; }

  &__top { display: flex; align-items: center; gap: 10px; }
  &__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
  &__info { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  &__name { font-size: 14px; font-weight: 700; color: var(--c-navy-900); }
  &__desc { font-size: 12px; color: var(--c-muted); line-height: 1.35; }

  &__bar {
    position: relative;
    height: 6px;
    border-radius: 3px;
    background: rgba(23, 46, 74, 0.08);
    overflow: hidden;
  }

  &__bar-coverage, &__bar-accuracy {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    border-radius: 3px;
  }

  &__bar-coverage { background: rgba(23, 46, 74, 0.12); }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px 12px;
    font-size: 12px;
    color: var(--c-muted);
  }
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
  max-height: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  opacity: 1;
  max-height: 3000px;
}
</style>
