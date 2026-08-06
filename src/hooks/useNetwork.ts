import { ref, onMounted, onUnmounted } from 'vue'
import { message } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'

export function useNetwork() {
    const { t } = useI18n()
    const isOnline = ref(navigator.onLine)

    const updateStatus = () => {
        isOnline.value = navigator.onLine
        if (!isOnline.value) {
            message.error(t('network.offline'))
        } else {
            message.success(t('network.online'))
        }
    }

    onMounted(() => {
        window.addEventListener('online', updateStatus)
        window.addEventListener('offline', updateStatus)
    })

    onUnmounted(() => {
        window.removeEventListener('online', updateStatus)
        window.removeEventListener('offline', updateStatus)
    })

    return { isOnline }
}