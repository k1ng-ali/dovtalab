<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuiz } from '@/features/quizPage/store.ts'
import type { QuizIn } from '@/features/quizPage/types.ts'
import type { DuelCreatePayload } from '../types.ts'

defineProps<{
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'submit', payload: DuelCreatePayload): void
}>()

const quizStore = useQuiz()

// ── Search & List ─────────────────────────────────────────────────────────────
const searchQuery = ref('')
const searchResults = ref<QuizIn[]>([])
const initialQuizzes = ref<QuizIn[]>([])
const isLoading = ref(true)
const isSearching = ref(false)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

// ── Selection ─────────────────────────────────────────────────────────────────
const selectedQuiz = ref<QuizIn | null>(null)
const questionCount = ref(10)
const countPresets = [5, 10, 15, 20]

const isSearchMode = computed(() => searchQuery.value.trim().length > 0)
const displayQuizzes = computed(() => {
  return isSearchMode.value ? searchResults.value : initialQuizzes.value
})

// ── Debounced Search ──────────────────────────────────────────────────────────
watch(searchQuery, (val) => {
  if (searchTimeout) clearTimeout(searchTimeout)

  const query = val.trim()
  if (!query) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  searchTimeout = setTimeout(async () => {
    try {
      searchResults.value = await quizStore.searchQuizzes(query, 0, 20)
    } catch (e) {
      console.error('Ошибка поиска квизов:', e)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 400)
})

onMounted(async () => {
  try {
    isLoading.value = true
    // Загружаем первые 15 популярных/свежих квизов для начального показа
    initialQuizzes.value = await quizStore.fetchQuizzes(0, 15)
    if (initialQuizzes.value.length > 0) {
      selectedQuiz.value = initialQuizzes.value[0] ?? null
    }
  } catch (e) {
    console.error('Ошибка предзагрузки квизов:', e)
  } finally {
    isLoading.value = false
  }
})

onUnmounted(() => {
  if (searchTimeout) clearTimeout(searchTimeout)
})

function selectQuiz(quiz: QuizIn) {
  selectedQuiz.value = quiz
}

function handleSubmit() {
  if (!selectedQuiz.value) return
  emit('submit', {
    quiz_id: selectedQuiz.value.id,
    question_count: questionCount.value,
  })
}
</script>

<template>
  <div class="modal-backdrop" @click.self="emit('close')">
    <div class="modal-card">
      
      <!-- Шапка -->
      <div class="modal-header">
        <div>
          <span class="modal-badge">НОВАЯ КОМНАТА</span>
          <h2>Создать дуэль</h2>
        </div>
        <button class="close-btn" type="button" @click="emit('close')">✕</button>
      </div>

      <!-- Поисковая строка в стиле Quizzes.vue -->
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          placeholder="Поиск по названию..."
        />
        <button
          v-if="searchQuery"
          class="clear-btn"
          type="button"
          @click="searchQuery = ''"
        >
          ✕
        </button>
      </div>

      <!-- Список карточек квизов -->
      <div class="quiz-scroll-list">
        <div v-if="isLoading || isSearching" class="loading-state">
          <div v-for="i in 3" :key="i" class="skeleton-card" />
        </div>

        <div v-else-if="displayQuizzes.length === 0" class="empty-state">
          Ничего не найдено
        </div>

        <div
          v-else
          v-for="quiz in displayQuizzes"
          :key="quiz.id"
          class="quiz-pick-card"
          :class="{ active: selectedQuiz?.id === quiz.id }"
          @click="selectQuiz(quiz)"
        >
          <div class="card-left">
            <span class="card-icon">📘</span>
            <div class="card-text">
              <h4 class="card-title">{{ quiz.title }}</h4>
              <p class="card-desc">{{ quiz.description || 'Без описания' }}</p>
            </div>
          </div>
          <div class="radio-indicator">
            <div class="radio-dot" />
          </div>
        </div>
      </div>

      <!-- Выбор количества вопросов (pills) -->
      <div class="count-selector">
        <span class="count-label">Количество вопросов:</span>
        <div class="pills-row">
          <button
            v-for="count in countPresets"
            :key="count"
            type="button"
            class="pill"
            :class="{ active: questionCount === count }"
            @click="questionCount = count"
          >
            {{ count }}
          </button>
        </div>
      </div>

      <!-- Кнопки действий -->
      <div class="modal-actions">
        <button class="cancel-btn" type="button" @click="emit('close')">Отмена</button>
        <button
          class="submit-btn"
          type="button"
          :disabled="isSubmitting || !selectedQuiz"
          @click="handleSubmit"
        >
          {{ isSubmitting ? 'Создание...' : 'Создать комнату' }}
        </button>
      </div>

    </div>
  </div>
</template>

<style scoped lang="scss">
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 200;
  background: rgba(17, 36, 55, 0.6);
  backdrop-filter: blur(6px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.modal-card {
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  border-radius: 24px;
  padding: 24px;
  box-shadow: 0 16px 45px rgba(0, 0, 0, 0.16);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;

  h2 {
    margin: 2px 0 0;
    font-size: 20px;
    font-weight: 700;
    color: #234970;
  }
}

.modal-badge {
  font-size: 11px;
  font-weight: 800;
  color: #4ebec2;
  letter-spacing: 0.1em;
}

.close-btn {
  background: #f0f4f6;
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  color: #234970;
  font-weight: 700;
}

/* ── Search Input ── */
.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: #f6f8f9;
  border: 1.5px solid #e2e8f0;
  border-radius: 14px;
  margin-bottom: 14px;
  transition: all 0.2s;

  &:focus-within {
    border-color: #4ebec2;
    background: #ffffff;
    box-shadow: 0 3px 12px rgba(78, 190, 194, 0.15);
  }
}

.search-icon {
  font-size: 15px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font: inherit;
  font-size: 14px;
  color: #234970;

  &::placeholder {
    color: #a0aec0;
  }
}

.clear-btn {
  background: rgba(0, 0, 0, 0.06);
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 11px;
  color: #718096;
  cursor: pointer;
}

/* ── Scrollable list of cards ── */
.quiz-scroll-list {
  flex: 1;
  overflow-y: auto;
  max-height: 260px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-right: 4px;
  margin-bottom: 16px;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: #cbd5e0;
    border-radius: 4px;
  }
}

.quiz-pick-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1.5px solid #edf2f7;
  background: #ffffff;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: rgba(78, 190, 194, 0.4);
  }

  &.active {
    background: rgba(78, 190, 194, 0.08);
    border-color: #4ebec2;
    box-shadow: 0 4px 12px rgba(78, 190, 194, 0.12);

    .radio-dot {
      transform: scale(1);
    }
  }
}

