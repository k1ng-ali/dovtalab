<script setup lang="ts">
// Карточка выданного доступа: приложение, домен возврата, разрешения, кнопка «Отключить»
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import PlugIcon from '@iconify-vue/solar/plug-circle-linear'
import McpScopeList from './McpScopeList.vue'
import type { McpConnection } from '../types.ts'

const props = defineProps<{ connection: McpConnection; disabled?: boolean }>()
const emit = defineEmits<{ (e: 'revoke', connection: McpConnection): void }>()

const { t, locale } = useI18n()

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString(locale.value === 'en' ? 'en-GB' : 'ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

const lastUsed = computed(() =>
  props.connection.last_used_at ? fmt(props.connection.last_used_at) : t('mcp.neverUsed'),
)
</script>

<template>
  <article class="conn ui-card ui-card--pad">
    <header class="conn__head">
      <span class="ui-tile-icon conn__icon"><PlugIcon /></span>
      <div class="conn__title">
        <b>{{ connection.client_name }}</b>
        <span>{{ connection.redirect_host }}</span>
      </div>
    </header>

    <McpScopeList :scopes="connection.scopes" />

    <p class="conn__meta">
      {{ t('mcp.connectedAt', { date: fmt(connection.created_at) }) }} ·
      {{ t('mcp.lastUsed', { date: lastUsed }) }}
    </p>

    <button
        type="button"
        class="ui-btn ui-btn--danger ui-btn--sm ui-btn--block"
        :disabled="disabled"
        @click="emit('revoke', connection)"
    >
      {{ t('mcp.revoke') }}
    </button>
  </article>
</template>

<style scoped lang="scss">
.conn {
  display: flex;
  flex-direction: column;
  gap: 14px;

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__icon {
    font-size: 22px;
  }

  &__title {
    display: flex;
    flex-direction: column;
    min-width: 0;

    b {
      color: #234970;
      font-size: 16px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    span {
      color: #6B7280;
      font-size: 13px;
    }
  }

  &__meta {
    margin: 0;
    color: #9CA3AF;
    font-size: 12px;
  }
}
</style>
