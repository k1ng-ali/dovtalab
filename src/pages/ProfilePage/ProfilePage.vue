<script setup lang="ts">
import {onMounted, computed, ref} from 'vue'
import { useUserStore } from '@/features/user/store.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import {useRouter} from "vue-router";
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import { useI18n } from 'vue-i18n'
import PassportModal from '@/features/passport/PassportModal.vue'
import LogoutIcon from '@iconify-vue/solar/logout-2-linear'
import PassportIcon from '@iconify-vue/solar/passport-linear'
import ClassesIcon from '@iconify-vue/solar/square-academic-cap-linear'
import TimerIcon from '@iconify-vue/solar/stopwatch-linear'
import GlobeIcon from '@iconify-vue/solar/globus-linear'
import ArrowRight from '@iconify-vue/solar/alt-arrow-right-linear'

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
  const total = config.value?.quiz_time ?? 0
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  if (h > 0) return t('units.hMin', { h, m })
  return t('units.min', { n: m })
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
  { code: 'ru', label: 'Русский' },
  { code: 'tg', label: 'Тоҷикӣ' },
  { code: 'en', label: 'English' },
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
  await router.replace('/')
}

const avatarError = ref(false)
</script>

<template>
  <div class="profile ui-page">

    <!-- ── Скелетон ── -->
    <template v-if="!user">
      <div class="ui-skeleton profile__skeleton-hero" />
      <div class="ui-skeleton profile__skeleton-card" />
      <div class="ui-skeleton profile__skeleton-card" />
    </template>

    <template v-else>
      <!-- ── Карточка пользователя ── -->
      <section class="me ui-card">
        <img
            v-if="user.avatar_url && !avatarError"
            :src="user.avatar_url"
            class="me__avatar"
            alt=""
            @error="avatarError = true"
        />
        <span v-else class="me__avatar me__avatar--fallback">{{ initials }}</span>

        <div class="me__info">
          <h2 class="me__name">{{ user.first_name }} {{ user.last_name }}</h2>
          <p class="me__username" v-if="user.username">@{{ user.username }}</p>
          <div class="me__chips">
            <span v-if="is_pro" class="ui-chip me__pro">PRO</span>
            <span v-if="is_creator" class="ui-chip ui-chip--teal">Creator</span>
            <span class="me__joined">{{ t('profile.memberSince', { date: joinedLabel }) }}</span>
          </div>
        </div>
      </section>

      <!-- ── Ссылки ── -->
      <div class="ui-card ui-card--list">
        <button type="button" class="ui-row link" @click="passportOpen = true">
          <span class="ui-tile-icon link__icon"><PassportIcon /></span>
          <span class="link__text">
            <b>{{ $t('passport.my') }}</b>
            <span>{{ $t('passport.shareProfile') }}</span>
          </span>
          <ArrowRight class="link__arrow" />
        </button>
        <button type="button" class="ui-row link" @click="router.push('/classes')">
          <span class="ui-tile-icon link__icon"><ClassesIcon /></span>
          <span class="link__text">
            <b>{{ $t('profile.myClasses') }}</b>
            <span>{{ $t('classes.joinHint') }}</span>
          </span>
          <ArrowRight class="link__arrow" />
        </button>
      </div>

      <!-- ── Статистика ── -->
      <div class="ui-section-head">
        <h3 class="ui-section-head__title">{{ t('profile.statsSection') }}</h3>
      </div>
      <div class="stats">
        <div class="ui-stat">
          <span class="ui-stat__label">{{ t('profile.testsCompleted') }}</span>
          <b class="ui-stat__value">{{ config?.quiz_count ?? 0 }}</b>
        </div>
        <div class="ui-stat">
          <span class="ui-stat__label">{{ t('profile.timeInTests') }}</span>
          <b class="ui-stat__value">{{ totalTimeLabel }}</b>
        </div>
        <div class="ui-stat stats__wide" v-if="config?.is_active !== undefined">
          <span class="ui-stat__label">{{ t('profile.accountStatus') }}</span>
          <b class="ui-stat__value status" :class="{ 'status--on': config?.is_active }">
            <i />{{ config?.is_active ? t('profile.accountActive') : t('profile.accountInactive') }}
          </b>
        </div>
      </div>

      <!-- ── Настройки ── -->
      <div class="ui-section-head">
        <h3 class="ui-section-head__title">{{ t('profile.settingsSection') }}</h3>
      </div>
      <div class="ui-card ui-card--list">
        <button
            type="button"
            class="ui-row link"
            :disabled="timerLoading"
            role="switch"
            :aria-checked="!!config?.timer"
            @click="toggleTimer"
        >
          <span class="ui-tile-icon link__icon"><TimerIcon /></span>
          <span class="link__text">
            <b>{{ t('profile.timerName') }}</b>
            <span>{{ t('profile.timerDesc') }}</span>
          </span>
          <span class="ui-switch" :class="{ on: config?.timer }" />
        </button>

        <div class="ui-row lang">
          <div class="lang__head">
            <span class="ui-tile-icon link__icon"><GlobeIcon /></span>
            <span class="link__text">
              <b>{{ t('profile.languageName') }}</b>
              <span>{{ t('profile.languageDesc') }}</span>
            </span>
          </div>
          <div class="ui-segmented lang__seg" :class="{ loading: langLoading }">
            <button
                v-for="lang in languages"
                :key="lang.code"
                type="button"
                class="ui-segmented__item"
                :class="{ active: config?.language === lang.code }"
                @click="setLanguage(lang.code)"
            >
              {{ lang.label }}
            </button>
          </div>
        </div>

        <button type="button" class="ui-row link link--danger" @click="logOut">
          <span class="ui-tile-icon link__icon"><LogoutIcon /></span>
          <span class="link__text"><b>{{ t('profile.logout') }}</b></span>
        </button>
      </div>
    </template>
  </div>

  <!-- ── Passport modal ── -->
  <PassportModal :open="passportOpen" @close="passportOpen = false" />
