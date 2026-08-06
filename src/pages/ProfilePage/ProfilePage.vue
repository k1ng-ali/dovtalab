<script setup lang="ts">
import {onMounted, computed, ref} from 'vue'
import { useUserStore } from '@/features/user/store.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import {useRouter} from "vue-router";
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import {EdgeToEdge} from "@capawesome/capacitor-android-edge-to-edge-support";
import { useI18n } from 'vue-i18n'
import PassportModal from '@/features/passport/PassportModal.vue'
import ExitBoldDuotoneIcon from '@iconify-vue/solar/exit-bold-duotone';

const { t } = useI18n()
const router = useRouter()
const userStore   = useUserStore()
const headerStore = useHeaderStore()
const navStore    = useNavStore()

const passportOpen = ref(false)



onMounted(async () => {
  //headerStore.hideActions()
  headerStore.setTitle(t('profile.title'))
  headerStore.setLeftAction(null)
  headerStore.setRightAction(null)
  navStore.showTabs()

  await Promise.all([
    userStore.fetchProfile()
  ])
  //console.log(userStore.user, userStore.config, userStore.roles)

  if (Capacitor.isNativePlatform()) {
    try {
      // Исходное состояние при загрузке
      await SystemBars.setStyle({ style: SystemBarsStyle.Light})
      await EdgeToEdge.setBackgroundColor({ color: '#F6F6F6' });
    } catch (e) {
      console.error('Ошибка настройки StatusBar:', e);
    }
  }
})

const user   = computed(() => userStore.user)
const config = computed(() => userStore.config)
const is_creator = computed(() => userStore.is_creator)
const is_pro = computed(() => userStore.is_pro)

// Инициалы для фоллбэка аватара
const initials = computed(() => {
  if (!user.value) return '?'
  const f = user.value.first_name?.[0] ?? ''
  const l = user.value.last_name?.[0]  ?? ''
  return (f + l).toUpperCase() || user.value.username?.[0]?.toUpperCase() || '?'
})

// Форматирование суммарного времени в тестах
const totalTimeLabel = computed(() => {
  const t = config.value?.quiz_time ?? 0
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  if (h > 0) return `${h}ч ${m}м`
  return `${m} мин`
})

// Дата регистрации
const joinedLabel = computed(() => {
  if (!config.value?.joined_at) return '—'
  return new Date(config.value.joined_at).toLocaleDateString('ru-RU', {
    year: 'numeric', month: 'long', day: 'numeric'
  })
})

// Настройки
const timerLoading = ref(false)

const toggleTimer = async () => {
  if (!config.value) return
  timerLoading.value = true
  try {
    await userStore.patchConfig({ ...config.value, timer: !config.value.timer })
  } finally {
    timerLoading.value = false
  }
}

const languages = [
  { code: 'ru', label: 'Русский',    flag: '🇷🇺' },
  { code: 'tg', label: 'Тоҷикӣ',    flag: '🇹🇯' },
  { code: 'en', label: 'English',    flag: '🇺🇸' },
]

const langLoading = ref(false)

const setLanguage = async (code: string) => {
  if (!config.value || config.value.language === code) return
  langLoading.value = true
  try {
    await userStore.patchConfig({ ...config.value, language: code })
  } finally {
    langLoading.value = false
  }
}

const logOut = async() =>{
  await userStore.logout()
  router.push('/')
}

const avatarError = ref(false)
</script>

