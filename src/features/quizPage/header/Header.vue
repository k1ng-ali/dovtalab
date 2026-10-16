<script setup lang="ts">
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'

const headerStore = useHeaderStore()
</script>

<template>
  <div class="header" :class="{ hidden: !headerStore.is_visible }">
    <div class="container">

      <!-- Левая кнопка (опционально) -->
      <button
          v-if="headerStore.leftAction"
          class="action-btn action-btn--left"
          @click="headerStore.leftAction!.onClick()"
      >
        <component
            v-if="headerStore.leftAction.icon"
            :is="headerStore.leftAction.icon"
            class="btn-icon"
        />
        <span v-if="headerStore.leftAction.label">{{ headerStore.leftAction.label }}</span>
      </button>

      <!-- Заголовок -->
      <h3 class="path" v-if="headerStore.actions.length < 1">{{ headerStore.title }}</h3>

      <div class="actions-container" v-else>
        <button
          v-for="(btn, i) in headerStore.actions"
          :key="i"
          class="actions-btn"
          :class="[`actions-btn--${btn.variant ?? 'default'}`]"
          @click="btn.onClick()"
        >
          <span class="btn-label">{{btn.label}}</span>
        </button>
      </div>

      <!-- Правая кнопка (опционально) -->
      <button
          v-if="headerStore.rightAction"
          class="action-btn action-btn--right"
          @click="headerStore.rightAction!.onClick()"
      >
        <component
            v-if="headerStore.rightAction.icon"
            :is="headerStore.rightAction.icon"
            class="btn-icon"
        />
        <span v-if="headerStore.rightAction.label">{{ headerStore.rightAction.label }}</span>
      </button>

      <!-- Пустой спейсер, если правой кнопки нет, но есть левая (для центровки заголовка) -->
      <div v-else-if="headerStore.leftAction" class="spacer" />

      <!-- ✅ Уведомление-оверлей: накладывается поверх содержимого контейнера -->
      <Transition name="notify">
        <div
            v-if="headerStore.notification"
            class="notification-overlay"
            :class="`notification-overlay--${headerStore.notification.type}`"
        >
          {{ headerStore.notification.message }}
        </div>
      </Transition>

    </div>
  </div>
</template>

<style scoped lang="scss">
/* Плавающая стеклянная шапка: отступ от краёв, на десктопе — правее сайдбара */
.header {
  position: fixed;
  top: calc(var(--sat) + var(--bar-gap));
  left: 0;
  right: 0;
  z-index: 99;
  display: flex;
  justify-content: center;
  padding: 0 var(--bar-gap);
  pointer-events: none;
  transition: opacity 0.25s ease, transform 0.25s ease;

  @media (min-width: 1024px) {
    top: 18px;
    left: calc(var(--sidebar-w) + 18px);
  }

  &.hidden {
    opacity: 0;
    transform: translateY(-10px);

    .container { pointer-events: none; }
  }
}

.container {
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  min-width: min(320px, 100%);
  max-width: 640px;
  min-height: 52px;
  padding: 5px;
  box-sizing: border-box;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.66);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: var(--glass-border-bar);
  box-shadow: 0 10px 30px rgba(23, 46, 74, 0.14);
  user-select: none;
  pointer-events: auto;
}

.path {
  flex: 1;
  margin: 0;
  padding: 0 12px;
  font-size: 16px;
  font-weight: 700;
  color: var(--c-navy-900);
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.spacer {
  width: 42px;
  flex-shrink: 0;
}

.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-width: 42px;
  height: 42px;
  padding: 0 12px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--r-pill);
  background: rgba(35, 73, 112, 0.08);
  color: var(--c-navy-900);
  font-family: inherit;
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  cursor: pointer;
  transition: transform 0.18s ease, background 0.18s ease;

  &:active { transform: scale(0.94); background: rgba(35, 73, 112, 0.14); }

  .btn-icon { font-size: 20px; }

  &--right {
    background: var(--c-teal-tint);
    color: var(--c-teal-600);
  }
}

.actions-container {
  display: flex;
  width: 100%;
  gap: 6px;
}

.actions-btn {
  flex: 1;
  min-height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: var(--r-pill);
  background: transparent;
  color: var(--c-ink-2);
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  transition: background 0.2s ease, box-shadow 0.2s ease, color 0.2s ease;

  &--active {
    background: #FFFFFF;
    color: var(--c-navy-900);
    font-weight: 700;
    box-shadow: 0 4px 12px rgba(23, 46, 74, 0.1);
  }
}

/* ─── Уведомление поверх шапки ───────────────────────────── */
.notification-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 16px;
  border-radius: inherit;
  font-size: 15px;
  font-weight: 700;
  text-align: center;

  &--success { background: #E3F4EE; color: #0B5E4F; }
  &--error   { background: #FCEDE3; color: #8A3A07; }
}

.notify-enter-active { animation: notify-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.notify-leave-active { animation: notify-fade-out 0.3s ease forwards; }

@keyframes notify-pop {
  from { opacity: 0; transform: scale(0.85); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes notify-fade-out {
  from { opacity: 1; transform: scale(1); }
  to   { opacity: 0; transform: scale(0.9); }
}
</style>
