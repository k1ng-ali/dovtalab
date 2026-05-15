<script setup lang="ts">
import {storeToRefs} from "pinia";
import type { QuizIn } from "src/features/quizPage/types.ts"
import QuizCard from "./components/QuizCard.vue"
import { useQuiz } from "@/features/quizPage/store.ts"
import {computed, onMounted, onUnmounted, ref, watch} from "vue"
import {useGsap} from "@/shared/gsap.ts";
import gsap from "gsap";
import {type HeaderAction, useHeaderStore} from "@/shared/stores/useHeaderStore.ts";

const headerStore = useHeaderStore()

const emit = defineEmits<{
  (e: 'select', quiz: QuizIn): void
}>()

const quizStore = useQuiz();
const { quizzes } = storeToRefs(quizStore)
const { favorites } = storeToRefs(quizStore)

const quizRef = ref<HTMLElement[]>([])
const {init, cleanup} = useGsap(quizRef)

const activeTab = ref<'all' | 'fav'>('all')

const actions = computed(() => [
  {
    label: "Все тесты",
    variant: activeTab.value === 'all' ? 'active' : 'default',
    onClick: () => activeTab.value = 'all'
  },
  {
    label: "Избранные",
    variant: activeTab.value === 'fav' ? 'active' : 'default',
    onClick: () => activeTab.value = 'fav'
  }
] as HeaderAction[])

watch(
    actions,
    (val) => {
      headerStore.showActions(val)
    },
    { immediate: true }
)

watch(
    quizzes,
    () => {
      quizRef.value = [];

      setTimeout(() => {
        init(() => {
          gsap.fromTo(quizRef.value, {
            opacity: 0,
            y: -10,
          }, {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.2,
            ease: "power2.out",
          });
        });
      });
    },
    { flush: "post" }
);

onMounted( async () => {
  headerStore.reset()
  headerStore.showActions(actions.value
  )

  try {
    await quizStore.fetchQuizzes()
    console.log("quizzes: ", quizzes.value)
    await quizStore.fetchFavorites()
    console.log("favorites: ", favorites.value)
  } catch (e) {
    console.error(e)
  }
})

const setRef = (el: any) => {
  if (!el) return;

  // если это Vue компонент → берём реальный DOM
  const element = el.$el ?? el;

  if (element instanceof HTMLElement) {
    quizRef.value.push(element);
  }
};

onUnmounted( cleanup)
</script>

<template>
  <div class="quizzes" v-if="activeTab === 'all'">
    <h2 class="title">Викторины</h2>
    <QuizCard
        v-for="quiz in quizzes"
        :key="quiz.id"
        :quiz="quiz"
        class="quiz"
        @click="emit('select', quiz)"
        :ref="setRef"
    />
  </div>
  <div class="quizzes" v-if="activeTab === 'fav'">
    <h2 class="title">Викторины</h2>
    <QuizCard
        v-if="favorites.length > 0"
        v-for="quiz in favorites"
        :key="quiz.id"
        :quiz="quiz"
        class="quiz"
        @click="emit('select', quiz)"
        :ref="setRef"
    />
    <p v-else class="empty-fav" >✨ Пока нет избранных викторин</p>
  </div>
</template>

<style scoped lang="scss">
.quizzes {
  display: flex;
  flex-direction: column;
  padding: 20px;

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