.card-left {
  display: flex;
  align-items: center;
  gap: 10px;
  overflow: hidden;
}

.card-icon {
  font-size: 24px;
  flex-shrink: 0;
}

.card-text {
  overflow: hidden;
}

.card-title {
  margin: 0 0 2px;
  font-size: 14px;
  font-weight: 700;
  color: #234970;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-desc {
  margin: 0;
  font-size: 12px;
  color: #718096;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.radio-indicator {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #cbd5e0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .active & {
    border-color: #4ebec2;
  }
}

.radio-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4ebec2;
  transform: scale(0);
  transition: transform 0.2s ease;
}

/* ── Skeletons & Empty ── */
.skeleton-card {
  height: 52px;
  border-radius: 14px;
  background: #f0f4f6;
  animation: pulse 1.4s ease infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.empty-state {
  text-align: center;
  padding: 30px;
  font-size: 13px;
  color: #a0aec0;
}

/* ── Questions Count Pills ── */
.count-selector {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #edf2f7;
  margin-bottom: 20px;
}

.count-label {
  font-size: 12px;
  font-weight: 600;
  color: #718096;
}

.pills-row {
  display: flex;
  gap: 8px;
}

.pill {
  flex: 1;
  padding: 8px;
  border-radius: 10px;
  border: 1.5px solid #e2e8f0;
  background: transparent;
  color: #234970;
  font-weight: 700;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;

  &.active {
    background: #4ebec2;
    border-color: #4ebec2;
    color: #ffffff;
  }
}

/* ── Actions ── */
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.cancel-btn {
  background: transparent;
  border: none;
  padding: 10px 16px;
  color: #718096;
  font-weight: 600;
  cursor: pointer;
}

.submit-btn {
  padding: 10px 20px;
  background: #234970;
  color: #ffffff;
  border: none;
  border-radius: 12px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}
</style>