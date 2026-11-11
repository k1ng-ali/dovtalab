<script setup lang="ts">
// Плашка гостевого режима: зовёт войти через Telegram, чтобы сохранить прогресс и попасть в рейтинг.
import { useI18n } from 'vue-i18n'
import UserIcon from '@iconify-vue/solar/user-circle-linear'
import { useAuthStore } from '@/features/auth/store.ts'

const { t } = useI18n()
const authStore = useAuthStore()
</script>

<template>
  <section class="guest-banner ui-card">
    <span class="ui-tile-icon"><UserIcon /></span>
    <div class="guest-banner__text">
      <b class="guest-banner__title">{{ t('guest.bannerTitle') }}</b>
      <span class="guest-banner__desc">{{ t('guest.bannerDesc') }}</span>
    </div>
    <button type="button" class="ui-btn ui-btn--primary ui-btn--sm guest-banner__btn" @click="authStore.promptLogin()">
      {{ t('guest.signIn') }}
    </button>
  </section>
</template>

<style scoped lang="scss">
.guest-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;

  &__text {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--c-ink, var(--c-navy-900));
  }

  &__desc {
    font-size: 13px;
    line-height: 1.35;
    color: var(--c-muted);
  }

  &__btn {
    flex-shrink: 0;
  }
}
</style>