<template>
  <div class="profile-page">

    <!-- ── Hero ──────────────────────────────────────────────────── -->
    <div class="hero"
         :class="userStore.is_pro ? 'hero__pro' : ''"
    >
      <div class="hero-bg"
        :class="userStore.is_pro ? 'hero-bg__pro' : ''"
      />

      <ExitBoldDuotoneIcon height="24" class="sign-out-btn" @click="logOut"/>

      <div class="avatar-wrap">
        <img
            v-if="user?.avatar_url && !avatarError"
            :src="user.avatar_url"
            class="avatar"
            alt="avatar"
            @error="avatarError = true"
        />
        <div v-else class="avatar avatar--fallback">
          {{ initials }}
        </div>

        <!-- Pro badge на аватаре -->
        <div v-if="is_pro" class="avatar-badge pro">PRO</div>
      </div>

      <div class="hero-info">
        <div class="name-row">
          <h2 class="name">
            {{ user?.first_name }} {{ user?.last_name }}
          </h2>
          <span v-if="is_creator" class="badge creator">✦ Creator</span>
        </div>
        <p class="username" v-if="user?.username">@{{ user.username }}</p>
        <p class="joined">{{ t('profile.memberSince', { date: joinedLabel }) }}</p>
      </div>
    </div>

    <!-- ── Passport button ───────────────────────────────────────── -->
    <div class="section">
      <button class="passport-btn" @click="passportOpen = true">
        <span class="passport-btn__icon">🪪</span>
        <div class="passport-btn__text">
          <span class="passport-btn__title">Мой паспорт</span>
          <span class="passport-btn__sub">Поделиться карточкой профиля</span>
        </div>
        <span class="passport-btn__arrow">›</span>
      </button>
    </div>

    <!-- ── Статистика ─────────────────────────────────────────────── -->
    <section class="section">
      <h3 class="section-title">{{ t('profile.statsSection') }}</h3>
      <div class="stats-grid">

        <div class="stat-card">
          <div class="stat-icon">🏆</div>
          <div class="stat-body">
            <span class="stat-value">{{ config?.quiz_count ?? 0 }}</span>
            <span class="stat-label">{{ t('profile.testsCompleted') }}</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon">⏱</div>
          <div class="stat-body">
            <span class="stat-value">{{ totalTimeLabel }}</span>
            <span class="stat-label">{{ t('profile.timeInTests') }}</span>
          </div>
        </div>

        <div class="stat-card stat-card--wide" v-if="config?.is_active !== undefined">
          <div class="stat-icon">{{ config?.is_active ? '🟢' : '⚪' }}</div>
          <div class="stat-body">
            <span class="stat-value">{{ config?.is_active ? t('profile.accountActive') : t('profile.accountInactive') }}</span>
            <span class="stat-label">{{ t('profile.accountStatus') }}</span>
          </div>
        </div>

      </div>
    </section>

    <!-- ── Настройки ──────────────────────────────────────────────── -->
    <section class="section">
      <h3 class="section-title">{{ t('profile.settingsSection') }}</h3>

      <!-- Таймер -->
      <div class="setting-card">
        <div class="setting-left">
          <span class="setting-icon">⏱</span>
          <div class="setting-text">
            <span class="setting-name">{{ t('profile.timerName') }}</span>
            <span class="setting-desc">{{ t('profile.timerDesc') }}</span>
          </div>
        </div>
        <button
            class="toggle"
            :class="{ on: config?.timer, loading: timerLoading }"
            :disabled="timerLoading"
            @click="toggleTimer"
            :aria-label="t('profile.timerName')"
        >
          <div class="toggle-thumb" />
        </button>
      </div>

      <!-- Язык -->
      <div class="setting-card setting-card--column">
        <div class="setting-left">
          <span class="setting-icon">🌐</span>
          <div class="setting-text">
            <span class="setting-name">{{ t('profile.languageName') }}</span>
            <span class="setting-desc">{{ t('profile.languageDesc') }}</span>
          </div>
        </div>

        <div class="lang-pills" :class="{ loading: langLoading }">
          <button
              v-for="lang in languages"
              :key="lang.code"
              class="lang-pill"
              :class="{ active: config?.language === lang.code }"
              @click="setLanguage(lang.code)"
          >
            <span class="lang-flag">{{ lang.flag }}</span>
            <span class="lang-label">{{ lang.label }}</span>
          </button>
        </div>
      </div>
    </section>

    <!-- ── Скелетон ───────────────────────────────────────────────── -->
    <div v-if="!user" class="skeleton-wrap">
      <div class="skeleton-hero" />
      <div class="skeleton-card" />
      <div class="skeleton-card" />
    </div>

  </div>

  <!-- ── Passport modal ── -->
  <PassportModal :open="passportOpen" @close="passportOpen = false" />
</template>

<style scoped lang="scss">
.profile-page {
  padding-top: 80px;
  padding-bottom: 110px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  min-height: 100vh;
  background: #F6F6F6;
  max-width: 900px;
  margin: 0 auto;   // ← вместо margin-left: calc(...)
  width: 100%;
}

