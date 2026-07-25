<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { QuizIn, ContextIn, QuizMode } from '@/features/quizPage/types.ts'
import { useQuiz } from '@/features/quizPage/store.ts'
import { MdRoundFavoriteBorder, MdRoundFavorite } from '@kalimahapps/vue-icons';
import {useHeaderStore} from "@/shared/stores/useHeaderStore.ts";
import KnowledgeMap from '@/features/quizPage/knowledgeMap/KnowledgeMap.vue'
import ReviewBadge from '@/features/quizPage/review/ReviewBadge.vue'
import ProBadge from '@/features/subscription/ProBadge.vue'
import SubscriptionModal from '@/features/subscription/SubscriptionModal.vue'
import { useUserStore } from '@/features/user/store.ts'

const props = defineProps<{
  quiz: QuizIn
  selectedContext: ContextIn | null
  selectedMode: QuizMode
  examQuestionLimit: number
}>()

const emit = defineEmits<{
  (e: 'select-context', ctx: ContextIn | null): void
  (e: 'select-mode', mode: QuizMode): void
  (e: 'set-exam-limit', limit: number): void
  (e: 'train-cluster', clusterId: number): void
  (e: 'start-review'): void
}>()

const quizStore = useQuiz()
const userStore = useUserStore()
const contexts  = ref<ContextIn[]>([])
const loading   = ref(false)
const adaptiveAvailable = ref(false)
const showSubModal = ref(false)
const copied = ref(false)
const Stats = computed(() => quizStore.quizStat(props.quiz.id))
const headerStore = useHeaderStore()

const copyHashCode = async () => {
  try {
    await navigator.clipboard.writeText(props.quiz.hash_code)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    // Fallback для мобильных браузеров
    const el = document.createElement('textarea')
    el.value = props.quiz.hash_code
    document.body.appendChild(el)
    el.select()
    document.execCommand('copy')
    document.body.removeChild(el)
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  }
}

onMounted(async () => {
  await quizStore.fetchQuizStat(props.quiz.id)
  headerStore.reset()
  headerStore.setTitle(props.quiz.title)

  // Проверяем доступность адаптивного обучения
  try {
    const result = await quizStore.checkAdaptiveAvailable(props.quiz.id)
    adaptiveAvailable.value = result.available
  } catch {
    adaptiveAvailable.value = false
  }

  if (props.quiz.contexts?.length) {
    contexts.value = props.quiz.contexts
    return
  }
  loading.value = true
  try {
    contexts.value = await quizStore.fetchContexts(props.quiz.id)
  } finally {
    loading.value = false
  }
})

const totalTimeSpent = computed(() => {
  if (!Stats.value) return null
  let total = 0
  if (Stats.value.current_attempt_stat?.duration_sec) {
    total += Stats.value.current_attempt_stat.duration_sec
  }
  if (Stats.value.completed_attempt_stats?.length) {
    for (const a of Stats.value.completed_attempt_stats) {
      if (a.duration_sec) total += a.duration_sec
    }
  }
  if (total === 0) return null

  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)

  if (h > 0) return `${h} ч ${m} мин`
  if (m > 0) return `${m} мин`
  return `${Math.floor(total)} сек`
})

const addToFavorite = async (id: number) => {
  await quizStore.addFavorite(id)
  props.quiz.on_fav = true
}

const deleteFavorite = async (id: number) => {
  await quizStore.deleteFavorite(id)
  props.quiz.on_fav = false
}

const toggleContext = (ctx: ContextIn) => {
  if (props.selectedContext?.id === ctx.id) {
    emit('select-context', null)
  } else {
    emit('select-context', ctx)
  }
}

// Варианты количества вопросов для быстрого теста
const quickTestOptions = computed(() => {
  const total = Stats.value?.total_questions ?? 0
  const options = [15, 20, 25, 30].filter(n => n <= total)
  // Добавляем "все" если total не входит в стандартные
  if (total > 0 && !options.includes(total) && total > 30) {
    options.push(total)
  }
  return options
})
</script>

