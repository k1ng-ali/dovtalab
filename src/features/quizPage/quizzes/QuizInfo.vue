<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { QuizIn, ContextIn } from '@/features/quizPage/types.ts'
import { useQuiz } from '@/features/quizPage/store.ts'
import { MdRoundFavoriteBorder, MdRoundFavorite } from '@kalimahapps/vue-icons';
const props = defineProps<{
  quiz: QuizIn
  selectedContext: ContextIn | null
}>()

const emit = defineEmits<{
  (e: 'select-context', ctx: ContextIn | null): void
}>()

const quizStore = useQuiz()
const contexts  = ref<ContextIn[]>([])
const loading   = ref(false)
const Stats = computed(() => quizStore.quizStat(props.quiz.id))

onMounted(async () => {
  await quizStore.fetchQuizStat(props.quiz.id)

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

const typeLabels: Record<string, string> = {
  single_choice:   "Одиночный выбор",
  multiple_choice: "Множественный выбор",
  matching:        "Соответствие",
  input:           "Ввод ответа",
}

const typeIcons: Record<string, string> = {
  single_choice:   "🔘",
  multiple_choice: "☑️",
  matching:        "🔗",
  input:           "✏️",
}

const minutes = computed(() =>
    Math.floor((Stats.value?.current_attempt_stat?.duration_sec ?? 0) / 60)
)

const seconds = computed(() =>
    (Stats.value?.current_attempt_stat.duration_sec ?? 0) % 60)

const timeLabel = computed(() => {
  if (seconds.value === 0) return `${minutes.value} мин`
  return `${minutes.value} мин ${seconds.value} сек`
})

const accuracy = computed(() => {
  if (Stats.value?.current_attempt_stat?.accuracy_percent) {
    return Math.round(Stats.value.current_attempt_stat?.accuracy_percent)
  }
  return
})

const progress = computed(() => {
  if (Stats.value?.total_questions && Stats.value?.current_attempt_stat?.total_count) {
    return Math.round((Stats.value?.current_attempt_stat?.total_count / Stats.value?.total_questions ) * 100)
  }
})

const best_duration = computed(() => {
  if (Stats.value?.completed_attempt_stats.length??0 > 0) {
    let duration = Stats.value?.completed_attempt_stats[0].duration_sec
    Stats.value?.completed_attempt_stats.forEach((attemp) => {
      if (duration && duration > attemp.duration_sec) {
        duration = attemp.duration_sec
      }
    })
    return duration
  }
})

const bestTimeLabel = computed(() => {
  if (best_duration.value != null) {
    if (best_duration.value < 60) {
      return `${best_duration.value} сек`
    }

    const minutes = Math.floor(best_duration.value / 60)
    const seconds = Math.floor(best_duration.value % 60)

    return `${minutes} мин ${seconds} сек`
  }
  return
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
</script>

<template>
  <div class="quiz-info">

    <!-- ── Шапка ── -->
    <div class="hero">
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
    </div>

    <!-- ── Мета-блок ── -->
    <div class="meta-grid">
      <div class="meta-item">
        <span class="meta-icon">⏱</span>
        <span class="meta-label">Проведенная время</span>
        <span class="meta-value">{{ timeLabel }}</span>
      </div>

      <div class="meta-item" v-if="quiz.details?.type">
        <span class="meta-icon">{{ typeIcons[quiz.details.type] }}</span>
        <span class="meta-label">Тип</span>
        <span class="meta-value">{{ typeLabels[quiz.details.type] }}</span>
      </div>

      <div class="meta-item" v-if="Stats?.total_questions">
        <span class="meta-icon">📝</span>
        <span class="meta-label">Вопросов</span>
        <span class="meta-value">{{ Stats?.total_questions }}</span>
      </div>

      <div class="meta-item" v-if="Stats?.current_attempt_stat?.correct_count != null">
        <span class="meta-icon">✅</span>
        <span class="meta-label">Выполнено</span>
        <span class="meta-value">{{ Stats?.current_attempt_stat?.correct_count }}</span>
      </div>

      <div class="meta-item" v-if="Stats?.completed_attempt_stats?.length?? 0 > 0">
        <span class="meta-header">Пройдено: {{Stats?.completed_attempt_stats.length}} раза</span>
        <span class="meta-value">Лучший результат <br>{{ bestTimeLabel }}</span>
      </div>
    </div>

    <!-- ── Прогресс ── -->
    <div class="progress-block" v-if="progress != null && accuracy != null">
      <div class="progress-header">
        <span>Прогресс</span>
        <span class="progress-pct">{{ Math.round(progress * accuracy / 100) }}%</span>
      </div>
      <div class="progress-bar">
        <div
            class="progress-fill"
            :style="{ width: progress + '%'}"
        />
        <div
            class="accuracy-fill"
            :style="{ width: Math.round(progress * accuracy / 100) + '%'}"
        />
      </div>
    </div>


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

  </div>
</template>

<style scoped lang="scss">
.quiz-info {
  padding: 20px;
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

/* ── Meta grid ── */
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
}

.meta-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.meta-label {
  font-size: 11px;
  color: #9CA3AF;
  font-weight: 500;
}

.meta-header {
  font-size: large;
  font-weight: 700;
  color: #234970;
}

.meta-value {
  font-weight: 500;
  color: rgba(64, 64, 64);
}

/* ── Progress ── */
.progress-block {
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-weight: 600;
  color: #234970;
  margin-bottom: 8px;
}

.progress-pct {
  color: #4EBEC2;
}

.progress-bar {
  position: relative;
  height: 8px;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  height: 100%;
  background: rgba(64, 64, 64, 0.3);
  transition: width 0.4s ease;
  border-radius: 8px;
}

.accuracy-fill {
  position: absolute;
  height: 100%;
  background: linear-gradient(90deg, #4EBEC2, #234970);
  transition: width 0.4s ease;
  border-radius: 8px;
  z-index: 2;
}

/* ── Section ── */
.section {
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