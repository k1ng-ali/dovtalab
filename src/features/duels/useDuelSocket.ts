import { onBeforeUnmount, ref } from 'vue'

export interface DuelSocketEvent {
  type: 'room_state' | 'game_state' | 'answer_received' | 'round_changed' | 'duel_finished' | 'pong'
  room?: Record<string, unknown>
  state?: Record<string, unknown>
  duel?: Record<string, unknown>
  question?: Record<string, unknown>
  result?: Record<string, unknown>
}

const PING_INTERVAL = 15000
const RECONNECT_BASE_DELAY = 2000
const RECONNECT_MAX_DELAY = 15000
const POLICY_VIOLATION = 1008 // сервер отклонил токен / доступ

export function useDuelSocket(onEvent: (event: DuelSocketEvent) => void) {
  const isConnected = ref(false)
  let socket: WebSocket | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let pingInterval: ReturnType<typeof setInterval> | null = null
  let reconnectAttempts = 0

  function clearTimers() {
    if (pingInterval !== null) {
      clearInterval(pingInterval)
      pingInterval = null
    }
    if (reconnectTimer !== null) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }
  }

  // getToken вызывается при каждом (пере)подключении — access-токен живёт 15 минут
  // и обновляется http-интерцептором, поэтому нельзя запоминать его один раз
  function connect(duelId: number, getToken: () => string | null) {
    disconnect()

    const token = getToken()
    if (!token) return

    const apiUrl = import.meta.env.VITE_API_URL ?? window.location.origin
    const url = new URL(apiUrl)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    url.pathname = `${url.pathname.replace(/\/$/, '')}/api/v1/duels/ws/${duelId}`

    const ws = new WebSocket(url.toString())
    socket = ws

    // Все обработчики игнорируют события устаревшего сокета: его onclose приходит
    // асинхронно уже после создания нового и не должен трогать текущее состояние
    ws.onopen = () => {
      if (ws !== socket) return
      // Токен первым сообщением, а не в URL — URL попадает в логи прокси
      ws.send(JSON.stringify({ type: 'auth', token }))
      isConnected.value = true
      pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }))
        }
      }, PING_INTERVAL)
    }
    ws.onmessage = (message) => {
      if (ws !== socket) return
      // Сервер шлёт room_state сразу после авторизации — только теперь соединение рабочее,
      // а не на onopen: отказ по токену (1008) тоже проходит через open
      reconnectAttempts = 0
      try {
        onEvent(JSON.parse(message.data) as DuelSocketEvent)
      } catch {
        // Ignore malformed events and keep the connection alive.
      }
    }
    ws.onclose = (event) => {
      if (ws !== socket) return
      clearTimers()
      isConnected.value = false
      socket = null

      // При 1008 (протух токен) ждём дольше — за это время polling через http
      // поймает 401 и обновит токен, следующая попытка возьмёт уже новый
      reconnectAttempts += 1
      const base = event.code === POLICY_VIOLATION ? RECONNECT_MAX_DELAY / 2 : RECONNECT_BASE_DELAY
      const delay = Math.min(base * 2 ** (reconnectAttempts - 1), RECONNECT_MAX_DELAY)
      reconnectTimer = setTimeout(() => connect(duelId, getToken), delay)
    }
    ws.onerror = () => ws.close()
  }

  function disconnect() {
    clearTimers()
    reconnectAttempts = 0

    const ws = socket
    socket = null
    isConnected.value = false
    ws?.close()
  }

  onBeforeUnmount(disconnect)

  return { connect, disconnect, isConnected }
}
