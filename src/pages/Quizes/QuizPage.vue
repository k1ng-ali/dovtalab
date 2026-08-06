<script setup lang="ts">
import {onMounted, onUnmounted, watch} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BsArrowLeft, MdOutlinedMenuBook } from '@kalimahapps/vue-icons'
import Quizzes  from "@/features/quizPage/quizzes/Quizzes.vue"
import QuizInfo from "@/features/quizPage/quizzes/QuizInfo.vue"
import QuizRunner from "@/features/quizPage/quiz/QuizRunner.vue"
import BannerCarousel from "@/features/quizPage/ad/BannerCarousel.vue";

import { useNavStore }    from "@/shared/stores/useNavStore.ts"
import { useHeaderStore } from "@/shared/stores/useHeaderStore.ts"
import { useQuizFlow }    from "@/features/quizPage/useQuizFlow"
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import {EdgeToEdge} from "@capawesome/capacitor-android-edge-to-edge-support";

const route       = useRoute()
const router      = useRouter()
const navStore    = useNavStore()
const headerStore = useHeaderStore()
const flow        = useQuizFlow()

// ── Синхронизируем header и navigator при смене экрана ────────────────────────


watch(
    () => flow.view.value,
    (v) => {
      if (v === "list") {

        navStore.showTabs()
      }

      if (v === "info") {
        headerStore.setTitle(flow.selectedQuiz.value?.title ?? "")
        headerStore.setLeftAction({
          icon: BsArrowLeft,
          onClick: () => flow.backToList(),
        })
        headerStore.setRightAction(null)
        headerStore.hideActions()

        navStore.showActions([
          {
            label: "Назад",
            icon: BsArrowLeft,
            variant: "default",
            onClick: () => flow.backToList(),
          },
          {
            get label() { return flow.startLabel.value },
            variant: "primary",
            onClick: () => flow.openQuiz(),
          },
        ])
      }

      if (v === "quiz") {
        headerStore.setTitle(flow.selectedQuiz.value?.title ?? "")
        headerStore.setLeftAction({
          icon: BsArrowLeft,
          onClick: () => flow.backToInfo(),
        })
        headerStore.hideActions()

        const hasContext = flow.selectedContext.value !== null
        if (hasContext) {
          headerStore.setRightAction({
            icon: MdOutlinedMenuBook,
            label: "Контекст",
            onClick: () => {
              // событие открытия модалки — слушает QuizRunner
              window.dispatchEvent(new Event("open-context-modal"))
            },
          })
        } else {
          headerStore.setRightAction(null)
        }

        // Навигатор в режиме quiz управляется из QuizRunner через updateAction
        navStore.showActions([
          {
            label: "Назад",
            icon: BsArrowLeft,
            variant: "default",
            onClick: () => flow.backToInfo(),
          },
          {
            label: "Ответить",
            variant: "primary",
            disabled: true,
            onClick: () => {
              window.dispatchEvent(new Event("quiz-submit-answer"))
            },
          },
        ])
      }
    },
    { immediate: true }
)
onMounted(async () => {
  // Deep-link: /quiz/:hashCode — открываем QuizInfo сразу
  const hashCode = route.params.hashCode as string | undefined
  if (hashCode) {
    await flow.openInfoByHash(hashCode)
    // Убираем hash из URL, чтобы кнопка "назад" не перечитывала его
    router.replace({ path: '/quiz' })
  }

  if (Capacitor.isNativePlatform()) {
    try {
      // Исходное состояние при загрузке
      await SystemBars.setStyle({ style: SystemBarsStyle.Light})
      await EdgeToEdge.setBackgroundColor({ color: '#00000000' });
    } catch (e) {
      console.error('Ошибка настройки StatusBar:', e);
    }
  }
})
onUnmounted(() => headerStore.reset())
</script>

<template>
  <div class="quiz-page">
    <div class="page-body">
      <Transition name="slide" mode="out-in">

        <!-- Список квизов -->
        <div v-if="flow.view.value === 'list'" key="list">
          <BannerCarousel class="ad" @select-quiz="flow.openInfo"/>
          <Quizzes @select="flow.openInfo" />
        </div>

        <!-- Информация о квизе -->
        <div v-else-if="flow.view.value === 'info'" key="info">
          <QuizInfo
              :quiz="flow.selectedQuiz.value!"
              :selected-context="flow.selectedContext.value"
              :selected-mode="flow.selectedMode.value"
              :exam-question-limit="flow.examQuestionLimit.value"
              @select-context="flow.selectContext"
              @select-mode="flow.selectMode"
              @set-exam-limit="flow.setExamLimit"
              @train-cluster="flow.trainCluster"
              @start-review="flow.startReview"
          />
        </div>

        <!-- Прохождение теста -->
        <div v-else-if="flow.view.value === 'quiz'" key="quiz">
          <QuizRunner
              :quiz="flow.selectedQuiz.value!"
              :context="flow.selectedContext.value"
              :mode="flow.selectedMode.value"
              :question-limit="flow.selectedMode.value === 'exam' ? flow.examQuestionLimit.value : undefined"
              :cluster-id="flow.selectedClusterId.value"
              @finish="flow.backToInfo"
          />
        </div>

      </Transition>
    </div>
  </div>
</template>

<style scoped lang="scss">
.quiz-page {
  min-height: 100vh;
  background: #F6F6F6;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
}

.page-body {
  padding: 20px;
  padding-top: 80px;   /* под фиксированным Header */
  padding-bottom: 100px; /* над фиксированным Navigator */
  max-width: 900px;
  width: 100%;
}

/* ── Slide transition ── */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>