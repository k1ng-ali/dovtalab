<script setup lang="ts">
// Навигация: плавающая «пилюля» снизу на телефоне, стеклянный сайдбар на десктопе (≥1024px).
// В режиме actions (тест, задание) вместо вкладок показываются кнопки действий.
import { computed, type Component } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import Home from '@iconify-vue/solar/home-2-linear'
import HomeActive from '@iconify-vue/solar/home-2-bold-duotone'
import Book from '@iconify-vue/solar/book-2-linear'
import BookActive from '@iconify-vue/solar/book-2-bold-duotone'
import Bolt from '@iconify-vue/solar/bolt-linear'
import BoltActive from '@iconify-vue/solar/bolt-bold-duotone'
import Users from '@iconify-vue/solar/users-group-rounded-linear'
import UsersActive from '@iconify-vue/solar/users-group-rounded-bold-duotone'
import User from '@iconify-vue/solar/user-linear'
import UserActive from '@iconify-vue/solar/user-bold-duotone'

interface Tab {
  name: string
  path: string
  icon: Component
  activeIcon: Component
  match: (path: string) => boolean
}

const { t } = useI18n()
const route = useRoute()
const router = useRouter()
const navStore = useNavStore()

const tabs = computed<Tab[]>(() => [
  { name: t('nav.home'), path: '/', icon: Home, activeIcon: HomeActive,
    match: p => p === '/' || p.startsWith('/leaders') || p.startsWith('/daily') },
  { name: t('nav.quizzes'), path: '/quiz', icon: Book, activeIcon: BookActive,
    match: p => p.startsWith('/quiz') },
  { name: t('nav.duels'), path: '/duels', icon: Bolt, activeIcon: BoltActive,
    match: p => p.startsWith('/duels') },
  { name: t('nav.classes'), path: '/classes', icon: Users, activeIcon: UsersActive,
    match: p => p.startsWith('/classes') || p.startsWith('/join') || p.startsWith('/assignment') },
  { name: t('nav.profile'), path: '/profile', icon: User, activeIcon: UserActive,
    match: p => p.startsWith('/profile') },
])

const activeIndex = computed(() => tabs.value.findIndex(tab => tab.match(route.path)))

function go(tab: Tab) {
  if (route.path !== tab.path) router.push(tab.path)
}
</script>

