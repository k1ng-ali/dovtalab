import { ref, computed } from "vue"
import type { QuizIn, ContextIn } from "@/features/quizPage/types.ts"

export type FlowView = "list" | "info" | "quiz"

const view           = ref<FlowView>("list")
const selectedQuiz   = ref<QuizIn | null>(null)
const selectedContext = ref<ContextIn | null>(null)


export function useQuizFlow() {
    const openInfo = async (quiz: QuizIn) => {
        selectedQuiz.value    = quiz
        selectedContext.value = null
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
    }

    const backToInfo = () => {
        view.value = "info"
    }

    const selectContext = (ctx: ContextIn | null) => {
        selectedContext.value = ctx
    }

    const startLabel = computed(() => {
        if (selectedContext.value) return "Начать тест с контекстом"
        return "Начать тест"
    })

    return {
        view,
        selectedQuiz,
        selectedContext,
        startLabel,
        openInfo,
        openQuiz,
        backToList,
        backToInfo,
        selectContext,
    }
}