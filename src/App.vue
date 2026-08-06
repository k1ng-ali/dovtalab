<script setup lang="ts">
import Navigator from "@/features/navigator/Navigator.vue";
import { useAuthStore } from "@/features/auth/store.ts";
import Header from "@/features/quizPage/header/Header.vue";
import {onMounted, onUnmounted, ref, watch} from "vue"
import { useRouter } from 'vue-router'
import Auth from "@/features/auth/Auth.vue";
import { useTelegramEnv } from '@/features/auth/composables/useTelegramEnv'
import { http } from "./shared/api/http";
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import { Browser } from '@capacitor/browser'
import { consumePkceParams } from '@/features/auth/composables/useTelegramLogin'
import {useNetwork} from "@/hooks/useNetwork.ts";
import { StatusBar, Style } from '@capacitor/status-bar';
import logoSvg from '@/assets/logo.svg'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const { isTelegramEnv, getInitData } = useTelegramEnv()

const authStore = useAuthStore()
const router = useRouter()

// Сохраняем путь СИНХРОННО при создании компонента — до любых await и до того,
// как initializeApp() может вызвать router.replace('/').
// window.location уже содержит правильный путь благодаря history.replaceState в index.html.
const intendedPath = window.location.pathname + window.location.search + window.location.hash

// Просто вызываем. Хук сам зарегистрирует onMounted/onUnmounted внутри App.vue
const { isOnline } = useNetwork()

// ── Splash screen state ──
const isInitializing = ref(true)
const connectionError = ref(false)
const connectionErrorMessage = ref('')

function handleRetry() {
  connectionError.value = false
  connectionErrorMessage.value = ''
  isInitializing.value = true
  initializeApp()
}


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

  /*
  const redirectBase = nativeRedirectUri
      ?.split('?')[0]
      ?.replace(/\/$/, '')

  if (!redirectBase || !url.startsWith(redirectBase)) return */

  if (!url.startsWith('com.dovtalab.app://')) return

  // ── НАШЕ ДОБАВЛЕНИЕ: Проверяем, был ли совершен клик по кнопке ──
  const isWaiting = localStorage.getItem('is_waiting_tg_oauth')
  if (isWaiting !== 'true') {
    log('Игнорируем диплинк: приложение не находится в активном ожидании авторизации.')
    return
  }

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
    localStorage.removeItem('is_waiting_tg_oauth') // Сбрасываем флаг
    return
  }

  if (!code || error) {
    log('invalid callback')
    authStore.setError(error || 'NO_CODE')
    localStorage.removeItem('is_waiting_tg_oauth') // Сбрасываем флаг
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
  } finally {
    // В любом случае очищаем флаг ожидания авторизации
    localStorage.removeItem('is_waiting_tg_oauth')
  }
}

// ── Network availability check (reliable on Capacitor) ────────────────────────

async function checkNetworkAvailable(): Promise<boolean> {
  // Быстрая проверка: если navigator.onLine=false — точно нет сети
  if (!navigator.onLine) return false

  // В Telegram Mini App и обычном браузере navigator.onLine достаточно надёжен.
  // Дополнительный запрос к /health делаем только на нативных платформах (Capacitor Android/iOS),
  // где navigator.onLine может возвращать true даже без реального интернета.
  if (!Capacitor.isNativePlatform()) {
    return true
  }

  // На Capacitor Android navigator.onLine ненадёжен.
  // Используем «чистый» axios без interceptors для проверки сети.
  // CapacitorHttp перехватит это нативно — работает и на Android.
  try {
    const baseUrl = import.meta.env.VITE_API_URL ?? "https://api.dovtalab.app"
    const { default: axios } = await import('axios')
    await axios.get(`${baseUrl}/health`, { timeout: 5000 })
    return true
  } catch {
    return false
  }
}

// ── Initialization logic (extracted for retry support) ────────────────────────

