<script setup lang="ts">
import Navigator from "@/features/navigator/Navigator.vue";
import { useAuthStore } from "@/features/auth/store.ts";
import Header from "@/features/quizPage/header/Header.vue";
import {onMounted, onUnmounted, watch} from "vue"
import { useRouter } from 'vue-router'
import Auth from "@/features/auth/Auth.vue";
import { useTelegramEnv } from '@/features/auth/composables/useTelegramEnv'
import { http } from "./shared/api/http";
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { consumePkceParams } from '@/features/auth/composables/useTelegramLogin'

const { isTelegramEnv, getInitData } = useTelegramEnv()

const authStore = useAuthStore()
const router = useRouter()

// ── Обработка deep link от Telegram OAuth (только Capacitor) ──────────────────

let urlOpenListener: (() => void) | null = null

function log(...args: any[]) {
  console.log('[AUTH]', ...args)
}

watch(() => authStore.status, (v) => {
  console.log('[AUTH STORE STATUS]', v)
})

watch(() => authStore.isAuthenticated, (v) => {
  console.log('[AUTH AUTH]', v)
})

async function handleTelegramCallback(url: string) {
  // Проверяем, что это наш callback (custom scheme)
  const nativeRedirectUri = import.meta.env.VITE_TELEGRAM_REDIRECT_URI_NATIVE as string

  const redirectBase = nativeRedirectUri
      ?.split('?')[0]
      ?.replace(/\/$/, '')

  if (!redirectBase || !url.startsWith(redirectBase)) return

  // Закрываем системный браузер (если ещё открыт)
  try { await Browser.close() } catch { /* ignore */ }

  const parsed = new URL(url)
  const code   = parsed.searchParams.get('code')
  const state  = parsed.searchParams.get('state')
  const error  = parsed.searchParams.get('error')

  log('callback url:', url)
  log('parsed:', parsed.toString())
  log('code:', code)
  log('state:', state)
  log('error:', error)

  // Достаём PKCE-параметры из localStorage
  const { nonce, state: savedState, codeVerifier } = consumePkceParams()

  if (state !== savedState) {
    console.error('[App] State mismatch — возможна CSRF атака')
    return
  }

  if (!code || error) {
    log('invalid callback')
    authStore.setError(error || 'NO_CODE')
    return
  }

  try {
    await authStore.loginWithTelegram({
      code,
      nonce,
      code_verifier: codeVerifier,
      redirect_uri: nativeRedirectUri,
    })
    await router.replace('/')
  } catch {
    authStore.setError(error)
  }
}


// ── onMounted ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  // Capacitor: подписываемся на appUrlOpen ДО всей остальной логики
  if (Capacitor.isNativePlatform()) {
    const handle = await CapApp.addListener('appUrlOpen', async (event) => {
      await handleTelegramCallback(event.url)
    })
    urlOpenListener = () => handle.remove()

    // Если приложение было запущено именно этим deep link (холодный старт)
    const launch = await CapApp.getLaunchUrl()
    if (launch?.url) {
      await handleTelegramCallback(launch.url)
      return
    }
  }

  // 0. Dev bypass
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    try {
      const { data } = await http.post('/auth/dev-login')
      authStore.accessToken = data.access_token
      authStore.status = 'authenticated'
      await router.replace('/')
    } catch {
      authStore.setError("error")
    }
    return
  }

  // 1. Уже есть accessToken в памяти
  if (authStore.accessToken) {
    await router.replace('/')
    return
  }

  // 2. Telegram Mini App — initData есть, сразу логиним
  if (isTelegramEnv) {
    const initData = getInitData()!
    try {
      await authStore.login(initData)
      await router.replace('/')
    } catch {
      authStore.setError("error")
    }
    return
  }

  // 3. Обычный браузер — пробуем тихий рефреш (есть кука)
  try {
    await authStore.refresh()
    await router.replace('/')
    return
  } catch {
    authStore.setError("error")
  }
})

onUnmounted(() => {
  urlOpenListener?.()
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
    <div v-if="authStore.status === 'loading'" class="splash">
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
    <div v-if="!authStore.isAuthenticated">
      <Auth/>
    </div>
  </Transition>

  <!-- Основной контент -->
  <Transition name="fade">
    <div v-if="authStore.isAuthenticated" class="layout">
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
.layout { min-height: 100%;
  margin-top: 0 !important;
}
</style>