/* ── Hero ── */
.hero {
  position: relative;
  margin: 0 16px;
  padding: 28px 20px 24px;
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(14px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  box-shadow: 0 8px 32px rgba(35, 73, 112, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  overflow: hidden;

  &__pro {
    border: 1px solid rgba(124, 58, 237, 0.2);
  }
}

.sign-out-btn {
  position: absolute;
  right: 20px;
  top: 20px;
  width: 40px;
  height: 40px;
  background: #f4f4f4;
  border-radius: 7px;
  border: 1px solid rgba(107, 114, 128, 0.1);
  border-block-start-color: white;
  border-block-end-color: white;
  box-shadow: 0 0 10px rgb(73, 112, 85, 0.3);
  padding: 5px;
  padding-left: 7px;
  color: rgba(35, 73, 112, 1);
  cursor: pointer;
}

.hero-bg {
  position: absolute;
  inset: 0;
  background: radial-gradient(
          ellipse 80% 60% at 50% -10%,
          rgba(78, 190, 194, 0.18) 0%,
          transparent 70%
  );
  pointer-events: none;

  &__pro {
    background: radial-gradient(
            ellipse 80% 60% at 50% -10%,
            rgba(124, 58, 237, 0.2) 0%,
            transparent 70%
    );
  }
}

.avatar-wrap {
  position: relative;
}

.avatar {
  width: 88px;
  height: 88px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid rgba(255, 255, 255, 1);
  box-shadow: 0 6px 20px rgba(35, 73, 112, 0.18);

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #4EBEC2, #234970);
    color: #fff;
    font-size: 30px;
    font-weight: 700;
    letter-spacing: -1px;
  }
}

.avatar-badge {
  position: absolute;
  bottom: 2px;
  right: -2px;
  padding: 2px 7px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  border: 2px solid #fff;

  &.pro {
    background: linear-gradient(135deg, #f59e0b, #ef4444);
    color: #fff;
  }
}

.hero-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.name {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #234970;
}

.badge {
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;

  &.creator {
    background: rgba(78, 190, 194, 0.18);
    color: #234970;
    border: 1px solid rgba(78, 190, 194, 0.4);
  }
}

.username {
  margin: 0;
  font-size: 14px;
  color: #9CA3AF;
  font-weight: 500;
}

.joined {
  margin: 0;
  font-size: 12px;
  color: #C0C6CF;
}

/* ── Section ── */
.section {
  padding: 0 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.section-title {
  margin: 0;
  font-size: 13px;
  font-weight: 700;
  color: #9CA3AF;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 0 4px;
}

/* ── Stats ── */
.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);

  &--wide {
    grid-column: 1 / -1;
  }
}

.stat-icon {
  font-size: 28px;
  flex-shrink: 0;
}

.stat-body {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-value {
  font-size: 20px;
  font-weight: 800;
  color: #234970;
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: #9CA3AF;
  font-weight: 500;
}

/* ── Setting cards ── */
.setting-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 18px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
  gap: 12px;

  &--column {
    flex-direction: column;
    align-items: stretch;
    gap: 14px;
  }
}

.setting-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-icon {
  font-size: 22px;
  flex-shrink: 0;
}

.setting-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-name {
  font-size: 15px;
  font-weight: 600;
  color: #234970;
}

.setting-desc {
  font-size: 12px;
  color: #9CA3AF;
}

/* ── Toggle switch ── */
.toggle {
  position: relative;
  width: 52px;
  height: 30px;
  border-radius: 30px;
  border: none;
  background: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: background 0.25s ease;
  flex-shrink: 0;
  padding: 0;

  &.on {
    background: linear-gradient(135deg, #4EBEC2, #234970);
  }

  &.loading {
    opacity: 0.6;
    cursor: wait;
  }

  &:active:not(.loading) {
    transform: scale(0.95);
  }
}

.toggle-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);

  .toggle.on & {
    transform: translateX(22px);
  }
}

/* ── Language pills ── */
.lang-pills {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  transition: opacity 0.2s;

  &.loading { opacity: 0.5; pointer-events: none; }
}

.lang-pill {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 30px;
  border: 1.5px solid rgba(35, 73, 112, 0.12);
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;git

  &:active { transform: scale(0.96); }

  &.active {
    background: rgba(78, 190, 194, 0.12);
    border-color: rgba(78, 190, 194, 0.5);
    color: #234970;
    font-weight: 700;
  }
}

.lang-flag { font-size: 16px; }

.lang-label { line-height: 1; }

/* ── Skeleton ── */
.skeleton-wrap {
  position: absolute;
  inset: 80px 16px 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.skeleton-hero {
  height: 200px;
  border-radius: 28px;
  background: rgba(0, 0, 0, 0.06);
  animation: pulse 1.4s ease infinite;
}

.skeleton-card {
  height: 72px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.05);
  animation: pulse 1.4s ease infinite;

  &:nth-child(3) { animation-delay: 0.2s; }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}

/* ── Passport button ── */
.passport-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px 18px;
  background: linear-gradient(135deg, rgba(200, 168, 75, 0.12), rgba(26, 46, 74, 0.06));
  border: 1.5px solid rgba(200, 168, 75, 0.4);
  border-radius: 20px;
  cursor: pointer;
  font-family: inherit;
  box-shadow: 0 3px 12px rgba(200, 168, 75, 0.1);
  transition: transform 0.15s, box-shadow 0.15s;
  text-align: left;

  &:active { transform: scale(0.98); box-shadow: none; }
}

.passport-btn__icon {
  font-size: 28px;
  flex-shrink: 0;
}

.passport-btn__text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.passport-btn__title {
  font-size: 15px;
  font-weight: 700;
  color: #1A2E4A;
}

.passport-btn__sub {
  font-size: 12px;
  color: #9CA3AF;
}

.passport-btn__arrow {
  font-size: 22px;
  color: #C8A84B;
  font-weight: 300;
  line-height: 1;
}
</style>