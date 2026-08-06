import { ref, computed } from "vue"
import type { QuizIn, ContextIn, QuizMode } from "@/features/quizPage/types.ts"
import { useI18n } from 'vue-i18n'
import * as api from "@/features/quizPage/api.ts"

export type FlowView = "list" | "info" | "quiz"

const view           = ref<FlowView>("list")
const selectedQuiz   = ref<QuizIn | null>(null)
const selectedContext = ref<ContextIn | null>(null)
const selectedMode   = ref<QuizMode>("practice")
const examQuestionLimit = ref<number>(15)
const selectedClusterId = ref<number | null>(null)


// Флаг загрузки при deep-link
const isLoadingByHash = ref(false)
const hashNotFound    = ref(false)

export function useQuizFlow() {
    const { t } = useI18n()

    const openInfo = async (quiz: QuizIn) => {
        selectedQuiz.value    = quiz
        selectedContext.value = null
        selectedMode.value    = "practice"
        selectedClusterId.value = null
        view.value            = "info"
    }

    /** Deep-link: открыть QuizInfo по hash_code из URL */
    const openInfoByHash = async (hashCode: string) => {
        isLoadingByHash.value = true
        hashNotFound.value    = false
        try {
            const { data } = await api.getQuizByHash(hashCode)
            const quiz = data.find(q => q.hash_code === hashCode) ?? data[0] ?? null
            if (!quiz) {
                hashNotFound.value = true
                view.value = "list"
                return
            }
            selectedQuiz.value      = quiz
            selectedContext.value   = null
            selectedMode.value      = "practice"
            selectedClusterId.value = null
            view.value              = "info"
        } catch {
            hashNotFound.value = true
            view.value = "list"
        } finally {
            isLoadingByHash.value = false
        }
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
        isLoadingByHash,
        hashNotFound,
        startLabel,
        openInfo,
        openInfoByHash,
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