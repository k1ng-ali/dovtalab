<script setup lang="ts">
import { storeToRefs } from "pinia"
import type { QuizIn } from "@/features/quizPage/types.ts"
import QuizCard from "./components/QuizCard.vue"
import QuizCardSkeleton from "./components/QuizCardSkeleton.vue"
import TopQuizCard from "./components/TopQuizCard.vue"
import TopQuizCardSkeleton from "./components/TopQuizCardSkeleton.vue"
import { useQuiz } from "@/features/quizPage/store.ts"
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { type HeaderAction, useHeaderStore } from "@/shared/stores/useHeaderStore.ts"
import { useI18n } from 'vue-i18n'
import FireIcon from '@iconify-vue/solar/fire-linear'
import SearchIcon from '@iconify-vue/solar/magnifer-linear'
import CloseIcon from '@iconify-vue/solar/close-circle-linear'

const { t } = useI18n()
const headerStore = useHeaderStore()

const emit = defineEmits<{
  (e: 'select', quiz: QuizIn): void
}>()

const quizStore = useQuiz()
const { quizzes, topQuizzes, favorites } = storeToRefs(quizStore)

const loading = ref(true)
const loadingMore = ref(false)
const hasMore = ref(true)
const PAGE_SIZE = 10

// Search
const searchQuery = ref('')
const searchResults = ref<QuizIn[]>([])
const isSearching = ref(false)
const searchTimeout = ref<ReturnType<typeof setTimeout> | null>(null)

const isSearchMode = computed(() => searchQuery.value.trim().length > 0)

// Display list: search results or regular quizzes (exclude top quizzes from main list)
const topQuizIds = computed(() => new Set(topQuizzes.value.map(q => q.id)))

const displayList = computed(() => {
  if (activeTab.value === 'fav') return favorites.value
  if (isSearchMode.value) return searchResults.value
  return quizzes.value.filter(q => !topQuizIds.value.has(q.id))
})

// Tabs
const activeTab = ref<'all' | 'fav'>('all')

const actions = computed(() => [
  {
    label: t('quiz.allQuizzes'),
    variant: activeTab.value === 'all' ? 'active' : 'default',
    onClick: () => activeTab.value = 'all'
  },
  {
    label: t('quiz.favorites'),
    variant: activeTab.value === 'fav' ? 'active' : 'default',
    onClick: () => activeTab.value = 'fav'
  }
] as HeaderAction[])

watch(actions, (val) => {
  headerStore.showActions(val)
}, { immediate: true })

// Search with debounce
watch(searchQuery, (val) => {
  if (searchTimeout.value) clearTimeout(searchTimeout.value)

  const q = val.trim()
  if (!q) {
    searchResults.value = []
    isSearching.value = false
    return
  }

  isSearching.value = true
  searchTimeout.value = setTimeout(async () => {
    try {
      const data = await quizStore.searchQuizzes(q, 0, 20)
      searchResults.value = data
    } catch (e) {
      console.error(e)
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }, 400)
})

// Infinite scroll
const sentinel = ref<HTMLElement | null>(null)
let observer: IntersectionObserver | null = null

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value || isSearchMode.value || activeTab.value === 'fav') return

  loadingMore.value = true
  try {
    const data = await quizStore.fetchQuizzes(quizzes.value.length, PAGE_SIZE)
    if (data.length < PAGE_SIZE) {
      hasMore.value = false
    }
  } catch (e) {
    console.error(e)
  } finally {
    loadingMore.value = false
  }
}

onMounted(async () => {
  headerStore.reset()
  headerStore.showActions(actions.value)

  try {
    loading.value = true
    await Promise.all([
      quizStore.fetchQuizzes(0, PAGE_SIZE),
      quizStore.fetchTopQuizzes(3),
      quizStore.fetchFavorites(),
    ])
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }

  // Setup intersection observer for infinite scroll
  if (sentinel.value) {
    observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore()
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(sentinel.value)
  }
})

onUnmounted(() => {
  headerStore.reset()
  headerStore.hideActions()
  if (observer) observer.disconnect()
  if (searchTimeout.value) clearTimeout(searchTimeout.value)
})
</script>

