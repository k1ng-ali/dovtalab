<script setup lang="ts">
import { useStats } from "@/features/mainPage/statistic/store.ts";
import {computed, onMounted, ref, watch, onUnmounted} from "vue";
import { useQuiz } from "@/features/quizPage/store.ts";
import type { QuizIn } from "../types";
import {useGsap} from "@/shared/gsap.ts";
import gsap from "gsap";

const quizStore = useQuiz();
const statStore = useStats()
const attempts = computed(() => statStore.attempts)

const quiz = ref<QuizIn | null>(null);

const adRef = ref<HTMLElement | null>(null);
const {init, cleanup} = useGsap(adRef)

watch(
    quiz,
    async (val) => {
      if (!val || !adRef.value) return;


      init(() => {
        if (adRef.value) {
          gsap.fromTo(adRef.value,
              {
                height: 0,
                opacity: 0,
                scale: 0.9,
                y: -30,
              },
              {
                height: adRef.value.scrollHeight - 40,
                opacity: 1,
                y: 0,
                scale: 1,
                duration: 0.7,
                ease: "power2.out",
                onComplete: () => {
                  if (adRef.value) {
                    adRef.value.style.height = "auto"
                  }
                }
              });
          gsap.fromTo(adRef.value.getElementsByClassName("btn"), {
                y: -50,
                x: 5,
                opacity: 0,
              },
              {
                y: 0,
                x: 0,
                opacity: 1,
                duration: 0.7,
                ease: "power2.out",
              })
        }
      });


    },
    { flush: 'post' } // 🔥 важно
);

onMounted(async () => {
  try {
    await statStore.fetchAttemptsHistory(0, 5)
    if (attempts.value && attempts.value[0]) {
      quiz.value = await quizStore.getQuiz(attempts.value[0].quiz_id)
    }
  } catch (e) {
    console.error(e)
  }
})

onUnmounted(cleanup)

const emit = defineEmits<{
  (e: 'select', quiz: QuizIn): void
}>()

</script>

<template>
  <div class="ad" v-if="quiz" ref="adRef">
        <h3 class="title">{{quiz.title}}</h3>
    <p class="desc">Продольжайте играть</p>
    <div class="btn"
    @click="emit('select', quiz)">Играть</div>
  </div>
</template>

<style scoped lang="scss">
.ad {
  display: flex;
  flex-direction: column;
  padding: 20px;
  background: linear-gradient(to left,#4EBEC2 0%, #234970 100%);
  color: white;
  border-radius: 20px;
  margin: 20px;

  .title {
    margin: 0;
  }
  .desc {
    margin: 0;
  }
  .btn {
    padding: 5px 20px;
    margin-top: 30px;
    background: #CDAE64;
    width: max-content;
    border-radius: 10cqw;
    font-weight: 600;
    font-size: 1.2rem;
    border-bottom: rgba(246, 246, 246, 0.6) 1px solid;
    border-right: rgba(246, 246, 246, 0.6) 1px solid;
    cursor: pointer;
    user-select: none;
  }
}
</style>