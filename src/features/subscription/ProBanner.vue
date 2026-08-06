<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/features/user/store.ts'
import SubscriptionModal from './SubscriptionModal.vue'

const userStore = useUserStore()
const showModal = ref(false)
</script>

<template>
  <!-- Пользователь с Pro — показать статус -->
  <div v-if="userStore.is_pro" class="pro-active">
    <div class="active-left">
      <span class="active-icon">⚡</span>
      <div class="active-text">
        <span class="active-title">Pro активен</span>
        <span class="active-desc">Адаптивное обучение и тренировки доступны</span>
      </div>
    </div>
    <span class="active-badge">PRO</span>
  </div>

  <!-- Без Pro — предложить оформить -->
  <div v-else class="pro-banner" @click="showModal = true">
    <div class="banner-left">
      <span class="banner-icon">⚡</span>
      <div class="banner-text">
        <span class="banner-title">Dovtalab Pro</span>
        <span class="banner-desc">Адаптивное обучение, тренировка по темам</span>
      </div>
    </div>
    <span class="banner-action">Бесплатно →</span>
  </div>

  <SubscriptionModal
    :visible="showModal"
    @close="showModal = false"
    @activated="showModal = false"
  />
</template>

<style scoped lang="scss">
/* ── Active Pro status ── */
.pro-active {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.06), rgba(79, 70, 229, 0.03));
  border: 1.5px solid rgba(124, 58, 237, 0.15);
  border-radius: 18px;
}

.active-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.active-icon {
  font-size: 20px;
}

.active-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.active-title {
  font-size: 14px;
  font-weight: 700;
  color: #4F46E5;
}

.active-desc {
  font-size: 11px;
  color: #6B7280;
}

.active-badge {
  padding: 4px 10px;
  background: linear-gradient(135deg, #7C3AED, #4F46E5);
  color: #fff;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.5px;
  border-radius: 8px;
}

/* ── Banner for non-Pro ── */
.pro-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, rgba(124, 58, 237, 0.08), rgba(79, 70, 229, 0.05));
  border: 1.5px solid rgba(124, 58, 237, 0.2);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(124, 58, 237, 0.4);
    box-shadow: 0 4px 16px rgba(124, 58, 237, 0.1);
  }

  &:active {
    transform: scale(0.98);
  }
}

.banner-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.banner-icon {
  font-size: 24px;
}

.banner-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-title {
  font-size: 14px;
  font-weight: 700;
  color: #4F46E5;
}

.banner-desc {
  font-size: 12px;
  color: #6B7280;
}

.banner-action {
  font-size: 13px;
  font-weight: 600;
  color: #7C3AED;
  white-space: nowrap;
}
</style>
