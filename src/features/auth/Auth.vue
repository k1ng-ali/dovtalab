<script setup lang="ts">
import TelegramLoginButton from "@/features/auth/TelegramLoginButton.vue";
import { useRouter } from 'vue-router'
import {onMounted, reactive, ref} from "vue";
import type {SuperUser} from "./types.ts"
import {useAuthStore} from "@/features/auth/store.ts";
import { message } from 'ant-design-vue'
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import { useI18n } from 'vue-i18n'
import LangSwitch from "@/shared/components/LangSwitch.vue";
import logoSvg from '@/assets/logo.svg'

const { t } = useI18n()
const router = useRouter()
const authStore = useAuthStore()

// ── State ──
const isAccessMode = ref<boolean>(false)
const isSubmitting = ref<boolean>(false)
const formState = reactive<SuperUser>({
  access_code: ''
})

const FEATURES = [
  { icon: '📚', key: 'auth.featureQuizzes' },
  { icon: '⚔️', key: 'auth.featureDuels' },
  { icon: '🏆', key: 'auth.featureRating' },
]

// ── Actions ──
async function onSuccess() {
  await router.push('/')
}

const openMiniApp = () => {
  window.open('https://t.me/Dovtalabbot/dovtalab_app', '_blank')
}

const toggleAccess = () => {
  isAccessMode.value = !isAccessMode.value
  formState.access_code = ''
}

const accessLogin = async () => {
  if (formState.access_code.trim() === '' || isSubmitting.value) return
  isSubmitting.value = true
  try {
    await authStore.accessPass(formState)
    message.success(t('auth.success'))
    await router.push('/')
  } catch (error: any) {
    message.error(error.response?.data?.detail || t('auth.invalidCode'))
    formState.access_code = ''
  } finally {
    isSubmitting.value = false
  }
}

onMounted(async () =>{
  if (Capacitor.isNativePlatform()) {
    try {
      await SystemBars.setStyle({ style: SystemBarsStyle.Light})
    } catch (e) {
      console.error(e)
    }
  }
})
</script>

<template>
  <div class="auth">
    <div class="auth__bg" aria-hidden="true">
      <span class="blob blob--teal" />
      <span class="blob blob--navy" />
      <span class="blob blob--light" />
    </div>

    <div class="auth__top">
      <LangSwitch />
    </div>

    <div class="auth__body">
      <!-- Логотип и приветствие -->
      <div class="hero">
        <div class="hero__logo-wrap">
          <div class="hero__glow" />
          <img :src="logoSvg" alt="Dovtalab" class="hero__logo" />
        </div>
        <p class="hero__welcome">{{ $t('auth.welcome') }}</p>
        <h1 class="hero__brand">Dovtalab</h1>
        <p class="hero__subtitle">{{ $t('auth.subtitle') }}</p>

        <div class="features">
          <span v-for="f in FEATURES" :key="f.key" class="features__chip">
            <span class="features__icon">{{ f.icon }}</span>
            {{ $t(f.key) }}
          </span>
        </div>
      </div>

      <Transition name="slide" mode="out-in">
        <!-- 1. Вход через Telegram -->
        <div v-if="!isAccessMode" key="main" class="card">
          <TelegramLoginButton
              class="auth__tg"
              :label="$t('auth.telegramLogin')"
              :loading-text="$t('auth.connecting')"
              @success="onSuccess"
          />

          <div class="divider"><span>{{ $t('auth.or') }}</span></div>

          <button class="btn btn--outline" type="button" @click="openMiniApp">
            <svg class="btn__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="5" y="2" width="14" height="20" rx="3" />
              <line x1="11" y1="18" x2="13" y2="18" />
            </svg>
            {{ $t('auth.openMiniApp') }}
          </button>

          <button class="link-btn" type="button" @click="toggleAccess">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="7.5" cy="15.5" r="4.5" />
              <path d="M10.7 12.3 21 2M16 7l3 3M19 4l2 2" />
            </svg>
            {{ $t('auth.accessCodeLink') }}
          </button>
        </div>

        <!-- 2. Вход по коду доступа -->
        <form v-else key="access" class="card" @submit.prevent="accessLogin">
          <div class="card__head">
            <button class="icon-btn" type="button" :aria-label="$t('common.back')" @click="toggleAccess">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <h2 class="card__title">{{ $t('auth.accessTitle') }}</h2>
          </div>
          <p class="card__desc">{{ $t('auth.accessDesc') }}</p>

          <label class="field">
            <svg class="field__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <input
                v-model="formState.access_code"
                class="field__input"
                type="text"
                autocomplete="one-time-code"
                autocapitalize="off"
                spellcheck="false"
                :placeholder="$t('auth.accessPlaceholder')"
            />
          </label>

          <button
              class="btn btn--primary"
              type="submit"
              :disabled="formState.access_code.trim() === '' || isSubmitting"
          >
            <span v-if="isSubmitting" class="spinner" />
            {{ $t('auth.signIn') }}
          </button>
        </form>
      </Transition>
    </div>

    <p class="auth__policy">
      {{ $t('auth.agreePrefix') }}
      <router-link to="/privacy">{{ $t('auth.policyLink') }}</router-link>
    </p>
  </div>
