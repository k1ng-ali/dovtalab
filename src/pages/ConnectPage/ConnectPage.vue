<script setup lang="ts">
// Экран согласия OAuth для внешних ИИ-приложений (MCP): /connect?request_id=…
// Сюда приложение (Claude, ChatGPT…) отправляет браузер пользователя. Вход — обычный Telegram-логин
// платформы (App.vue показывает Auth и возвращает на этот же адрес). После решения браузер уходит
// на redirect_uri приложения, который проверил и собрал бэкенд.
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ShieldIcon from '@iconify-vue/solar/shield-check-linear'
import WarnIcon from '@iconify-vue/solar/danger-triangle-linear'
import PlugIcon from '@iconify-vue/solar/plug-circle-linear'
import McpScopeList from '@/features/mcp/components/McpScopeList.vue'
import { useMcpStore } from '@/features/mcp/store.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'

const { t } = useI18n()
const route = useRoute()
const mcpStore = useMcpStore()
const headerStore = useHeaderStore()
const navStore = useNavStore()

const requestId = computed(() => {
  const raw = route.query.request_id
  return typeof raw === 'string' && /^[\w-]{8,128}$/.test(raw) ? raw : ''
})
const info = computed(() => mcpStore.authorization)
const hasWrite = computed(() => info.value?.scopes.some(s => s.scope.endsWith(':write')) ?? false)

// Решение принято: куда возвращаемся (ссылка-запасной вариант, если браузер не перешёл сам)
const redirectTo = ref<string | null>(null)
const decided = ref<'approved' | 'denied' | null>(null)

type View = 'invalid' | 'loading' | 'error' | 'consent' | 'done'
const view = computed<View>(() => {
  if (!requestId.value) return 'invalid'
  if (decided.value) return 'done'
  if (mcpStore.isLoading) return 'loading'
  if (!info.value) return 'error'
  return 'consent'
})

async function decide(approve: boolean) {
  if (!requestId.value || mcpStore.isSubmitting) return
  const url = await mcpStore.decide(requestId.value, approve)
  if (!url) {
    mcpStore.authorization = null      // запрос истёк или уже использован — показываем ошибку
    return
  }
  decided.value = approve ? 'approved' : 'denied'
  redirectTo.value = url
  window.location.assign(url)
}

onMounted(() => {
  headerStore.setTitle(t('mcp.consentTitle'))
  headerStore.setLeftAction(null)
  headerStore.setRightAction(null)
  navStore.showTabs()
  if (requestId.value) mcpStore.fetchAuthorization(requestId.value)
})
</script>

<template>
  <div class="connect ui-page">
    <Transition name="slide" mode="out-in">
      <!-- 1. Нет request_id — открыли страницу не из приложения -->
      <div v-if="view === 'invalid'" key="invalid" class="ui-empty ui-card">
        <PlugIcon class="ui-empty__icon" />
        <p class="ui-empty__title">{{ t('mcp.invalidTitle') }}</p>
        <p class="ui-empty__text">{{ t('mcp.invalidText') }}</p>
      </div>

      <!-- 2. Загрузка -->
      <div v-else-if="view === 'loading'" key="loading">
        <div class="ui-skeleton connect__skeleton-hero" />
        <div class="ui-skeleton connect__skeleton-card" />
      </div>

      <!-- 3. Запрос истёк / не найден / MCP выключен -->
      <div v-else-if="view === 'error'" key="error" class="ui-empty ui-card">
        <WarnIcon class="ui-empty__icon" />
        <p class="ui-empty__title">{{ t('mcp.expiredTitle') }}</p>
        <p class="ui-empty__text">{{ t('mcp.expiredText') }}</p>
      </div>

      <!-- 4. Согласие -->
      <div v-else-if="view === 'consent' && info" key="consent" class="connect__body">
        <section class="hero ui-card ui-card--pad">
          <span class="hero__icon"><PlugIcon /></span>
          <h2 class="hero__title">{{ t('mcp.wantsAccess', { client: info.client_name }) }}</h2>
          <p class="hero__host">
            {{ t('mcp.returnTo') }} <b>{{ info.redirect_host }}</b>
          </p>
        </section>

        <section class="ui-card ui-card--pad">
          <h3 class="connect__label">{{ t('mcp.willBeAble') }}</h3>
          <McpScopeList :scopes="info.scopes" />
        </section>

        <section class="note">
          <ShieldIcon class="note__icon" />
          <p>
            {{ t('mcp.safetyNote') }}
            <template v-if="hasWrite"> {{ t('mcp.writeNote') }}</template>
          </p>
        </section>

        <p class="connect__warn">{{ t('mcp.onlyIfYou', { client: info.client_name }) }}</p>

        <div class="connect__actions">
          <button
              type="button"
              class="ui-btn ui-btn--ghost"
              :disabled="mcpStore.isSubmitting"
              @click="decide(false)"
          >
            {{ t('mcp.deny') }}
          </button>
          <button
              type="button"
              class="ui-btn ui-btn--primary"
              :disabled="mcpStore.isSubmitting"
              @click="decide(true)"
          >
            {{ t('mcp.allow') }}
          </button>
        </div>
      </div>

      <!-- 5. Решение принято — возвращаем в приложение -->
      <div v-else key="done" class="ui-empty ui-card">
        <ShieldIcon class="ui-empty__icon" />
        <p class="ui-empty__title">
          {{ decided === 'approved' ? t('mcp.approvedTitle') : t('mcp.deniedTitle') }}
        </p>
        <p class="ui-empty__text">{{ t('mcp.returning') }}</p>
        <a v-if="redirectTo" :href="redirectTo" class="ui-btn ui-btn--secondary ui-btn--sm">
          {{ t('mcp.returnManually') }}
        </a>
      </div>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.connect {
  max-width: 560px;
  margin: 0 auto;

  &__body {
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  &__label {
    margin: 0 0 12px;
    font-size: 13px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: #9CA3AF;
  }

  &__warn {
    margin: 0;
    text-align: center;
    font-size: 13px;
    color: #6B7280;
  }

  &__actions {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }

  &__skeleton-hero {
    height: 170px;
    border-radius: 20px;
    margin-bottom: 14px;
  }

  &__skeleton-card {
    height: 200px;
    border-radius: 20px;
  }
}

/* ── Hero ──────────────────────────────────────────── */
.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 8px;

  &__icon {
    width: 56px;
    height: 56px;
    border-radius: 18px;
    display: grid;
    place-items: center;
    font-size: 28px;
    color: #fff;
    background: linear-gradient(135deg, #4EBEC2, #234970);
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);
  }

  &__title {
    margin: 4px 0 0;
    font-size: 19px;
    line-height: 1.3;
    color: #234970;
    word-break: break-word;
  }

  &__host {
    margin: 0;
    font-size: 13px;
    color: #6B7280;
    word-break: break-all;

    b {
      color: #234970;
    }
  }
}

/* ── Note ──────────────────────────────────────────── */
.note {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  background: rgba(78, 190, 194, 0.1);
  color: #234970;
  font-size: 13px;
  line-height: 1.45;

  p {
    margin: 0;
  }

  &__icon {
    flex-shrink: 0;
    font-size: 20px;
    color: #3a9ea2;
  }
}
</style>