<template>
  <div class="quiz-info">

    <!-- ── Шапка ── -->
    <div class="hero">
      <!-- Хеш-код для копирования -->
      <div class="hash-code" @click="copyHashCode">
        <span class="hash-label">📋</span>
        <span class="hash-value">{{ quiz.hash_code }}</span>
        <span class="hash-copied" :class="{ visible: copied }">Скопировано!</span>
      </div>

      <MdRoundFavorite
          v-if="quiz.on_fav"
          class="fav-ico active"
          @click="deleteFavorite(quiz.id)"
      />
      <MdRoundFavoriteBorder
          v-if="!quiz.on_fav"
          class="fav-ico"
          @click="addToFavorite(quiz.id)"
      />
      <div class="hero-icon">📘</div>
      <h2 class="hero-title">{{ quiz.title }}</h2>
      <p class="hero-desc">{{ quiz.description }}</p>

      <!-- Мини-статистика -->
      <div class="hero-stats" v-if="Stats?.total_questions">
        <span class="hero-stat">📝 {{ Stats.total_questions }} вопросов</span>
        <span class="hero-stat" v-if="Stats?.completed_attempt_stats?.length">
          🏆 Пройдено {{ Stats.completed_attempt_stats.length }}×
        </span>
        <span class="hero-stat" v-if="totalTimeSpent">
          ⏱ {{ totalTimeSpent }}
        </span>
      </div>
    </div>


    <!-- ── Адаптивное обучение ── -->
    <div class="mode-section" v-if="adaptiveAvailable">
      <div
          class="adaptive-card"
          :class="{ active: props.selectedMode === 'adaptive', locked: !userStore.is_pro, 'pro-glow': userStore.is_pro }"
          @click="userStore.is_pro ? emit('select-mode', props.selectedMode === 'adaptive' ? 'practice' : 'adaptive') : (showSubModal = true)"
      >
        <div class="adaptive-header">
          <div class="adaptive-left">
            <span class="adaptive-icon">🧠</span>
            <div class="adaptive-text">
              <span class="adaptive-title">
                Адаптивное обучение
              </span>
              <span class="adaptive-desc">Вопросы подбираются по вашим слабым местам</span>
            </div>
          </div>
          <div v-if="userStore.is_pro" class="quick-test-toggle" :class="{ on: props.selectedMode === 'adaptive' }">
            <div class="toggle-thumb" />
          </div>
          <ProBadge v-else @click="showSubModal = true" />
        </div>
      </div>
    </div>

    <!-- ── Быстрый тест ── -->
    <div class="mode-section" v-if="Stats?.total_questions && Stats.total_questions >= 15">
      <div
          class="quick-test-card"
          :class="{ active: props.selectedMode === 'exam', disabled: props.selectedMode === 'adaptive' }"
          @click="props.selectedMode !== 'adaptive' && emit('select-mode', props.selectedMode === 'exam' ? 'practice' : 'exam')"
      >
        <div class="quick-test-header">
          <div class="quick-test-left">
            <span class="quick-test-icon">🚀</span>
            <div class="quick-test-text">
              <span class="quick-test-title">Быстрый тест</span>
              <span class="quick-test-desc">Один шанс на вопрос, результат в конце</span>
            </div>
          </div>
          <div class="quick-test-toggle" :class="{ on: props.selectedMode === 'exam' }">
            <div class="toggle-thumb" />
          </div>
        </div>

        <!-- Количество вопросов (показывается только при активном режиме) -->
        <Transition name="slide-down">
          <div v-if="props.selectedMode === 'exam'" class="quick-test-options" @click.stop>
            <span class="options-label">Количество вопросов:</span>
            <div class="options-pills">
              <button
                  v-for="n in quickTestOptions"
                  :key="n"
                  class="pill"
                  :class="{ active: props.examQuestionLimit === n }"
                  @click="emit('set-exam-limit', n)"
              >
                {{ n }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ── Повторение ── -->
    <ReviewBadge :quiz-id="quiz.id" @start-review="emit('start-review')" />

    <!-- ── Карта знаний ── -->
    <KnowledgeMap :quiz-id="quiz.id" @train-topic="(id) => emit('train-cluster', id)" @open-subscription="showSubModal = true" />

    <!-- ── Контексты ── -->
    <div class="section" v-if="!loading && contexts.length > 0">
      <h2 class="section-title">Контексты</h2>
      <p class="section-hint">Выберите контекст, чтобы пройти только связанные вопросы</p>

      <div class="context-list">
        <div
            v-for="ctx in contexts"
            :key="ctx.id"
            class="context-card"
            :class="{ selected: selectedContext?.id === ctx.id }"
            @click="toggleContext(ctx)"
        >
          <div class="context-top">
            <span class="context-name">{{ ctx.title }}</span>
            <span class="context-count" v-if="ctx.detail?.questions">
              {{ ctx.detail.questions }} вопр.
            </span>
          </div>
          <p class="context-text" v-if="ctx.text">{{ ctx.text }}</p>
          <div class="context-check" v-if="selectedContext?.id === ctx.id">✓</div>
        </div>
      </div>
    </div>

    <!-- Скелетон загрузки контекстов -->
    <div class="section" v-if="loading">
      <div class="skeleton-title" />
      <div class="skeleton-card" v-for="i in 2" :key="i" />
    </div>

    <!-- Subscription Modal -->
    <SubscriptionModal
      :visible="showSubModal"
      @close="showSubModal = false"
      @activated="showSubModal = false"
    />

  </div>
</template>

<style scoped lang="scss">
.quiz-info {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ── Hero ── */
.hero {
  display: flex;
  position: relative;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 28px 20px 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
}

.fav-ico {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 30px;
  height: 30px;
  color: #4F4F4F;
  cursor: pointer;

  &:hover{
    fill: rgba(153, 27, 27, 0.5);
  }

  &.active {
    fill: #d82e2e;
  }
}

.hero-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.hero-title {
  margin: 0 0 8px;
  color: #234970;
}

.hero-desc {
  margin: 0;
  color: #6B7280;
  line-height: 1.5;
}

/* ── Hash Code ── */
.hash-code {
  position: absolute;
  left: 16px;
  top: 18px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  background: rgba(35, 73, 112, 0.06);
  border: 1px dashed rgba(35, 73, 112, 0.2);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  z-index: 1;

  &:active {
    transform: scale(0.95);
    background: rgba(78, 190, 194, 0.12);
    border-color: rgba(78, 190, 194, 0.4);
  }
}

.hash-label {
  font-size: 12px;
}

.hash-value {
  font-size: 11px;
  font-weight: 600;
  color: #234970;
  font-family: 'SF Mono', 'Fira Code', monospace;
  letter-spacing: 0.3px;
}

.hash-copied {
  position: absolute;
  top: -28px;
  left: 50%;
  transform: translateX(-50%) scale(0.8);
  background: #234970;
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 8px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  &.visible {
    opacity: 1;
    transform: translateX(-50%) scale(1);
  }
}

.hero-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.hero-stat {
  font-size: 13px;
  font-weight: 500;
  color: #4B5563;
  background: rgba(0, 0, 0, 0.04);
  padding: 4px 10px;
  border-radius: 12px;
}

/* ── Section ── */
.section, .mode-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.section-title {
  margin: 0;
  color: #234970;
}

.section-hint {
  margin: 0;
  color: #9CA3AF;
  line-height: 1.4;
}

/* ── Quick Test Card ── */
.quick-test-card {
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  flex-direction: column;
  gap: 14px;

  &:active { transform: scale(0.98); }

  &.active {
    border-color: rgba(78, 190, 194, 0.5);
    background: rgba(78, 190, 194, 0.06);
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.15);
  }

  &.disabled {
    opacity: 0.5;
    pointer-events: none;
  }
}

/* ── Adaptive Card ── */
.adaptive-card {
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;

  &:active { transform: scale(0.98); }

  &.active {
    border-color: rgba(147, 51, 234, 0.5);
    background: rgba(147, 51, 234, 0.06);
    box-shadow: 0 4px 16px rgba(147, 51, 234, 0.15);
  }

  &.locked {
    border-color: rgba(124, 58, 237, 0.2);
    background: rgba(124, 58, 237, 0.03);
  }

  &.pro-glow {
    box-shadow: 0 3px 16px rgba(124, 58, 237, 0.12);
    border-color: rgba(124, 58, 237, 0.2);
  }
}

.adaptive-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.adaptive-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.adaptive-icon {
  font-size: 28px;
}

.adaptive-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.adaptive-title {
  font-size: 15px;
  font-weight: 600;
  color: #234970;
}

.adaptive-desc {
  font-size: 12px;
  color: #9CA3AF;
}

.quick-test-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.quick-test-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.quick-test-icon {
  font-size: 28px;
}

.quick-test-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.quick-test-title {
  font-size: 15px;
  font-weight: 600;
  color: #234970;
}

.quick-test-desc {
  font-size: 12px;
  color: #9CA3AF;
}

.quick-test-toggle {
  position: relative;
  width: 44px;
  height: 26px;
  border-radius: 26px;
  background: rgba(0, 0, 0, 0.1);
  transition: background 0.25s ease;
  flex-shrink: 0;

  &.on {
    background: #4EBEC2;
  }

  .toggle-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }

  &.on .toggle-thumb {
    transform: translateX(18px);
  }
}

