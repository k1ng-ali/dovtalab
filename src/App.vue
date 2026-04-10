<script setup lang="ts">
import Navigator from "@/features/navigator/Navigator.vue";
import { useAuthStore } from "@/features/auth/store.ts";
import Header from "@/features/quizPage/header/Header.vue";
import {onMounted, ref, watch} from "vue"
import { useRouter } from 'vue-router'
import Auth from "@/features/auth/Auth.vue";  // добавь импорт
import { useTelegramEnv } from '@/features/auth/composables/useTelegramEnv'

const { isTelegramEnv, getInitData } = useTelegramEnv()

const authStore = useAuthStore()
const router = useRouter()
// 'loading' | 'ok' | 'error'
const appState = ref<'loading' | 'ok' | 'error' | 'auth'>('loading')

// ── Debug log ──────────────────────────────────────────────────

// ───────────────────────────────────────────────────────────────

watch(() => authStore.isAuthenticated, (authenticated) => {
  if (authenticated) {
    appState.value = 'ok'
  }
})

onMounted(async () => {
  // 0. Вернулись с мобильного редиректа Telegram OAuth
  const redirectCode = sessionStorage.getItem('tg_auth_code')
  const redirectState = sessionStorage.getItem('tg_auth_state_returned')
  const savedState = sessionStorage.getItem('tg_auth_state')

  if (redirectCode) {
    sessionStorage.removeItem('tg_auth_code')
    sessionStorage.removeItem('tg_auth_state_returned')
    sessionStorage.removeItem('tg_auth_state')

    if (redirectState !== savedState) {
      appState.value = 'auth'  // State mismatch — показать экран входа
    } else {
      const nonce = sessionStorage.getItem('tg_auth_nonce') ?? ''
      const codeVerifier = sessionStorage.getItem('tg_code_verifier') ?? ''
      sessionStorage.removeItem('tg_auth_nonce')
      sessionStorage.removeItem('tg_code_verifier')

      try {
        await authStore.loginWithTelegram({ code: redirectCode, nonce, code_verifier: codeVerifier })
        appState.value = 'ok'
        await router.push('/')
      } catch {
        appState.value = 'auth'
      }
    }
    return
  }

  // 1. Уже есть accessToken в памяти
  if (authStore.accessToken) {
    appState.value = 'ok'
    await router.push('/')
    return
  }

  // 2. Есть refresh token → пробуем тихо обновить
  const refreshToken = localStorage.getItem('refresh_token')
  if (refreshToken) {
    try {
      await authStore.refresh()
      appState.value = 'ok'
      await router.push('/')
      return
    } catch {
      localStorage.removeItem('refresh_token')
    }
  }

  // 3. Telegram Mini App / встроенный браузер
  if (isTelegramEnv) {
    const initData = getInitData()!
    try {
      await authStore.login(initData)   // уже есть в store
      appState.value = 'ok'
      await router.push('/')
    } catch {
      appState.value = 'error'          // покажет экран с ошибкой
    }
    return
  }

  // 4. Обычный браузер → показываем Auth с кнопкой виджета
  appState.value = 'auth'
})
</script>

<template>

  <!-- Debug overlay (удалить после отладки)
  <div v-if="showDebug" class="debug-overlay">
    <div class="debug-header">
      <span>🛠 Debug</span>
      <button class="debug-close" @click="showDebug = false">✕</button>
    </div>
    <div class="debug-body">
      <div
          v-for="(entry, i) in logs"
          :key="i"
          class="debug-line"
          :class="entry.type"
      >
        <span class="debug-prefix">
          {{ entry.type === 'ok' ? '✓' : entry.type === 'err' ? '✗' : '·' }}
        </span>
        {{ entry.msg }}
      </div>
      <div v-if="logs.length === 0" class="debug-line info">Ожидание...</div>
    </div>
  </div> -->

  <!-- Загрузка -->
  <Transition name="fade">
    <div v-if="appState === 'loading'" class="splash">
      <div class="splash-logo">
        <div class="logo-ring" />
        <div class="logo-ring ring-2" />
        <div class="logo-ring ring-3" />
      </div>
      <p class="splash-text">Загрузка...</p>
    </div>
  </Transition>

  <!-- Ошибка авторизации -->
  <Transition name="fade">
    <div v-if="appState === 'error' || appState === 'auth'" class="error-screen">
      <Auth/>
    </div>
  </Transition>

  <!-- Основной контент -->
  <Transition name="fade">
    <div v-if="appState === 'ok'" class="layout">
      <Header />
      <main class="content">
        <router-view />
      </main>
      <Navigator />
    </div>
  </Transition>