</template>

<style scoped lang="scss">
.profile {
  max-width: 640px;

  &__skeleton-hero { height: 130px; }
  &__skeleton-card { height: 140px; }
}

/* ── Карточка пользователя ── */
.me {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 18px;

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    flex-shrink: 0;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 0 3px #FFFFFF, 0 6px 16px rgba(23, 46, 74, 0.15);

    &--fallback {
      background: var(--grad-primary);
      color: #FFFFFF;
      font-size: 26px;
      font-weight: 800;
    }
  }

  &__info { display: flex; flex-direction: column; gap: 4px; min-width: 0; }

  &__name {
    margin: 0;
    font-size: var(--fs-h2);
    font-weight: 800;
    line-height: 1.2;
    color: var(--c-navy-900);
    overflow-wrap: anywhere;
  }

  &__username { margin: 0; font-size: 14px; color: var(--c-muted); }

  &__chips { display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; margin-top: 4px; }
  &__pro { background: var(--grad-primary); color: #FFFFFF; letter-spacing: 0.5px; }
  &__joined { font-size: 12px; color: var(--c-muted); }
}

/* ── Строки-ссылки ── */
.link {
  width: 100%;
  border-left: none;
  border-right: none;
  border-top: none;
  background: transparent;
  font-family: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s ease;

  &:active { background: rgba(23, 46, 74, 0.04); }
  &:disabled { cursor: wait; }

  &__icon { width: 40px; height: 40px; border-radius: 12px; font-size: 20px; }

  &__text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;

    b { font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
    span { font-size: 12px; color: var(--c-muted); }
  }

  &__arrow { font-size: 20px; color: var(--c-muted); }

  &--danger {
    .link__icon { background: var(--c-danger-tint); color: var(--c-danger); }
    .link__text b { color: var(--c-danger); }
  }
}

.lang {
  flex-direction: column;
  align-items: stretch;

  &__head { display: flex; align-items: center; gap: 12px; }
  &__seg { background: rgba(23, 46, 74, 0.05); &.loading { opacity: 0.6; pointer-events: none; } }
}

/* ── Статистика ── */
.stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;

  &__wide { grid-column: span 2; }

  @media (min-width: 640px) {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    &__wide { grid-column: auto; }
  }
}

.status {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 18px;

  i { width: 10px; height: 10px; border-radius: 50%; background: var(--c-empty); }
  &--on i { background: var(--c-success); }
}
</style>