</template>

<style scoped lang="scss">
/* ═══ AUTH SCREEN ═══ */
.auth {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  padding: calc(12px + var(--sat, 0px)) 16px calc(16px + var(--sab, 0px));
  box-sizing: border-box;
  background: linear-gradient(160deg, #e8f4f8 0%, #f0f7ff 50%, #eef6f7 100%);

  &__bg {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  &__top {
    position: relative;
    z-index: 1;
    display: flex;
    justify-content: flex-end;
  }

  &__body {
    position: relative;
    z-index: 1;
    flex: 1;
    width: 100%;
    max-width: 400px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 24px;
    padding: 16px 0;
  }

  &__policy {
    position: relative;
    z-index: 1;
    max-width: 320px;
    margin: 0 auto;
    text-align: center;
    font-size: 12px;
    line-height: 1.5;
    color: #9CA3AF;

    a {
      color: #234970;
      font-weight: 600;
      text-decoration: none;
      border-bottom: 1px solid rgba(35, 73, 112, 0.3);
      transition: all 0.2s ease;

      &:hover { color: var(--c-teal-600); border-color: var(--c-teal-600); }
    }
  }
}

/* ── Фоновые пятна ──────────────────────────── */
.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  animation: blob-float 12s ease-in-out infinite;

  &--teal {
    width: 340px;
    height: 340px;
    top: -110px;
    right: -120px;
    background: #4EBEC2;
    opacity: 0.45;
  }

  &--navy {
    width: 300px;
    height: 300px;
    bottom: -100px;
    left: -130px;
    background: #234970;
    opacity: 0.2;
    animation-delay: -4s;
  }

  &--light {
    width: 200px;
    height: 200px;
    top: 40%;
    left: 55%;
    background: #a5e3e5;
    opacity: 0.35;
    animation-delay: -8s;
  }
}

@keyframes blob-float {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(-20px, 20px) scale(1.08); }
}

/* ── Hero ───────────────────────────────────── */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;

  &__logo-wrap {
    position: relative;
    width: 108px;
    height: 108px;
    display: grid;
    place-items: center;
    margin-bottom: 12px;
    animation: logo-float 3s ease-in-out infinite;
  }

  &__glow {
    position: absolute;
    inset: 0;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(78, 190, 194, 0.3) 0%, transparent 70%);
    animation: glow-pulse 2.5s ease-in-out infinite;
  }

  &__logo {
    position: relative;
    width: 84px;
    height: 84px;
    object-fit: contain;
    filter: drop-shadow(0 6px 14px rgba(35, 73, 112, 0.18));
  }

  &__welcome {
    margin: 0;
    font-size: 15px;
    font-weight: 500;
    color: #6B7280;
  }

  &__brand {
    margin: 0;
    font-size: 38px;
    font-weight: 800;
    letter-spacing: -1px;
    line-height: 1.15;
    background: var(--grad-primary);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  &__subtitle {
    max-width: 320px;
    margin: 8px 0 0;
    font-size: 14px;
    line-height: 1.55;
    color: #6B7280;
  }
}

@keyframes logo-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

