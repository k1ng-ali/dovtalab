<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/features/user/store.ts'
import SubscriptionModal from './SubscriptionModal.vue'
import BoltIcon from '@iconify-vue/solar/bolt-bold-duotone'

const userStore = useUserStore()
const showModal = ref(false)
</script>

<template>
  <!-- Пользователь с Pro — показать статус -->
  <div v-if="userStore.is_pro" class="pro-active">
    <div class="active-left">
      <span class="active-icon"><BoltIcon /></span>
      <div class="active-text">
        <span class="active-title">{{ $t('subscription.proActive') }}</span>
        <span class="active-desc">{{ $t('subscription.proActiveDesc') }}</span>
      </div>
    </div>
    <span class="active-badge">PRO</span>
  </div>

  <!-- Без Pro — предложить оформить -->
  <div v-else class="pro-banner" @click="showModal = true">
    <div class="banner-left">
      <span class="banner-icon"><BoltIcon /></span>
      <div class="banner-text">
        <span class="banner-title">Dovtalab Pro</span>
        <span class="banner-desc">{{ $t('subscription.bannerDesc') }}</span>
      </div>
    </div>
    <span class="banner-action">{{ $t('subscription.free') }} →</span>
  </div>

  <SubscriptionModal
    :visible="showModal"
    @close="showModal = false"
    @activated="showModal = false"
  />
</template>

<style scoped lang="scss">
/* Pro: спокойная стеклянная строка, акцент — иконка и ссылка */
.pro-active, .pro-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-radius: var(--r-lg);
  background: var(--glass-bg);
  -webkit-backdrop-filter: var(--glass-blur);
  backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  box-shadow: var(--shadow-card);
}

.pro-banner {
  cursor: pointer;
  transition: transform 0.18s ease;
  &:active { transform: scale(0.98); }
}

.active-left, .banner-left { display: flex; align-items: center; gap: 12px; min-width: 0; }

.active-icon, .banner-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  border-radius: 14px;
  background: var(--grad-primary);
  color: #FFFFFF;
  font-size: 22px;
}

.active-text, .banner-text { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.active-title, .banner-title { font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
.active-desc, .banner-desc { font-size: 13px; color: var(--c-muted); }

.active-badge {
  padding: 4px 10px;
  border-radius: var(--r-pill);
  background: var(--c-teal-tint);
  color: var(--c-teal-600);
  font-size: 12px;
  font-weight: 800;
}

.banner-action {
  font-size: 14px;
  font-weight: 700;
  color: var(--c-teal-600);
  white-space: nowrap;
}
</style>
