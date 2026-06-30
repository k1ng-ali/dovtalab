<script setup lang="ts">
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'

const headerStore = useHeaderStore()
</script>

<template>
  <div class="header" v-if="headerStore.is_visible">
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
.header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  padding: 20px 0;
  z-index: 99;
  padding-top: calc(16px + var(--sat));

  background: linear-gradient(
          to bottom,
          rgba(255, 255, 255, 0.5) 1%,
          rgba(255, 255, 255, 0.3) 50%,
          rgba(255, 255, 255, 0) 80%
  );
}

.container {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  min-width: 50%;
  max-width: calc(100% - 40px);
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid rgba(255, 255, 255, 1);
  backdrop-filter: blur(5px);
  padding: 5px 5px 5px 10px;
  border-radius: 50px;
  box-shadow: rgba(34, 34, 34, 0.3) 0 0 20px;
  user-select: none;
  gap: 8px;

  /* Нужно для того, чтобы оверлей не вылезал за скруглённые края */
  position: relative;
  overflow: hidden;
}

.actions-container {
  display: flex;
  width: 100%;
  gap: 20px;
}

.actions-btn {
  width: 100%;
  align-items: center;
  background: rgba(35, 73, 112, 0.08);
  border: none;
  border-radius: 30px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: #234970;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;

  &--active {
    background: rgba(78, 190, 194, 0.25);
    color: #234970;
    font-weight: 600;
    border: 1px solid rgba(78, 190, 194, 0.3);
  }
}

.path {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #234970;
  flex: 1;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding: 4px 0;
}

.spacer {
  width: 36px;
  flex-shrink: 0;
}

.action-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(35, 73, 112, 0.08);
  border: none;
  border-radius: 30px;
  padding: 6px 12px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: #234970;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  white-space: nowrap;

  &:active {
    background: rgba(35, 73, 112, 0.15);
    transform: scale(0.95);
  }

  .btn-icon {
    font-size: 18px;
  }

  &--right {
    background: rgba(78, 190, 194, 0.18);
    color: #234970;

    &:active {
      background: rgba(78, 190, 194, 0.3);
    }
  }
}

/* ─── Оверлей уведомления ─────────────────────────────── */
.notification-overlay {
  /* Занимает всё пространство .container, не смещает соседние элементы */
  position: absolute;
  inset: 0;
  z-index: 2;

  display: flex;
  align-items: center;
  justify-content: center;

  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  border-radius: inherit; /* берёт border-radius от .container */

  &--success {
    background: #E6F7ED;
    color: #166534;
  }

  &--error {
    background: #FCEEEE;
    color: #991b1b;
  }
}

/* ─── Анимация появления / исчезновения ───────────────── */
.notify-enter-active {
  animation: notify-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.notify-leave-active {
  animation: notify-fade-out 0.3s ease forwards;
}

@keyframes notify-pop {
  from {
    opacity: 0;
    transform: scale(0.85);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes notify-fade-out {
  from {
    opacity: 1;
    transform: scale(1);
  }
  to {
    opacity: 0;
    transform: scale(0.9);
  }
}
</style>