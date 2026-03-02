import { defineStore } from "pinia"
import { markRaw, type Component } from "vue"

export interface NavButton {
    label: string
    icon?: Component
    variant?: "default" | "primary" | "ghost"
    disabled?: boolean
    onClick: () => void
}

type NavMode = "tabs" | "actions"

export const useNavStore = defineStore("nav", {
    state: () => ({
        mode: "tabs" as NavMode,
        actions: [] as NavButton[],
    }),

    actions: {
        /** Стандартный режим — три вкладки */
        showTabs() {
            this.mode = "tabs"
            this.actions = []
        },

        /** Режим действий — произвольные кнопки вместо вкладок */
        showActions(buttons: NavButton[]) {
            this.mode = "actions"
            // markRaw чтобы Pinia не делала иконки реактивными
            this.actions = buttons.map(b => ({
                ...b,
                icon: b.icon ? markRaw(b.icon) : undefined,
            }))
        },

        updateAction(index: number, patch: Partial<NavButton>) {
            if (!this.actions[index]) return
            this.actions[index] = { ...this.actions[index], ...patch }
        },
    },
})