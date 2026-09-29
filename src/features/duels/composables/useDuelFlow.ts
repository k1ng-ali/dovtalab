// src/features/duels/composables/useDuelFlow.ts
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { BsArrowLeft } from '@kalimahapps/vue-icons'
import { useDuelsStore } from '../store.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import { useAuthStore } from '@/features/auth/store.ts'
import { useDuelSocket, type DuelSocketEvent } from '../useDuelSocket.ts'
import type { DuelGameState, DuelResult, DuelRoom } from '../types.ts'
import { Capacitor } from '@capacitor/core'
import { App as CapApp } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'

export type DuelView = 'lobby' | 'waiting' | 'arena' | 'result'

export function useDuelFlow() {
    const route = useRoute()
    const router = useRouter()
    const store = useDuelsStore()
    const authStore = useAuthStore()
    const headerStore = useHeaderStore()
    const navStore = useNavStore()
    let backButtonListener: PluginListenerHandle | null = null

    const isCreateOpen = ref(false)
    let pollingTimer: ReturnType<typeof setInterval> | null = null

    const roomId = computed(() => {
        const value = Number(route.params.duelId)
        return Number.isInteger(value) && value > 0 ? value : null
    })

    const view = computed<DuelView>(() => {
        if (!roomId.value) return 'lobby'
        if (store.finalResult || store.activeRoom?.status === 'finished') return 'result'
        if (store.activeRoom?.status === 'active' && store.gameState) return 'arena'
        return 'waiting'
    })

    async function surrenderDuel() {
    if (!roomId.value) return
    try {
        await store.surrender(roomId.value)
    } catch (e) {
        console.error('Ошибка сдачи:', e)
    }
    }

    // ── WebSocket обработчик ───────────────────────────────────────────────
    function onSocketEvent(event: DuelSocketEvent) {
        if (event.type === 'room_state' && event.room) {
        store.activeRoom = event.room as unknown as DuelRoom
        } else if (event.type === 'game_state' && event.state) {
        store.gameState = event.state as unknown as DuelGameState
        store.activeRoom = store.gameState.duel
        } else if (event.type === 'round_changed' && event.duel && event.question) {
        store.activeRoom = event.duel as unknown as DuelRoom
        store.gameState = {
            duel: store.activeRoom,
            question: event.question as unknown as DuelGameState['question'],
        }
        } else if (event.type === 'duel_finished' && event.duel && event.result) {
        store.activeRoom = event.duel as unknown as DuelRoom
        store.finalResult = event.result as unknown as DuelResult
        store.gameState = null
        }
        else if (event.type === 'answer_received' && event.duel) {
            store.activeRoom = event.duel as unknown as DuelRoom
            // Можно также отобразить в UI индикатор "Соперник уже ответил!"
        }
    }

    const socket = useDuelSocket(onSocketEvent)

    onMounted(async () => {
    if (Capacitor.isNativePlatform()) {
        backButtonListener = await CapApp.addListener('backButton', () => {
        if (roomId.value !== null) {
            exitDuel()
        } else {
            router.back()
        }
        })
    }
    })

    onBeforeUnmount(() => {
    backButtonListener?.remove()
    })

    function syncNavActions() {
    const currentView = view.value

    if (currentView === 'lobby') {
        navStore.showTabs()
        return
    }

    if (currentView === 'waiting') {
        const actions: any[] = [
        {
            label: 'Выйти',
            variant: 'default',
            icon: BsArrowLeft,
            onClick: () => exitDuel(),
        },
        ]

        // Если текущий пользователь — создатель комнаты:
        if (store.isCreator) {
        actions.push({
            label: store.isSubmitting ? 'Запуск...' : 'Начать дуэль',
            variant: 'primary',
            // Кнопка неактивна, пока соперник не найден или идет отправка
            disabled: !store.opponentFound || store.isSubmitting,
            onClick: async () => {
            if (roomId.value && store.opponentFound && !store.isSubmitting) {
                try {
                await store.startRoom(roomId.value)
                } catch (e) {
                console.error('Ошибка старта дуэли:', e)
                }
            }
            },
        })
        }

        navStore.showActions(actions)
    } else if (currentView === 'arena') {
        navStore.showActions([
        {
            label: 'Сдаться',
            variant: 'default',
            onClick: () => surrenderDuel(),
        },
        {
            label: 'Ответить',
            variant: 'primary',
            disabled: true,
            onClick: () => window.dispatchEvent(new Event('duel-submit-answer')),
        },
        ])
    } else if (currentView === 'result') {
        navStore.showActions([
        {
            label: 'К дуэлям',
            variant: 'primary',
            onClick: () => exitDuel(),
        },
        ])
    }
    }

    // Следим за view, статусом оппонента, ролью создателя и отправкой запроса
    watch(
    [
        view,
        () => store.isCreator,
        () => store.opponentFound,
        () => store.isSubmitting,
    ],
    () => {
        syncNavActions()
    },
    { immediate: true }
    )

    // ── Синхронизация Header и Bottom Navigator ────────────────────────────
    watch(
            view,
            (currentView) => {
                if (currentView === 'lobby') {
                    headerStore.setTitle('Дуэли')
                    headerStore.setLeftAction(null)
                    headerStore.setRightAction(null)
                    headerStore.hideActions()
                } else {
                    headerStore.setTitle(store.activeRoom?.quiz_title ?? 'Дуэль')
                    headerStore.setLeftAction({
                        icon: BsArrowLeft,
                        onClick: () => (currentView === 'arena' ? surrenderDuel() : exitDuel()),
                    })
                    headerStore.hideActions()
                }
            },
            { immediate: true }
        )

    // ── Роутинг & Инициализация ───────────────────────────────────────────
    async function initView() {
        stopPolling()
        socket.disconnect()

        if (roomId.value === null) {
        store.resetRoomState()
        await store.fetchRooms()
        return
        }

        await store.fetchRoom(roomId.value)
        socket.connect(roomId.value, authStore.accessToken)

        pollingTimer = setInterval(() => {
        if (!socket.isConnected.value && roomId.value) {
            store.fetchRoom(roomId.value)
        }
        }, 8000)
    }

    function stopPolling() {
        if (pollingTimer) {
        clearInterval(pollingTimer)
        pollingTimer = null
        }
    }

    async function exitDuel() {
        stopPolling()
        socket.disconnect()

        const currentId = roomId.value
        store.resetRoomState()

        if (currentId) {
            try {
            await store.leaveRoom(currentId)
            } catch (e) {
            console.warn('Не удалось уведомить сервер о выходе:', e)
            }
        }
        // Если мы находимся внутри комнаты (/duels/:duelId)
        if (roomId.value !== null) {
            // Если есть история перехода назад — используем её, иначе явно пушим в корень
            if (window.history.state?.back) {
            router.back()
            } else {
            await router.push('/duels')
            }
        }
    }

    return {
        view,
        roomId,
        isCreateOpen,
        store,
        initView,
        stopPolling,
        exitDuel,
        socket,
    }
}