import {defineStore} from "pinia";
import {message} from "ant-design-vue";

export const useMessage = defineStore("useMessage", {
    state: () => ({
        message: message
    }),

    actions: {
        success(text:string, timeout?: number) {
            return message.success(text, timeout);
        },

        error(text:string, timeout?: number) {
            return message.error(text, timeout);
        },

        warning(text:string, timeout?: number) {
            return message.warning(text, timeout);
        },

        loading(text:string, timeout?: number) {
            return message.loading(text, timeout);
        },

        info(text:string, timeout?: number) {
            return message.info(text, timeout);
        }
    }
})