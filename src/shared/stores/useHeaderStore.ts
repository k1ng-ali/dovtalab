import { defineStore } from "pinia"
import { markRaw, type Component } from "vue"

export interface HeaderAction {
    icon?: Component
    label?: string
    onClick: () => void
}

export type NotificationType = "success" | "error"

export interface HeaderNotification {
    message: string
    type: NotificationType
}

export const useHeaderStore = defineStore("header", {
    state: () => ({
        title: "Тесты" as string,
        leftAction: null as HeaderAction | null,
        rightAction: null as HeaderAction | null,
        is_visible: true,
        notification: null as HeaderNotification | null,
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

        /**
         * Показывает уведомление поверх хидера.
         * @param message  Текст уведомления, например "Правильно 🎉" или "+10 баллов"
         * @param type     "success" — зелёный фон, "error" — красный фон
         * @param duration Время показа в мс (по умолчанию 1500)
         */
        showNotification(
            message: string,
            type: NotificationType = "success",
            duration: number = 1500,
        ) {
            this.notification = { message, type }
            setTimeout(() => {
                this.clearNotification()
            }, duration)
        },

        clearNotification() {
            this.notification = null
        },

        /** Сброс к дефолтному состоянию (список квизов) */
        reset() {
            this.title = "Тесты"
            this.leftAction = null
            this.rightAction = null
            this.notification = null
        },
    },
})