@keyframes glow-pulse {
  0%, 100% { transform: scale(1); opacity: 0.6; }
  50% { transform: scale(1.15); opacity: 1; }
}

/* ── Features ───────────────────────────────── */
.features {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 8px;
  margin-top: 18px;

  &__chip {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 13px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.7);
    border: 1px solid rgba(255, 255, 255, 0.9);
    backdrop-filter: blur(10px);
    box-shadow: 0 2px 10px rgba(35, 73, 112, 0.06);
    font-size: 13px;
    font-weight: 600;
    color: #234970;
  }

  &__icon { font-size: 15px; }
}

/* ── Card ───────────────────────────────────── */
.card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 22px 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 24px;
  box-shadow: 0 10px 32px rgba(35, 73, 112, 0.1);

  &__head {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  &__title {
    margin: 0;
    font-size: 19px;
    font-weight: 700;
    color: #234970;
  }

  &__desc {
    margin: 0 0 4px;
    font-size: 14px;
    line-height: 1.5;
    color: #6B7280;
  }
}

/* Кнопка Telegram — растягиваем и делаем pill (корневой элемент дочернего компонента) */
.auth .auth__tg {
  width: 100%;
  height: 52px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(42, 171, 238, 0.35);

  &:active:not(:disabled) { transform: scale(0.97); }
}

/* ── Divider ────────────────────────────────── */
.divider {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 1px;

  &::before,
  &::after {
    content: '';
    flex: 1;
    height: 1px;
    background: rgba(35, 73, 112, 0.1);
  }
}

/* ── Buttons ────────────────────────────────── */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 52px;
  border-radius: 30px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;

  &:active:not(:disabled) { transform: scale(0.97); }

  &__icon {
    width: 20px;
    height: 20px;
  }

  &--outline {
    background: rgba(255, 255, 255, 0.9);
    border: 1.5px solid rgba(35, 73, 112, 0.15);
    color: #234970;

    &:hover { border-color: var(--c-teal-600); background: #fff; }
  }

  &--primary {
    margin-top: 4px;
    border: none;
    background: var(--grad-primary);
    color: #fff;
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }
  }
}

.link-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 2px;
  padding: 6px;
  border: none;
  background: none;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  color: #6B7280;
  cursor: pointer;
  transition: color 0.2s ease;

  svg { width: 16px; height: 16px; }
  &:hover { color: #234970; }
}

.icon-btn {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: rgba(35, 73, 112, 0.06);
  color: #234970;
  cursor: pointer;
  transition: all 0.2s ease;

  svg { width: 18px; height: 18px; }
  &:active { transform: scale(0.92); }
}

/* ── Field ──────────────────────────────────── */
.field {
  display: flex;
  align-items: center;
  gap: 10px;
  height: 52px;
  padding: 0 16px;
  border-radius: 16px;
  background: #fff;
  border: 1.5px solid rgba(35, 73, 112, 0.12);
  transition: all 0.2s ease;

  &:focus-within {
    border-color: var(--c-teal-600);
    box-shadow: 0 0 0 4px rgba(78, 190, 194, 0.15);
  }

  &__icon {
    width: 20px;
    height: 20px;
    flex-shrink: 0;
    color: #9CA3AF;
  }

  &__input {
    flex: 1;
    min-width: 0;
    height: 100%;
    border: none;
    outline: none;
    background: transparent;
    font-family: inherit;
    font-size: 16px;
    letter-spacing: 1px;
    color: #222;

    &::placeholder {
      color: #9CA3AF;
      letter-spacing: 0;
    }
  }
}

.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #fff;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Transition ─────────────────────────────── */
.slide-enter-active,
.slide-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.slide-enter-from { opacity: 0; transform: translateX(24px); }
.slide-leave-to { opacity: 0; transform: translateX(-24px); }

/* ── Низкие экраны ──────────────────────────── */
@media (max-height: 680px) {
  .hero__logo-wrap { width: 84px; height: 84px; margin-bottom: 6px; }
  .hero__logo { width: 64px; height: 64px; }
  .hero__brand { font-size: 32px; }
  .features { margin-top: 12px; }
  .auth__body { gap: 16px; }
}

@media (min-width: 768px) {
  .card { padding: 28px 26px; }
}
</style>
