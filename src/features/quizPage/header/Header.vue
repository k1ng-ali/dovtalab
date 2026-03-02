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
      <h3 class="path">{{ headerStore.title }}</h3>

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
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);

  mask-image: linear-gradient(to bottom, black 0%, black 40%, transparent 100%);

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
  backdrop-filter: blur(10px);
  padding: 5px 5px 5px 10px;
  border-radius: 50px;
  box-shadow: rgba(34, 34, 34, 0.3) 0 0 20px;
  user-select: none;
  gap: 8px;
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
  /* зеркалит ширину левой кнопки для центровки заголовка */
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
</style>