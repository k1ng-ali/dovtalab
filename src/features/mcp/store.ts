// src/features/mcp/store.ts — подключение внешних ИИ-приложений (MCP): согласие и список доступов
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from './api.ts'
import type { McpAuthorizationInfo, McpConnection } from './types.ts'

/** Куда можно отправить браузер после решения: только http(s) (redirect_uri проверяет и бэкенд) */
export function isSafeRedirect(url: string): boolean {
  try {
    const { protocol } = new URL(url)
    return protocol === 'https:' || protocol === 'http:'
  } catch {
    return false
  }
}

export const useMcpStore = defineStore('mcp', () => {
  // ── State ─────────────────────────────────────────────────────────────
  const authorization = ref<McpAuthorizationInfo | null>(null)
  const connections = ref<McpConnection[]>([])
  const isLoading = ref(false)
  const isSubmitting = ref(false)
  const errorStatus = ref<number | null>(null)     // 404 — запрос истёк или MCP выключен

  // ── Actions: экран согласия ───────────────────────────────────────────
  async function fetchAuthorization(requestId: string) {
    isLoading.value = true
    errorStatus.value = null
    authorization.value = null
    try {
      const { data } = await api.getAuthorization(requestId)
      authorization.value = data
    } catch (e: any) {
      errorStatus.value = e?.response?.status ?? 0
    } finally {
      isLoading.value = false
    }
  }

  /** Решение пользователя → URL возврата в приложение (или null, если его нельзя открыть) */
  async function decide(requestId: string, approve: boolean): Promise<string | null> {
    isSubmitting.value = true
    try {
      const { data } = approve
        ? await api.approveAuthorization(requestId)
        : await api.denyAuthorization(requestId)
      return isSafeRedirect(data.redirect_to) ? data.redirect_to : null
    } catch (e: any) {
      errorStatus.value = e?.response?.status ?? 0
      return null
    } finally {
      isSubmitting.value = false
    }
  }

  // ── Actions: подключённые приложения ──────────────────────────────────
  async function fetchConnections() {
    isLoading.value = true
    errorStatus.value = null
    try {
      const { data } = await api.getConnections()
      connections.value = data
    } catch (e: any) {
      errorStatus.value = e?.response?.status ?? 0
    } finally {
      isLoading.value = false
    }
  }

  async function revoke(grantId: number) {
    isSubmitting.value = true
    try {
      await api.revokeConnection(grantId)
      connections.value = connections.value.filter(c => c.id !== grantId)
    } finally {
      isSubmitting.value = false
    }
  }

  return {
    authorization, connections, isLoading, isSubmitting, errorStatus,
    fetchAuthorization, decide, fetchConnections, revoke,
  }
})
