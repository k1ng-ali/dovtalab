<template>
  <button
      class="tg-btn"
      :class="{ 'tg-btn--loading': isLoading }"
      :disabled="isLoading"
      @click="handleClick"
  >
    <span class="tg-btn__inner">
      <transition name="tg-fade" mode="out-in">
        <span v-if="isLoading" key="loading" class="tg-btn__content">
          <span class="tg-btn__spinner" />
          <span>{{ loadingText }}</span>
        </span>
        <span v-else key="idle" class="tg-btn__content">
          <TelegramIcon class="tg-btn__icon" />
          <span>{{ label }}</span>
        </span>
      </transition>
    </span>
  </button>
</template>

<script setup lang="ts">
import { useTelegramLogin } from './composables/useTelegramLogin.ts'
import { useAuthStore } from './store'
import TelegramIcon from './TelegramIcon.vue'

interface Props {
  label?: string
  loadingText?: string
}

const props = withDefaults(defineProps<Props>(), {
  label: 'Войти через Telegram',
  loadingText: 'Подключение...',
})

const emit = defineEmits<{
  success: []
  error: [message: string]
}>()

const authStore = useAuthStore()
const { isLoading, openLoginPopup } = useTelegramLogin()

async function handleClick() {
  try {
    const { code, nonce, code_verifier } = await openLoginPopup()
    await authStore.loginWithTelegram({ code, nonce, code_verifier })
    emit('success')
    console.log("sucessed")
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Ошибка входа'
    emit('error', msg)
  }
}
</script>

<style scoped lang="scss">
.tg-btn {
  --tg-blue: #2AABEE;
  --tg-blue-hover: #1a96d4;
  --tg-blue-active: #0e82be;

  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  height: 50px;
  background: var(--tg-blue);
  color: #fff;
  border: none;
  border-radius: 10px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  overflow: hidden;
  transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
  box-shadow: 0 2px 8px rgba(42, 171, 238, 0.35);
  user-select: none;
}

.tg-btn:hover:not(:disabled) {
  background: var(--tg-blue-hover);
  box-shadow: 0 4px 14px rgba(42, 171, 238, 0.45);
}

.tg-btn:active:not(:disabled) {
  background: var(--tg-blue-active);
  transform: scale(0.98);
}

.tg-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.tg-btn__inner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 11px 22px;
  min-width: 220px;
  min-height: 44px;
}

.tg-btn__content {
  display: inline-flex;
  align-items: center;
  gap: 9px;
}

.tg-btn__icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* Spinner */
.tg-btn__spinner {
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: tg-spin 0.7s linear infinite;
  flex-shrink: 0;
}

@keyframes tg-spin {
  to { transform: rotate(360deg); }
}

/* Transition */
.tg-fade-enter-active,
.tg-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.tg-fade-enter-from {
  opacity: 0;
  transform: translateY(4px);
}
.tg-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>