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
import { Modal } from 'ant-design-vue'

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

    function surrenderDuel() {
        const id = roomId.value
        if (!id) return
        Modal.confirm({
            title: 'Сдаться?',
            content: 'Победа будет засчитана сопернику.',
            okText: 'Сдаться',
            cancelText: 'Продолжить',
            okButtonProps: { danger: true },
            async onOk() {
                try {
                    await store.surrender(id)
                } catch (e) {
                    console.error('Ошибка сдачи:', e)
                    // Скорее всего дуэль уже завершилась — синхронизируемся с сервером
                    await store.fetchRoom(id)
                }
            },
        })
    }

    async function startDuel() {
        if (!roomId.value || !store.opponentFound || store.isSubmitting) return
        try {
            await store.startRoom(roomId.value)
        } catch (e) {
            console.error('Ошибка старта дуэли:', e)
            headerStore.showNotification('Не удалось начать дуэль', 'error', 2500)
            await store.fetchRoom(roomId.value)
        }
    }

    // ── WebSocket обработчик ───────────────────────────────────────────────
    function onSocketEvent(event: DuelSocketEvent) {
        if (event.type === 'room_state' && event.room) {
            const room = event.room as unknown as DuelRoom
            store.applyRoom(room)
            // Финиш без итогов (например, переподключение) — догружаем результат,
            // иначе view = 'result', а показать нечего
            if (room.status === 'finished' && !store.finalResult) {
                store.fetchResult(room.id).catch(() => {})
            }
        } else if (event.type === 'game_state' && event.state) {
            const state = event.state as unknown as DuelGameState
            store.applyRoundUpdate(state.duel, state.question)
        } else if (event.type === 'round_changed' && event.duel && event.question) {
            store.applyRoundUpdate(
                event.duel as unknown as DuelRoom,
                event.question as unknown as DuelGameState['question'],
            )
        } else if (event.type === 'duel_finished' && event.duel && event.result) {
            store.applyRoundUpdate(
                event.duel as unknown as DuelRoom,
                null,
                event.result as unknown as DuelResult,
            )
        } else if (event.type === 'answer_received' && event.duel) {
            store.applyRoundUpdate(event.duel as unknown as DuelRoom)
        }
    }

    const socket = useDuelSocket(onSocketEvent)

    onMounted(async () => {
    if (Capacitor.isNativePlatform()) {
        // Так же, как кнопка «назад» в шапке: из арены — сдаться, а не молча уйти
        // (иначе дуэль остаётся active и соперник ждёт таймаутов)
        backButtonListener = await CapApp.addListener('backButton', () => {
        if (view.value === 'arena') {
            surrenderDuel()
        } else if (roomId.value !== null) {
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
            onClick: () => startDuel(),
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
        socket.connect(roomId.value, () => authStore.accessToken)

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
        // Покинуть можно только комнату в лобби; из finished/cancelled просто уходим
        const canLeave = ['waiting', 'ready'].includes(store.activeRoom?.status ?? '')
        store.resetRoomState()

        if (currentId && canLeave) {
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
        startDuel,
        socket,
    }
}