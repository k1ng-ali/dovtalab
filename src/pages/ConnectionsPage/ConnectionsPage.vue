<script setup lang="ts">
// Подключённые приложения (MCP): какие ИИ-приложения имеют доступ к аккаунту и с какими разрешениями.
// «Отключить» отзывает доступ сразу — приложение теряет его на следующем запросе.
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Modal } from 'ant-design-vue'
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import PlugIcon from '@iconify-vue/solar/plug-circle-linear'
import McpConnectionCard from '@/features/mcp/components/McpConnectionCard.vue'
import { useMcpStore } from '@/features/mcp/store.ts'
import type { McpConnection } from '@/features/mcp/types.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'

const { t } = useI18n()
const router = useRouter()
const mcpStore = useMcpStore()
const headerStore = useHeaderStore()
const navStore = useNavStore()

function confirmRevoke(connection: McpConnection) {
  Modal.confirm({
    title: t('mcp.revokeTitle', { client: connection.client_name }),
    content: t('mcp.revokeText'),
    okText: t('mcp.revoke'),
    okType: 'danger',
    cancelText: t('common.cancel'),
    onOk: async () => {
      try {
        await mcpStore.revoke(connection.id)
        headerStore.showNotification(t('mcp.revoked'), 'success', 2500)
      } catch {
        headerStore.showNotification(t('common.unknownError'), 'error', 2500)
      }
    },
  })
}

onMounted(() => {
  headerStore.setTitle(t('mcp.connectionsTitle'))
  headerStore.setLeftAction({ icon: BsArrowLeft, onClick: () => router.push('/profile') })
  headerStore.setRightAction(null)
  navStore.showTabs()
  mcpStore.fetchConnections()
})
</script>

<template>
  <div class="connections ui-page">
    <p class="connections__intro">{{ t('mcp.connectionsIntro') }}</p>

    <!-- 1. Загрузка -->
    <template v-if="mcpStore.isLoading && !mcpStore.connections.length">
      <div class="ui-skeleton connections__skeleton" />
      <div class="ui-skeleton connections__skeleton" />
    </template>

    <!-- 2. Ошибка (404 — MCP пока выключен) -->
    <div v-else-if="mcpStore.errorStatus !== null" class="ui-empty ui-card">
      <PlugIcon class="ui-empty__icon" />
      <p class="ui-empty__title">
        {{ mcpStore.errorStatus === 404 ? t('mcp.unavailableTitle') : t('common.unknownError') }}
      </p>
      <button
          v-if="mcpStore.errorStatus !== 404"
          type="button"
          class="ui-btn ui-btn--secondary ui-btn--sm"
          @click="mcpStore.fetchConnections()"
      >
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- 3. Пусто -->
    <div v-else-if="!mcpStore.connections.length" class="ui-empty ui-card">
      <PlugIcon class="ui-empty__icon" />
      <p class="ui-empty__title">{{ t('mcp.emptyTitle') }}</p>
      <p class="ui-empty__text">{{ t('mcp.emptyText') }}</p>
    </div>

    <!-- 4. Список -->
    <div v-else class="connections__list">
      <McpConnectionCard
          v-for="c in mcpStore.connections"
          :key="c.id"
          :connection="c"
          :disabled="mcpStore.isSubmitting"
          @revoke="confirmRevoke"
      />
    </div>
  </div>
</template>

<style scoped lang="scss">
.connections {
  max-width: 640px;
  margin: 0 auto;

  &__intro {
    margin: 0 0 14px;
    color: #6B7280;
    font-size: 14px;
    line-height: 1.45;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__skeleton {
    height: 190px;
    border-radius: 20px;
    margin-bottom: 14px;
  }
}
</style>
