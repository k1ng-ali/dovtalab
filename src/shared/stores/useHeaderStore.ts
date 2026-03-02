import { defineStore } from "pinia"
import { markRaw, type Component } from "vue"

export interface HeaderAction {
    icon?: Component
    label?: string
    onClick: () => void
}

export const useHeaderStore = defineStore("header", {
    state: () => ({
        title: "Тесты" as string,
        leftAction: null as HeaderAction | null,
        rightAction: null as HeaderAction | null,
        is_visible: true,
    }),

    actions: {
        setTitle(title: string) {
            this.title = title
        },

        setLeftAction(action: HeaderAction | null) {
            this.leftAction = action
                ? { ...action, icon: action.icon ? markRaw(action.icon) : undefined }
                : null
        },

        setRightAction(action: HeaderAction | null) {
            this.rightAction = action
                ? { ...action, icon: action.icon ? markRaw(action.icon) : undefined }
                : null
        },

        setIsVisible(isVisible: boolean) {
            this.is_visible = isVisible
        },

        /** Сброс к дефолтному состоянию (список квизов) */
        reset() {
            this.title = "Тесты"
            this.leftAction = null
            this.rightAction = null
        },
    },
})