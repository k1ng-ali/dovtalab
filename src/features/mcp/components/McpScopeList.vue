<script setup lang="ts">
// Список разрешений (scope) человеческим языком; запись выделена отдельно
import { useI18n } from 'vue-i18n'
import EyeIcon from '@iconify-vue/solar/eye-linear'
import PenIcon from '@iconify-vue/solar/pen-new-square-linear'
import type { McpScope } from '../types.ts'

defineProps<{ scopes: McpScope[] }>()

const { t, te } = useI18n()

// Ключ i18n: studio:write → mcp.scope.studio_write; нет перевода — текст с бэкенда
const label = (s: McpScope) => {
  const key = `mcp.scope.${s.scope.replace(/[^a-z]/gi, '_')}`
  return te(key) ? t(key) : s.description
}
const isWrite = (s: McpScope) => /:(write|practice)$/.test(s.scope)
</script>

<template>
  <ul class="scopes">
    <li v-for="s in scopes" :key="s.scope" class="scope" :class="{ 'scope--write': isWrite(s) }">
      <span class="scope__icon">
        <PenIcon v-if="isWrite(s)" />
        <EyeIcon v-else />
      </span>
      <span class="scope__text">{{ label(s) }}</span>
    </li>
  </ul>
</template>

<style scoped lang="scss">
.scopes {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.scope {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 14px;
  line-height: 1.4;
  color: #234970;

  &__icon {
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    border-radius: 10px;
    display: grid;
    place-items: center;
    font-size: 17px;
    background: rgba(78, 190, 194, 0.14);
    color: #3a9ea2;
  }

  &__text {
    padding-top: 5px;
  }

  &--write &__icon {
    background: rgba(245, 158, 11, 0.14);
    color: #d97706;
  }
}
</style>