<template>
  <!-- ── Десктоп: плавающий сайдбар ───────────────────────────── -->
  <nav class="sidebar" :aria-label="t('nav.home')">
    <button type="button" class="brand" @click="router.push('/')">
      <span class="brand__mark" aria-hidden="true" />
      <span class="brand__name">Dovtalab</span>
      <span class="brand__beta">beta</span>
    </button>
    <button
        v-for="(tab, i) in tabs"
        :key="tab.path"
        type="button"
        class="side-item"
        :class="{ active: activeIndex === i }"
        :aria-current="activeIndex === i ? 'page' : undefined"
        @click="go(tab)"
    >
      <component :is="activeIndex === i ? tab.activeIcon : tab.icon" class="side-item__icon" />
      <span>{{ tab.name }}</span>
    </button>
  </nav>

  <!-- ── Нижняя «пилюля»: вкладки (телефон) или действия (везде) ── -->
  <div class="dock" :class="{ 'dock--actions': navStore.mode !== 'tabs' }">
    <nav v-if="navStore.mode === 'tabs'" class="pill ui-bar" :aria-label="t('nav.home')">
      <button
          v-for="(tab, i) in tabs"
          :key="tab.path"
          type="button"
          class="tab"
          :class="{ active: activeIndex === i }"
          :aria-current="activeIndex === i ? 'page' : undefined"
          @click="go(tab)"
      >
        <component :is="activeIndex === i ? tab.activeIcon : tab.icon" class="tab__icon" />
        <span class="tab__label">{{ tab.name }}</span>
      </button>
    </nav>

    <div v-else class="pill pill--actions ui-bar">
      <button
          v-for="(btn, i) in navStore.actions"
          :key="i"
          type="button"
          class="action"
          :class="[`action--${btn.variant ?? 'default'}`]"
          :disabled="btn.disabled"
          @click="btn.onClick"
      >
        <component v-if="btn.icon" :is="btn.icon" class="action__icon" />
        <span>{{ btn.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
/* ═══ Нижняя пилюля ═══ */
.dock {
  position: fixed;
  left: 0;
  right: 0;
  bottom: calc(var(--sab) + 16px);
  z-index: 100;
  display: flex;
  justify-content: center;
  padding: 0 var(--bar-gap);
  pointer-events: none;

  @media (min-width: 1024px) {
    left: calc(var(--sidebar-w) + 18px);
    &:not(.dock--actions) { display: none; }
  }
}

.pill {
  display: flex;
  gap: 2px;
  padding: 5px;
  pointer-events: auto;
  max-width: 100%;
  box-sizing: border-box;
}

.tab {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  width: 66px;
  height: 56px;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--c-muted-2);
  font-family: inherit;
  cursor: pointer;
  box-sizing: border-box;
  transition: background 0.25s ease, color 0.25s ease;
  -webkit-tap-highlight-color: transparent;

  &__icon { font-size: 23px; }
  &__label { font-size: 11px; font-weight: 500; line-height: 1.1; }

  &.active {
    background: var(--c-teal-tint);
    border-color: var(--c-teal-tint-border);
    color: var(--c-navy-900);

    .tab__label { font-weight: 700; }
  }

  &:active { transform: scale(0.95); }

  @media (max-width: 360px) {
    width: 58px;
    &__label { font-size: 10px; }
  }
}

/* Режим действий */
.pill--actions {
  gap: 6px;
  padding: 6px;
}

.action {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 46px;
  padding: 0 20px;
  border: none;
  border-radius: var(--r-pill);
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.18s ease, opacity 0.18s ease;

  &:active:not(:disabled) { transform: scale(0.96); }
  &:disabled { opacity: 0.45; cursor: not-allowed; }

  &__icon { font-size: 18px; }

  &--default {
    background: rgba(255, 255, 255, 0.85);
    color: var(--c-navy-900);
    box-shadow: inset 0 0 0 1px var(--c-line-2);
  }

  &--primary {
    background: var(--grad-primary);
    color: #FFFFFF;
    box-shadow: 0 6px 16px rgba(35, 73, 112, 0.25);
  }

  &--ghost {
    background: transparent;
    color: var(--c-muted);
  }
}

/* ═══ Сайдбар (десктоп) ═══ */
.sidebar {
  display: none;

  @media (min-width: 1024px) {
    position: fixed;
    top: 18px;
    bottom: 18px;
    left: 18px;
    z-index: 100;
    width: var(--sidebar-w);
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 18px 12px;
    border-radius: 32px;
    background: rgba(255, 255, 255, 0.6);
    -webkit-backdrop-filter: blur(28px) saturate(160%);
    backdrop-filter: blur(28px) saturate(160%);
    border: 2px solid rgba(255, 255, 255, 0.9);
    box-shadow: 0 16px 40px rgba(23, 46, 74, 0.12);
  }
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 10px 22px;
  border: none;
  background: none;
  font-family: inherit;
  cursor: pointer;

  &__mark {
    width: 36px;
    height: 36px;
    border-radius: 12px;
    background: var(--grad-brand-mark);
  }

  &__name { font-size: 18px; font-weight: 800; color: var(--c-navy-900); }

  &__beta {
    padding: 2px 8px;
    border-radius: var(--r-pill);
    background: var(--c-teal-tint);
    color: var(--c-teal-600);
    font-size: 11px;
    font-weight: 700;
  }
}

.side-item {
  display: flex;
  align-items: center;
  gap: 12px;
  height: 48px;
  padding: 0 14px;
  border: 1px solid transparent;
  border-radius: var(--r-pill);
  background: transparent;
  color: #4B5A6D;
  font-family: inherit;
  font-size: 15px;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s ease, color 0.2s ease;

  &__icon { font-size: 21px; }

  &:hover { background: rgba(255, 255, 255, 0.6); }

  &.active {
    background: var(--c-teal-tint);
    border-color: var(--c-teal-tint-border);
    color: var(--c-navy-900);
    font-weight: 700;
  }
}
</style>
