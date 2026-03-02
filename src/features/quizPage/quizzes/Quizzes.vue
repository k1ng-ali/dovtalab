<script setup lang="ts">
import {storeToRefs} from "pinia";
import type { QuizIn } from "src/features/quizPage/types.ts"
import QuizCard from "./components/QuizCard.vue"
import { useQuiz } from "@/features/quizPage/store.ts"
import {onMounted} from "vue"

const emit = defineEmits<{
  (e: 'select', quiz: QuizIn): void
}>()

const quizStore = useQuiz();
const { quizzes } = storeToRefs(quizStore)

onMounted( async () => {
  try {
    await quizStore.fetchQuizzes()
    console.log("quizzes: ", quizzes.value)
  } catch (e) {
    console.error(e)
  }
})

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