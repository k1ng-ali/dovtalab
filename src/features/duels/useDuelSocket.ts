import { onBeforeUnmount, ref } from 'vue'

export interface DuelSocketEvent {
  type: 'room_state' | 'game_state' | 'answer_received' | 'round_changed' | 'duel_finished' | 'pong'
  room?: Record<string, unknown>
  state?: Record<string, unknown>
  duel?: Record<string, unknown>
  question?: Record<string, unknown>
  result?: Record<string, unknown>
}

export function useDuelSocket(onEvent: (event: DuelSocketEvent) => void) {
  const isConnected = ref(false)
  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let stopped = false
  let pingInterval: ReturnType<typeof setInterval> | null = null

  function connect(duelId: number, token: string | null) {
    disconnect()
    stopped = false
    if (!token) return

    const apiUrl = import.meta.env.VITE_API_URL ?? window.location.origin
    const url = new URL(apiUrl)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/$/, '')}/api/v1/duels/ws/${duelId}`
    url.searchParams.set('token', token)

    socket = new WebSocket(url.toString())
    
    socket.onopen = () => {
      isConnected.value = true
      pingInterval = setInterval(() => {
        if (socket?.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'ping' }))
        }
      }, 15000)
    }
    socket.onmessage = (message) => {
      try {
        onEvent(JSON.parse(message.data) as DuelSocketEvent)
      } catch {
        // Ignore malformed events and keep the connection alive.
      }
    }
    socket.onclose = () => {
      if (pingInterval !== null) {
        clearInterval(pingInterval)
        pingInterval = null
      }
      isConnected.value = false
      socket = null
      if (!stopped) {
        reconnectTimer = setTimeout(() => connect(duelId, token), 2000)
      }
    }
    socket.onerror = () => socket?.close()
  }

  function disconnect() {
    stopped = true

    if (pingInterval !== null) {
      clearInterval(pingInterval)
      pingInterval = null
    }

    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    socket?.close()
    socket = null
    isConnected.value = false
  }

  onBeforeUnmount(disconnect)

  return { connect, disconnect, isConnected }
}
