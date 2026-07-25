import { ref, computed } from "vue"
import type { QuizIn, ContextIn, QuizMode } from "@/features/quizPage/types.ts"
import { useI18n } from 'vue-i18n'

export type FlowView = "list" | "info" | "quiz"

const view           = ref<FlowView>("list")
const selectedQuiz   = ref<QuizIn | null>(null)
const selectedContext = ref<ContextIn | null>(null)
const selectedMode   = ref<QuizMode>("practice")
const examQuestionLimit = ref<number>(15)
const selectedClusterId = ref<number | null>(null)


export function useQuizFlow() {
    const { t } = useI18n()

    const openInfo = async (quiz: QuizIn) => {
        selectedQuiz.value    = quiz
        selectedContext.value = null
        selectedMode.value    = "practice"
        selectedClusterId.value = null
        view.value            = "info"
    }

    const openQuiz = () => {
        if (!selectedQuiz.value) return
        view.value = "quiz"
    }

    const backToList = () => {
        view.value            = "list"
        selectedQuiz.value    = null
        selectedContext.value = null
        selectedMode.value    = "practice"
        selectedClusterId.value = null
    }

    const backToInfo = () => {
        view.value = "info"
    }

    const selectContext = (ctx: ContextIn | null) => {
        selectedContext.value = ctx
    }

    const selectMode = (mode: QuizMode) => {
        selectedMode.value = mode
    }

    const setExamLimit = (limit: number) => {
        examQuestionLimit.value = limit
    }

    const trainCluster = (clusterId: number) => {
        selectedClusterId.value = clusterId
        selectedMode.value = "practice"
        view.value = "quiz"
    }

    const startReview = () => {
        selectedClusterId.value = null
        selectedMode.value = "review" as QuizMode
        view.value = "quiz"
    }

    const startLabel = computed(() => {
        if (selectedMode.value === 'adaptive') return t("quiz.startAdaptive")
        if (selectedMode.value === 'exam') return t("quiz.startExam")
        if (selectedContext.value) return t("quiz.startWithContext")
        return t("quiz.startTest")
    })

    return {
        view,
        selectedQuiz,
        selectedContext,
        selectedMode,
        examQuestionLimit,
        selectedClusterId,
        startLabel,
        openInfo,
        openQuiz,
        backToList,
        backToInfo,
        selectContext,
        selectMode,
        setExamLimit,
        trainCluster,
        startReview,
    }
}