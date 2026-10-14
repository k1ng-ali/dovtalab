<script setup lang="ts">
import { computed } from 'vue'
import { getLocale, setLocale, type AppLocale } from '@/shared/i18n'
import { useI18n } from 'vue-i18n'

// Переключатель языка для публичных экранов (вход, политика) — без запроса к API
const { locale } = useI18n()

const LOCALES: { code: AppLocale; label: string }[] = [
  { code: 'ru', label: 'RU' },
  { code: 'tg', label: 'TJ' },
  { code: 'en', label: 'EN' },
]

// locale из useI18n реактивен — getLocale() читает то же значение
const current = computed<AppLocale>(() => (locale.value as AppLocale) ?? getLocale())
</script>

<template>
  <div class="lang-switch" role="group" aria-label="Language">
    <button
        v-for="l in LOCALES"
        :key="l.code"
        type="button"
        class="lang-switch__btn"
        :class="{ 'lang-switch__btn--active': current === l.code }"
        @click="setLocale(l.code)"
    >
      {{ l.label }}
    </button>
  </div>
</template>

<style scoped lang="scss">
.lang-switch {
  display: inline-flex;
  gap: 2px;
  padding: 3px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 30px;
  box-shadow: 0 2px 10px rgba(35, 73, 112, 0.08);

  &__btn {
    padding: 5px 11px;
    border: none;
    border-radius: 30px;
    background: transparent;
    color: #6B7280;
    font-family: inherit;
    font-size: 12px;
    font-weight: 600;
    letter-spacing: 0.3px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:active { transform: scale(0.95); }

    &--active {
      background: linear-gradient(135deg, #4EBEC2, #234970);
      color: #fff;
      box-shadow: 0 2px 8px rgba(78, 190, 194, 0.35);
    }
  }
}
</style>