<template>
  <div class="quizzes">

    <!-- ─── Top Quizzes (горизонтальный скролл) ─── -->
    <section class="top-section">
      <h3 class="section-title"><FireIcon class="section-title__icon" />{{ t('quiz.topQuizzes') }}</h3>
      <div class="top-scroll">
        <template v-if="loading">
          <TopQuizCardSkeleton v-for="i in 3" :key="i" />
        </template>
        <template v-else>
          <TopQuizCard
            v-for="(quiz, idx) in topQuizzes"
            :key="quiz.id"
            :quiz="quiz"
            :index="idx"
            @click="emit('select', quiz)"
          />
        </template>
      </div>
    </section>

    <!-- ─── Поиск ─── -->
    <section class="search-section">
      <div class="search-input-wrapper">
        <SearchIcon class="search-icon" />
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="t('quiz.searchPlaceholder')"
        />
        <button
          v-if="searchQuery"
          type="button"
          class="clear-btn"
          :aria-label="t('common.close')"
          @click="searchQuery = ''"
        ><CloseIcon /></button>
      </div>
    </section>

    <!-- ─── Список квизов ─── -->
    <section class="list-section">
      <!-- Skeleton при загрузке -->
      <template v-if="loading">
        <QuizCardSkeleton v-for="i in 5" :key="i" class="quiz" />
      </template>

      <!-- Поиск в процессе -->
      <template v-else-if="isSearching">
        <QuizCardSkeleton v-for="i in 3" :key="i" class="quiz" />
      </template>

      <!-- Результаты (search / all / fav) -->
      <template v-else-if="displayList.length > 0">
        <QuizCard
          v-for="quiz in displayList"
          :key="quiz.id"
          :quiz="quiz"
          class="quiz"
          @click="emit('select', quiz)"
        />
      </template>

      <!-- Пусто -->
      <template v-else>
        <p class="empty" v-if="isSearchMode">{{ t('quiz.noSearchResults') }}</p>
        <p class="empty" v-else-if="activeTab === 'fav'">{{ t('quiz.noFavorites') }}</p>
        <p class="empty" v-else>{{ t('quiz.noQuizzes') }}</p>
      </template>

      <!-- Loader для подгрузки -->
      <div v-if="loadingMore" class="loading-more">
        <QuizCardSkeleton />
      </div>

      <!-- Sentinel для IntersectionObserver -->
      <div ref="sentinel" class="sentinel" />
    </section>
  </div>
</template>

<style scoped lang="scss">
.quizzes {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 16px;
}

/* ── Популярные ─────────────────────────────────────────────── */
.top-section .section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 12px;
  padding: 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-navy-900);

  &__icon { font-size: 20px; color: var(--c-wrong); }
}

.top-scroll {
  display: flex;
  gap: 12px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  padding: 8px 4px 18px;
  margin: -8px -4px -18px;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;

  &::-webkit-scrollbar { display: none; }
  & > * { scroll-snap-align: start; }
}

/* ── Поиск: стеклянная пилюля, прилипает под шапкой ─────────── */
.search-section {
  position: sticky;
  top: calc(var(--sat) + 76px);
  z-index: 10;

  @media (min-width: 1024px) { top: 84px; }
}

.search-input-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 52px;
  padding: 0 8px 0 18px;
  box-sizing: border-box;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.72);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--shadow-card);
  transition: box-shadow 0.2s ease;

  &:focus-within { box-shadow: inset 0 0 0 2px var(--c-teal-600), var(--shadow-card); }
}

.search-icon { font-size: 20px; color: var(--c-muted); flex-shrink: 0; }

.search-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--c-ink);
  font-family: inherit;

  &::placeholder { color: var(--c-muted-2); }
}

.clear-btn {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: transparent;
  color: var(--c-muted);
  font-size: 20px;
  cursor: pointer;

  &:active { background: rgba(35, 73, 112, 0.08); }
}

/* ── Список: одна колонка на телефоне, две на десктопе ──────── */
.list-section {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;

  @media (min-width: 1024px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;
  }
}

.empty {
  grid-column: 1 / -1;
  margin: 40px 0 0;
  color: var(--c-muted);
  text-align: center;
  font-size: 15px;
}

.loading-more, .sentinel { grid-column: 1 / -1; }
.sentinel { height: 1px; }
</style>
