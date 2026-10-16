<script setup lang="ts">
// Шапка главной: на телефоне — плавающая стеклянная «пилюля», на десктопе — строка приветствия.
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import FireIcon from '@iconify-vue/solar/fire-linear'
import type { User } from '@/features/user/type.ts'

const props = defineProps<{
  user: User | null
  streak: number
}>()

const { t, locale } = useI18n()
const router = useRouter()
const avatarError = ref(false)

const initials = computed(() => {
  const u = props.user
  if (!u) return '?'
  return ((u.first_name?.[0] ?? '') + (u.last_name?.[0] ?? '')).toUpperCase() || u.username?.[0]?.toUpperCase() || '?'
})

const today = computed(() =>
  new Date().toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })
)
</script>

<template>
  <header class="home-header">
    <button type="button" class="avatar" :aria-label="t('nav.profile')" @click="router.push('/profile')">
      <img v-if="user?.avatar_url && !avatarError" :src="user.avatar_url" alt="" @error="avatarError = true" />
      <span v-else>{{ initials }}</span>
    </button>

    <div class="greeting">
      <span class="greeting__hello">
        <span class="greeting__date">{{ today }}</span>
        <span class="greeting__welcome">{{ t('mainPage.welcomeBack') }}</span>
      </span>
      <b class="greeting__name">{{ user?.first_name ?? '…' }}</b>
    </div>

    <span v-if="streak > 0" class="streak" :title="t('stats.daysStreak', streak)">
      <FireIcon class="streak__icon" />{{ streak }}
    </span>
  </header>
</template>

<style scoped lang="scss">
.home-header {
  position: fixed;
  top: calc(var(--sat) + var(--bar-gap));
  left: var(--bar-gap);
  right: var(--bar-gap);
  z-index: 50;
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 60px;
  padding: 6px 8px;
  box-sizing: border-box;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.66);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: var(--glass-border-bar);
  box-shadow: 0 10px 30px rgba(23, 46, 74, 0.12);

  @media (min-width: 1024px) {
    position: static;
    min-height: 0;
    padding: 0;
    background: none;
    border: none;
    box-shadow: none;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
  }
}

.avatar {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: 50%;
  overflow: hidden;
  background: var(--grad-primary);
  color: #FFFFFF;
  font-family: inherit;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;

  img { width: 100%; height: 100%; object-fit: cover; }

  @media (min-width: 1024px) { display: none; }
}

.greeting {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  line-height: 1.2;

  &__hello { font-size: 12px; color: var(--c-muted); }
  &__date { display: none; }
  &__name {
    font-size: 16px;
    color: var(--c-navy-900);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  @media (min-width: 1024px) {
    gap: 4px;

    &__hello { font-size: 14px; }
    &__date { display: inline; text-transform: capitalize; }
    &__welcome { display: none; }
    &__name { font-size: 30px; font-weight: 800; }
  }
}

.streak {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 40px;
  padding: 0 14px;
  border-radius: var(--r-pill);
  background: var(--c-warning-tint);
  color: var(--c-warning-text);
  font-size: 15px;
  font-weight: 800;

  &__icon { font-size: 18px; color: var(--c-wrong); }

  @media (min-width: 1024px) {
    height: 44px;
    padding: 0 18px;
    background: var(--glass-bg);
    border: var(--glass-border);
  }
}
</style>
