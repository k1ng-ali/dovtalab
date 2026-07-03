<script setup lang="ts">
import { storeToRefs } from "pinia"
import type { QuizIn } from "@/features/quizPage/types.ts"
import QuizCard from "./components/QuizCard.vue"
import QuizCardSkeleton from "./components/QuizCardSkeleton.vue"
import { useQuiz } from "@/features/quizPage/store.ts"
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useGsap } from "@/shared/gsap.ts"
import gsap from "gsap"
import { type HeaderAction, useHeaderStore } from "@/shared/stores/useHeaderStore.ts"
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const headerStore = useHeaderStore()

const emit = defineEmits<{
  (e: 'select', quiz: QuizIn): void
}>()

const quizStore = useQuiz()
const { quizzes } = storeToRefs(quizStore)
const { favorites } = storeToRefs(quizStore)

const loading = ref(true)

const quizRef = ref<HTMLElement[]>([])
const { init, cleanup } = useGsap(quizRef)

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

watch(
  quizzes,
  () => {
    quizRef.value = []
    setTimeout(() => {
      init(() => {
        gsap.fromTo(quizRef.value, {
          opacity: 0,
          y: -10,
        }, {
          opacity: 1,
          y: 0,
          duration: 0.5,
          stagger: 0.15,
          ease: "power2.out",
        })
      })
    })
  },
  { flush: "post" }
)

onMounted(async () => {
  headerStore.reset()
  headerStore.showActions(actions.value)

  try {
    loading.value = true
    await quizStore.fetchQuizzes()
    await quizStore.fetchFavorites()
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
})

const setRef = (el: any) => {
  if (!el) return
  const element = el.$el ?? el
  if (element instanceof HTMLElement) {
    quizRef.value.push(element)
  }
}

onUnmounted(() => {
  cleanup
  headerStore.reset()
  headerStore.hideActions()
})
</script>

<template>
  <!-- Skeleton при загрузке -->
  <div v-if="loading" class="quizzes">
    <h2 class="title">{{ t('quiz.quizzesTitle') }}</h2>
    <QuizCardSkeleton v-for="i in 5" :key="i" class="quiz" />
  </div>

  <!-- Все квизы -->
  <div v-else-if="activeTab === 'all'" class="quizzes">
    <h2 class="title">{{ t('quiz.quizzesTitle') }}</h2>
    <QuizCard
      v-for="quiz in quizzes"
      :key="quiz.id"
      :quiz="quiz"
      class="quiz"
      @click="emit('select', quiz)"
      :ref="setRef"
    />
  </div>

  <!-- Избранные -->
  <div v-else class="quizzes">
    <h2 class="title">{{ t('quiz.quizzesTitle') }}</h2>
    <template v-if="favorites.length > 0">
      <QuizCard
        v-for="quiz in favorites"
        :key="quiz.id"
        :quiz="quiz"
        class="quiz"
        @click="emit('select', quiz)"
        :ref="setRef"
      />
    </template>
    <p v-else class="empty-fav">{{ t('quiz.noFavorites') }}</p>
  </div>
</template>

<style scoped lang="scss">
.quizzes {
  display: flex;
  flex-direction: column;

  .title {
    margin: 0 0 16px;
    color: #234970;
  }

  .empty-fav {
    color: #6B7280;
    width: 100%;
    text-align: center;
    margin-top: 50px;
    font-size: 20px;
  }

  .quiz {
    margin-top: 0;
    margin-bottom: 10px;
  }
}
</style>