.quick-test-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 4px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.options-label {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.options-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.pill {
  padding: 6px 14px;
  border-radius: 20px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:active { transform: scale(0.95); }

  &.active {
    background: rgba(78, 190, 194, 0.15);
    border-color: #4EBEC2;
    color: #234970;
  }
}

/* ── Slide-down transition ── */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.25s ease;
}
.slide-down-enter-from,
.slide-down-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-8px);
}
.slide-down-enter-to,
.slide-down-leave-from {
  opacity: 1;
  max-height: 100px;
}

/* ── Context cards ── */
.context-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.context-card {
  position: relative;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.7);
  border: 1.5px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:active {
    transform: scale(0.98);
  }

  &.selected {
    border-color: rgba(78, 190, 194, 0.6);
    background: rgba(78, 190, 194, 0.08);
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.2);
  }
}

.context-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.context-name {
  font-weight: 600;
  color: #234970;
}

.context-count {
  font-size: 12px;
  color: #9CA3AF;
  background: rgba(0, 0, 0, 0.05);
  padding: 2px 8px;
  border-radius: 20px;
}

.context-text {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
  line-height: 1.45;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.context-check {
  position: absolute;
  top: 12px;
  right: 14px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: #4EBEC2;
  color: #fff;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

/* ── Skeleton ── */
.skeleton-title {
  height: 20px;
  width: 120px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.07);
  animation: pulse 1.4s ease infinite;
}

.skeleton-card {
  height: 72px;
  border-radius: 18px;
  background: rgba(0, 0, 0, 0.07);
  animation: pulse 1.4s ease infinite;

  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.4s; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}
</style>