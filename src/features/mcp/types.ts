// src/features/mcp/types.ts — зеркало app/schemas/mcp.py (экран согласия и подключённые приложения)

export interface McpScope {
  scope: string
  description: string
}

/** GET /mcp/authorize/{request_id} — что запрашивает внешнее приложение */
export interface McpAuthorizationInfo {
  client_name: string
  redirect_host: string
  scopes: McpScope[]
  expires_at: string
}

/** approve / deny — куда отправить браузер (redirect_uri клиента с code или error) */
export interface McpAuthorizationDecision {
  redirect_to: string
}

/** GET /mcp/connections/ — выданные доступы */
export interface McpConnection {
  id: number
  client_name: string
  redirect_host: string
  scopes: McpScope[]
  created_at: string
  last_used_at: string | null
}
