<script setup lang="ts">
import {storeToRefs} from "pinia";
import type { QuizIn } from "src/features/quizPage/types.ts"
import QuizCard from "./components/QuizCard.vue"
import { useQuiz } from "@/features/quizPage/store.ts"
import {onMounted, onUnmounted, ref, watch} from "vue"
import {useGsap} from "@/shared/gsap.ts";
import gsap from "gsap";

const emit = defineEmits<{
  (e: 'select', quiz: QuizIn): void
}>()

const quizStore = useQuiz();
const { quizzes } = storeToRefs(quizStore)

const quizRef = ref<HTMLElement[]>([])
const {init, cleanup} = useGsap(quizRef)

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
  try {
    await quizStore.fetchQuizzes()
    console.log("quizzes: ", quizzes.value)
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
  <div class="quizzes">
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

  .quiz {
    margin-top: 0;
    margin-bottom: 10px;
  }
}
</style>