<script setup lang="ts">
import { useStats } from "@/features/mainPage/statistic/store.ts";
import {computed, onMounted, ref} from "vue";
import { useQuiz } from "@/features/quizPage/store.ts";
import type { QuizIn } from "../types";
import 'ant-design-vue/dist/reset.css'
import {Carousel} from "ant-design-vue";

const quizStore = useQuiz();
const statStore = useStats()
const attempts = computed(() => statStore.attempts)

const quiz = ref<QuizIn | null>(null);

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

const open = (url:string) => {
  window.open(url, "_blank");
}

const emit = defineEmits<{
  (e: 'select', quiz: QuizIn): void
}>()

</script>

<template>
  <Carousel
      autoplay
    dotPosition="right"
      effect="scrollx"
  >
    <div class="ad tg-gr-ad-1">
        <div class="container">
          <h3 class="title">{{ $t('ad.telegramTitle') }}</h3>
          <p class="desc">{{ $t('ad.telegramDesc') }}</p>
          <div class="btn"
               @click="open('https://t.me/mmt_taj')"
          >
            {{ $t('ad.go') }}
          </div>
      </div>
    </div>

    <div class="ad" v-if="quiz">
      <div class="container">
        <h3 class="title">{{quiz.title}}</h3>
        <p class="desc">{{ $t('ad.continuePlaying') }}</p>
        <div class="btn"
        @click="emit('select', quiz)">{{ $t('ad.play') }}</div>
      </div>
    </div>

    <div class="ad tg-gr-ad-2">
      <div class="container">
        <h3 class="title">{{ $t('ad.newsTitle') }}</h3>
        <p class="desc">{{ $t('ad.newsDesc') }}</p>
        <div class="btn"
             @click="open('https://t.me/dovtalab_io')"
        >
          {{ $t('ad.go') }}
        </div>
      </div>
    </div>
  </Carousel>
</template>

<style scoped lang="scss">
.ad {
  display: flex;
  flex-direction: column;
  background: var(--grad-primary);
  color: white;
  border-radius: 20px;

  & .tg-gr-ad-1{
    background: linear-gradient(to left, #c2884e 0%, #702323 100%);
  }

  & .tg-gr-ad-2 {
    background: linear-gradient(to left, #4ec296 0%, #235570 100%);
  }

  & .container {
    margin: 20px;
  }

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
    border-bottom-width: 1px;
    border-bottom-style: solid;
    border-bottom-color: rgba(246, 246, 246, 0.6);
    cursor: pointer;
    user-select: none;
  }
}
:deep(.slick-list) {
  border-radius: 20px;
}
</style>