</template>

<style scoped>
/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.35s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

/* ── Splash ── */
.splash {
  position: fixed; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 24px;
  background: linear-gradient(160deg, #e8f4f8 0%, #f0f7ff 100%);
  z-index: 100;
}
.splash-logo { position: relative; width: 72px; height: 72px; display: flex; align-items: center; justify-content: center; }
.logo-ring {
  position: absolute; border-radius: 50%;
  border: 3px solid transparent; border-top-color: #4EBEC2;
  animation: spin 1.1s linear infinite;
  width: 72px; height: 72px;
}
.ring-2 { width: 52px; height: 52px; border-top-color: #234970; animation-duration: 0.85s; animation-direction: reverse; }
.ring-3 { width: 34px; height: 34px; border-top-color: #4EBEC2; animation-duration: 1.4s; opacity: 0.6; }
@keyframes spin { to { transform: rotate(360deg); } }
.splash-text { margin: 0; font-size: 15px; font-weight: 500; color: #6B7280; }

/* ── Error ── */
.error-screen {
  position: fixed; inset: 0;
  display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  padding: 32px 28px;
  background: linear-gradient(160deg, #e8f4f8 0%, #f0f7ff 100%);
  text-align: center; z-index: 100;
}
.error-icon  { font-size: 56px; line-height: 1; }
.error-title { margin: 0; font-size: 22px; font-weight: 700; color: #234970; }
.error-desc  { margin: 0; font-size: 15px; color: #6B7280; line-height: 1.6; max-width: 280px; }
.error-btn {
  display: inline-flex; align-items: center; gap: 8px; margin-top: 8px;
  padding: 14px 28px;
  background: linear-gradient(135deg, #4EBEC2, #234970);
  color: #fff; text-decoration: none; border-radius: 30px;
  font-size: 16px; font-weight: 600;
  box-shadow: 0 4px 16px rgba(78,190,194,0.35);
  transition: transform 0.2s;
}
.error-btn:active { transform: scale(0.96); }
.btn-icon { font-size: 18px; }
.debug-toggle {
  margin-top: 8px; background: none; border: 1px solid rgba(35,73,112,0.2);
  border-radius: 20px; padding: 6px 16px; font-size: 12px; color: #9CA3AF; cursor: pointer;
}

/* ── Debug overlay ── */
.debug-overlay {
  position: fixed; bottom: 0; left: 0; right: 0;
  max-height: 45vh;
  background: rgba(15, 20, 30, 0.95);
  border-top: 1px solid rgba(78,190,194,0.3);
  border-radius: 16px 16px 0 0;
  z-index: 9999;
  display: flex; flex-direction: column;
  font-family: 'Courier New', monospace;
}
.debug-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 10px 14px;
  font-size: 12px; font-weight: 700; color: #4EBEC2;
  border-bottom: 1px solid rgba(78,190,194,0.15);
  flex-shrink: 0;
}
.debug-close {
  background: none; border: none; color: #6B7280; font-size: 14px; cursor: pointer; padding: 2px 6px;
}
.debug-body {
  overflow-y: auto; padding: 10px 14px;
  display: flex; flex-direction: column; gap: 4px;
}
.debug-line {
  font-size: 11px; line-height: 1.5; display: flex; gap: 8px;
  word-break: break-all;
}
.debug-prefix { flex-shrink: 0; width: 12px; }
.debug-line.info { color: #9CA3AF; }
.debug-line.ok   { color: #4ade80; }
.debug-line.err  { color: #f87171; font-weight: 600; }

/* ── Layout ── */
.layout { min-height: 100%; }
</style>