<script setup lang="ts">
import {onMounted, onUnmounted, watch} from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import MdOutlinedMenuBook from '@iconify-vue/solar/notebook-linear'
import Quizzes  from "@/features/quizPage/quizzes/Quizzes.vue"
import QuizInfo from "@/features/quizPage/quizzes/QuizInfo.vue"
import QuizRunner from "@/features/quizPage/quiz/QuizRunner.vue"
import BannerCarousel from "@/features/quizPage/ad/BannerCarousel.vue";

import { useNavStore }    from "@/shared/stores/useNavStore.ts"
import { useHeaderStore } from "@/shared/stores/useHeaderStore.ts"
import { useQuizFlow }    from "@/features/quizPage/useQuizFlow"
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import { useI18n } from 'vue-i18n'

const route       = useRoute()
const router      = useRouter()
const navStore    = useNavStore()
const headerStore = useHeaderStore()
const flow        = useQuizFlow()
const { t }       = useI18n()

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
            label: t('common.back'),
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
            label: t('quiz.context'),
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
            label: t('common.back'),
            icon: BsArrowLeft,
            variant: "default",
            onClick: () => flow.backToInfo(),
          },
          {
            label: t('quiz.answer'),
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
        <div v-else-if="flow.view.value === 'info'" key="info" class="narrow">
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
        <div v-else-if="flow.view.value === 'quiz'" key="quiz" class="narrow">
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
  background: transparent;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
}

.page-body {
  width: 100%;
  max-width: 720px;
  box-sizing: border-box;
  padding: calc(var(--sat) + 90px) 14px calc(var(--sab) + 120px);

  @media (min-width: 1024px) {
    max-width: var(--content-max);
    padding: 96px 24px 48px;
  }
}

.narrow { max-width: 760px; margin: 0 auto; }

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