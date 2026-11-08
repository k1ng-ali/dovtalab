import { http } from '@/shared/api/http.ts'
import type { McpAuthorizationDecision, McpAuthorizationInfo, McpConnection } from './types.ts'

const enc = (id: string) => encodeURIComponent(id)

export const getAuthorization = (requestId: string) =>
  http.get<McpAuthorizationInfo>(`/mcp/authorize/${enc(requestId)}`)

export const approveAuthorization = (requestId: string) =>
  http.post<McpAuthorizationDecision>(`/mcp/authorize/${enc(requestId)}/approve`)

export const denyAuthorization = (requestId: string) =>
  http.post<McpAuthorizationDecision>(`/mcp/authorize/${enc(requestId)}/deny`)

export const getConnections = () => http.get<McpConnection[]>('/mcp/connections/')

export const revokeConnection = (grantId: number) => http.delete<void>(`/mcp/connections/${grantId}`)
