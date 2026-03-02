<script setup lang="ts">
import { AkHome, PhSealQuestion, CgProfile } from '@kalimahapps/vue-icons';
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import { useNavStore } from '@/shared/stores/useNavStore.ts'

const tabs = [
  { name: "Главная", icon: AkHome,          path: "/" },
  { name: "Тесты",   icon: PhSealQuestion,  path: "/quiz" },
  { name: "Профиль", icon: CgProfile,       path: "/profile" },
]

const route    = useRoute()
const router   = useRouter()
const navStore = useNavStore()

const activeIndex = computed(() =>
    tabs.findIndex(t => t.path === route.path)
)

const onTab = (index: number) => {
  const tab = tabs[index]
  if (tab) router.push(tab.path)
}
</script>

<template>
  <div class="navigator">
    <!-- ── Режим: стандартные вкладки ───────────────────────── -->
    <div v-if="navStore.mode === 'tabs'" class="container">
      <div
          v-for="(tab, i) in tabs"
          :key="i"
          class="item"
          :class="{ active: activeIndex === i }"
          @click="onTab(i)"
      >
        <component :is="tab.icon" class="icon" />
        <p class="title">{{ tab.name }}</p>
      </div>
    </div>

    <!-- ── Режим: кастомные кнопки действий ─────────────────── -->
    <div v-else class="container actions-container">
      <button
          v-for="(btn, i) in navStore.actions"
          :key="i"
          class="action-btn"
          :class="[`action-btn--${btn.variant ?? 'default'}`, { disabled: btn.disabled }]"
          :disabled="btn.disabled"
          @click="btn.onClick"
      >
        <component v-if="btn.icon" :is="btn.icon" class="action-icon" />
        <span class="action-label">{{ btn.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.navigator {
  display: flex;
  align-items: center;
  justify-content: center;
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding-bottom: 20px;
  z-index: 100;
  background: linear-gradient(
          to top,
          rgba(255, 255, 255, 0.95) 1%,
          rgba(255, 255, 255, 0.7) 50%,
          rgba(255, 255, 255, 0) 80%
  );
}

/* ── Общий контейнер ── */
.container {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 1fr;
  gap: 10px;
  background: rgba(255, 255, 255, 0.6);
  border: 2px solid rgba(255, 255, 255, 1);
  backdrop-filter: blur(10px);
  padding: 5px;
  border-radius: 50px;
  box-shadow: rgba(34, 34, 34, 0.3) 0 0 20px;
  user-select: none;
}

/* ── Вкладки ── */
.item {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 6px 14px;
  border-radius: 30px;
  cursor: pointer;
  transition: all 0.25s ease;
  background: transparent;
  color: #8A94A6;

  .icon {
    transition: all 0.25s ease;
    font-size: 22px;
  }

  .title {
    margin: 0;
    font-size: 11px;
    font-weight: 500;
  }

  &.active {
    background: rgba(78, 190, 194, 0.25);
    color: #234970;
    font-weight: 600;
    border: rgba(78, 190, 194, 0.3) solid 1px;

    .icon { fill: #234970; }
  }
}

/* ── Кнопки действий ── */
.actions-container {
  grid-auto-columns: auto;
  padding: 6px;
  gap: 8px;
}

.action-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  font-size: 14px;
  font-weight: 600;
  font-family: inherit;
  transition: all 0.2s ease;
  white-space: nowrap;

  &:active:not(.disabled) {
    transform: scale(0.96);
  }

  &.disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }

  /* Варианты */
  &--default {
    background: rgba(255, 255, 255, 0.8);
    color: #234970;
    border: 1.5px solid rgba(35, 73, 112, 0.2);
  }

  &--primary {
    background: linear-gradient(135deg, #4EBEC2, #234970);
    color: #fff;
    box-shadow: 0 4px 14px rgba(78, 190, 194, 0.4);
  }

  &--ghost {
    background: transparent;
    color: #8A94A6;
  }

  .action-icon {
    font-size: 18px;
  }

  .action-label {
    line-height: 1;
  }
}
</style>