<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useQuiz } from '@/features/quizPage/store.ts'
import type { QuizIn } from '@/features/quizPage/types.ts'
import type { DuelCreatePayload } from '../types.ts'
import CloseIcon from '@iconify-vue/solar/close-circle-linear'
import SearchIcon from '@iconify-vue/solar/magnifer-linear'
import ClearIcon from '@iconify-vue/solar/close-circle-bold'
import CheckIcon from '@iconify-vue/solar/check-circle-bold'
import { subjectInitials, subjectTint } from '@/shared/lib/subjectTint.ts'

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
  <Teleport to="body">
    <div class="ui-sheet-overlay" @click.self="emit('close')">
      <div class="ui-sheet create" role="dialog" aria-modal="true">
        <div class="ui-sheet__handle" />

        <!-- Шапка -->
        <div class="ui-sheet__head">
          <div class="create__heading">
            <span class="create__badge">{{ $t('duels.newRoom') }}</span>
            <h2 class="ui-sheet__title">{{ $t('duels.create') }}</h2>
          </div>
          <button class="ui-icon-btn ui-sheet__close" type="button" @click="emit('close')"><CloseIcon /></button>
        </div>

        <!-- Поиск -->
        <div class="search">
          <SearchIcon class="search__icon" />
          <input
            v-model="searchQuery"
            type="text"
            class="ui-input search__input"
            :placeholder="$t('duels.searchPlaceholder')"
          />
          <button v-if="searchQuery" class="search__clear" type="button" @click="searchQuery = ''">
            <ClearIcon />
          </button>
        </div>

        <!-- Список тестов -->
        <div class="picks">
          <template v-if="isLoading || isSearching">
            <div v-for="i in 3" :key="i" class="ui-skeleton pick-skeleton" />
          </template>

          <p v-else-if="displayQuizzes.length === 0" class="picks__empty">{{ $t('duels.nothingFound') }}</p>

          <div
            v-else
            v-for="quiz in displayQuizzes"
            :key="quiz.id"
            class="pick ui-option"
            :class="{ selected: selectedQuiz?.id === quiz.id }"
            @click="selectQuiz(quiz)"
          >
            <span class="pick__tile" :style="{ background: subjectTint(quiz.id).bg, color: subjectTint(quiz.id).color }">
              {{ subjectInitials(quiz.title) }}
            </span>
            <span class="pick__text">
              <b class="pick__title">{{ quiz.title }}</b>
              <span class="pick__desc">{{ quiz.description || $t('duels.noDescription') }}</span>
            </span>
            <CheckIcon v-if="selectedQuiz?.id === quiz.id" class="pick__check" />
          </div>
        </div>

        <!-- Количество вопросов -->
        <div class="count">
          <span class="count__label">{{ $t('duels.questionCount') }}</span>
          <div class="ui-segmented count__seg">
            <button
              v-for="count in countPresets"
              :key="count"
              type="button"
              class="ui-segmented__item"
              :class="{ active: questionCount === count }"
              @click="questionCount = count"
            >
              {{ count }}
            </button>
          </div>
        </div>

        <!-- Действия -->
        <div class="create__actions">
          <button class="ui-btn ui-btn--secondary" type="button" @click="emit('close')">{{ $t('common.cancel') }}</button>
          <button
            class="ui-btn ui-btn--primary"
            type="button"
            :disabled="isSubmitting || !selectedQuiz"
            @click="handleSubmit"
          >
            {{ isSubmitting ? $t('duels.creating') : $t('duels.createRoom') }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped lang="scss">
.create {
  &__heading { display: flex; flex-direction: column; gap: 2px; }

  &__badge {
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--c-teal-600);
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 10px;
    margin-top: 2px;
  }
}

.search {
  position: relative;

  &__icon {
    position: absolute;
    left: 16px;
    top: 50%;
    transform: translateY(-50%);
    font-size: 18px;
    color: var(--c-muted);
    pointer-events: none;
  }

  &__input { padding-left: 44px; padding-right: 44px; }

  &__clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    display: flex;
    padding: 6px;
    border: none;
    background: none;
    font-size: 20px;
    color: var(--c-muted);
    cursor: pointer;
  }
}

.picks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 300px;
  overflow-y: auto;
  margin: 0 -4px;
  padding: 2px 4px;

  &__empty { margin: 0; padding: 24px 0; text-align: center; font-size: 14px; color: var(--c-muted); }
}

.pick-skeleton { height: 66px; border-radius: var(--r-md); }

.pick {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px 10px 10px;
  border-radius: var(--r-md);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 0 0 1px var(--c-line);

  &__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    flex-shrink: 0;
    border-radius: 13px;
    font-size: 14px;
    font-weight: 800;
  }

  &__text { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }

  &__title, &__desc { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  &__title { font-size: 14px; font-weight: 700; color: var(--c-navy-900); }
  &__desc { font-size: 12px; color: var(--c-muted); }
  &__check { font-size: 22px; color: var(--c-teal-600); }
}

.count {
  display: flex;
  flex-direction: column;
  gap: 8px;

  &__label { font-size: 13px; font-weight: 600; color: var(--c-muted); }
  &__seg { background: rgba(23, 46, 74, 0.05); }
}
</style>