async function initializeApp() {
  // Проверяем подключение к сети
  // На Capacitor Android navigator.onLine ненадёжен — всегда true если Wi-Fi включён.
  // Используем дополнительную проверку через быстрый HEAD-запрос.
  const isNetworkAvailable = await checkNetworkAvailable()
  if (!isNetworkAvailable) {
    connectionError.value = true
    connectionErrorMessage.value = t('splash.noInternet')
    isInitializing.value = false
    return
  }

  // 0. Dev bypass
  if (import.meta.env.VITE_DEV_MODE === 'true') {
    try {
      const { data } = await http.post('/auth/dev-login', {user_id: 1})
      authStore.accessToken = data.access_token
      localStorage.setItem('access_token', data.access_token)
      authStore.status = 'authenticated'
      await router.replace(intendedPath)
    } catch (e: any) {
      if (!e.response || e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED') {
        connectionError.value = true
        connectionErrorMessage.value = t('splash.serverUnavailable')
      } else {
        authStore.setError("error")
      }
    }
    isInitializing.value = false
    return
  }

  // 1. Уже есть accessToken в памяти
  if (authStore.accessToken) {
    isInitializing.value = false
    return
  }

  // 2. Telegram Mini App — initData есть, сразу логиним
  if (isTelegramEnv) {
    const initData = getInitData()!

    try {
      await authStore.login(initData)
      await router.replace(intendedPath)
    } catch (e: any) {
      if (!e.response || e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED') {
        connectionError.value = true
        connectionErrorMessage.value = t('splash.serverUnavailable')
      } else {
        authStore.setError("error")
      }
    }
    isInitializing.value = false
    return
  }

  // 3. Обычный браузер — пробуем тихий рефреш (есть кука)
  try {
    await authStore.refresh()
    await router.replace(intendedPath)
  } catch (e: any) {
    if (!e.response || e.code === 'ERR_NETWORK' || e.code === 'ECONNABORTED') {
      connectionError.value = true
      connectionErrorMessage.value = t('splash.serverUnavailable')
    } else {
      authStore.setError("error")
    }
  }
  isInitializing.value = false
}

// ── onMounted ─────────────────────────────────────────────────────────────────

onMounted(async () => {
  // В App.vue или main.ts
  if (Capacitor.isNativePlatform()) {
    await StatusBar.setOverlaysWebView({ overlay: true });
    await StatusBar.setStyle({ style: Style.Dark });
    await StatusBar.setBackgroundColor({ color: '#00000000' });
  }

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

  await initializeApp()
})

onUnmounted(() => {
  urlOpenListener?.()
})
</script>

<template>
  <!-- ═══ Splash Screen (начальная загрузка) ═══ -->
  <Transition name="splash-fade">
    <div v-if="isInitializing" class="splash">
      <div class="splash-content">
        <div class="splash-logo-wrapper">
          <img :src="logoSvg" alt="Dovtalab" class="splash-logo-img" />
          <div class="splash-glow" />
        </div>
        <div class="splash-brand">Dovtalab</div>
        <div class="splash-loader">
          <div class="splash-loader-bar" />
        </div>
        <p class="splash-subtitle">{{ $t('splash.subtitle') }}</p>
      </div>
    </div>
  </Transition>

  <!-- ═══ Экран ошибки подключения ═══ -->
  <Transition name="splash-fade">
    <div v-if="!isInitializing && connectionError" class="splash splash--error">
      <div class="splash-content">
        <div class="splash-logo-wrapper">
          <img :src="logoSvg" alt="Dovtalab" class="splash-logo-img splash-logo-img--dim" />
        </div>

        <div class="error-card">
          <div class="error-icon-circle">
            <svg class="error-icon-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="1" y1="1" x2="23" y2="23"/>
              <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
              <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
              <path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>
              <path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>
              <line x1="12" y1="20" x2="12.01" y2="20"/>
            </svg>
          </div>
          <h2 class="error-title">{{ connectionErrorMessage }}</h2>
          <p class="error-desc">
            {{ !isOnline
              ? $t('splash.checkWifi')
              : $t('splash.serverDown')
            }}
          </p>
          <button class="error-retry-btn" @click="handleRetry">
            <svg class="retry-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="23 4 23 10 17 10"/>
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
            </svg>
            {{ $t('common.retry') }}
          </button>
        </div>
      </div>
    </div>
  </Transition>

  <!-- ═══ Ошибка авторизации (показываем Auth экран) ═══ -->
  <Transition name="fade">
    <div v-if="!isInitializing && !connectionError && authStore.status === 'error'">
      <Auth/>
    </div>
  </Transition>

  <!-- ═══ Основной контент ═══ -->
  <Transition name="fade">
    <div v-if="!isInitializing && !connectionError && authStore.isAuthenticated" class="layout">
      <Header />
      <main class="content">
        <router-view />
      </main>
      <Navigator />
    </div>
  </Transition>

  <!-- ═══ Offline badge (при потере сети во время работы) ═══ -->
  <Transition name="slide-down">
    <div v-if="!isInitializing && !connectionError && authStore.isAuthenticated && !isOnline" class="offline-banner">
      <svg class="offline-banner-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <line x1="1" y1="1" x2="23" y2="23"/>
        <path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>
        <path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>
      </svg>
      <span>{{ $t('splash.offlineBanner') }}</span>
    </div>
  </Transition>
</template>

<style scoped>
/* ── Transitions ── */
.fade-enter-active,
.fade-leave-active { transition: opacity 0.35s ease; }
.fade-enter-from,
.fade-leave-to     { opacity: 0; }

.page-enter-active,
.page-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.page-enter-from {
  opacity: 0;
  transform: translateY(8px);
}
.page-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

.splash-fade-enter-active { transition: opacity 0.3s ease; }
.splash-fade-leave-active { transition: opacity 0.5s ease 0.1s; }
.splash-fade-enter-from,
.splash-fade-leave-to     { opacity: 0; }

.slide-down-enter-active,
.slide-down-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.slide-down-enter-from,
.slide-down-leave-to { transform: translateY(-100%); opacity: 0; }

/* ═══════════════════════════════════════════════════════════════
   SPLASH SCREEN
   ═══════════════════════════════════════════════════════════════ */
.splash {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(160deg, #e8f4f8 0%, #f0f7ff 50%, #eef6f7 100%);
  z-index: 1000;
}

.splash-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 32px;
}

/* ── Logo ── */
.splash-logo-wrapper {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: logo-float 3s ease-in-out infinite;
}

.splash-logo-img {
  width: 88px;
  height: 88px;
  object-fit: contain;
  filter: drop-shadow(0 4px 12px rgba(35, 73, 112, 0.15));
  z-index: 1;
}

.splash-logo-img--dim {
  opacity: 0.5;
  animation: none;
}

.splash-glow {
  position: absolute;
  width: 110px;
  height: 110px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(78, 190, 194, 0.2) 0%, transparent 70%);
  animation: glow-pulse 2.5s ease-in-out infinite;
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes glow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* ── Brand name ── */
.splash-brand {
  font-size: 28px;
  font-weight: 700;
  color: #234970;
  letter-spacing: -0.5px;
}

/* ── Loader bar ── */
.splash-loader {
  width: 160px;
  height: 4px;
  background: rgba(35, 73, 112, 0.1);
  border-radius: 4px;
  overflow: hidden;
}

.splash-loader-bar {
  width: 40%;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #4EBEC2, #234970);
  animation: loader-slide 1.4s ease-in-out infinite;
}

@keyframes loader-slide {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(400%); }
}

/* ── Subtitle ── */
.splash-subtitle {
  margin: 0;
  font-size: 14px;
  font-weight: 400;
  color: #9CA3AF;
}

/* ═══════════════════════════════════════════════════════════════
   ERROR STATE (connection)
   ═══════════════════════════════════════════════════════════════ */
.splash--error .splash-logo-wrapper {
  animation: none;
}

.error-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 28px 24px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border-radius: 20px;
  border: 1px solid rgba(35, 73, 112, 0.08);
  box-shadow: 0 8px 32px rgba(35, 73, 112, 0.08);
  max-width: 300px;
  text-align: center;
}

.error-icon-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(239, 68, 68, 0.05));
  display: flex;
  align-items: center;
  justify-content: center;
}

.error-icon-svg {
  width: 28px;
  height: 28px;
  color: #EF4444;
}

.error-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #234970;
}

.error-desc {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
  line-height: 1.6;
}

.error-retry-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #4EBEC2, #234970);
  color: #fff;
  border: none;
  border-radius: 30px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);
  transition: transform 0.2s, box-shadow 0.2s;
}

.error-retry-btn:active {
  transform: scale(0.95);
  box-shadow: 0 2px 8px rgba(78, 190, 194, 0.3);
}

.retry-icon {
  width: 18px;
  height: 18px;
}

/* ═══════════════════════════════════════════════════════════════
   OFFLINE BANNER (during active session)
   ═══════════════════════════════════════════════════════════════ */
.offline-banner {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 16px;
  padding-top: calc(10px + var(--sat, 0px));
  background: rgba(239, 68, 68, 0.92);
  backdrop-filter: blur(8px);
  color: #fff;
  font-size: 13px;
  font-weight: 500;
  z-index: 9999;
}

.offline-banner-icon {
  width: 16px;
  height: 16px;
}

/* ── Layout ── */
.layout {
  min-height: 100%;
  margin-top: 0 !important;
}
</style>