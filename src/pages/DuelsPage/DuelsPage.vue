<script setup lang="ts">
import { onBeforeUnmount, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useDuelFlow } from '@/features/duels/composables/useDuelFlow.ts'
import type { DuelCreatePayload, DuelRoom} from '@/features/duels/types.ts'
import type { UserAnswerPayload } from '@/features/quizPage/types.ts'
import DuelLobby from '@/features/duels/components/DuelLobby.vue'
import DuelWaitingRoom from '@/features/duels/components/DuelWaitingRoom.vue'
import DuelArena from '@/features/duels/components/DuelArena.vue'
import DuelResult from '@/features/duels/components/DuelResult.vue'
import CreateDuelModal from '@/features/duels/components/CreateDuelModal.vue'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'

const route = useRoute()
const router = useRouter()
const flow = useDuelFlow()
const { store } = flow
const headerStore = useHeaderStore()
const navStore = useNavStore()

onMounted(() => {
  flow.initView()
})

watch(
  () => route.params.duelId,
  (newId, oldId) => {
    if (newId !== oldId) {
      flow.initView()
    }
  }
)

onBeforeUnmount(() => {
  flow.stopPolling()
  flow.socket.disconnect()
})

// Сбрасываем хидер и восстанавливаем нижние табы при уходе с вкладки
onUnmounted(() => {
  headerStore.reset()
  navStore.showTabs()
})

// ── Handlers ─────────────────────────────────────────────────────────────
async function handleCreate(payload: DuelCreatePayload) {
  try {
    const room = await store.createRoom(payload)
    flow.isCreateOpen.value = false
    await router.push(`/duels/${room.id}`)
  } catch {
    alert('Не удалось создать комнату')
  }
}

async function handleJoin(room: DuelRoom) {
  try {
    await store.joinRoom(room.id)
    await router.push(`/duels/${room.id}`)
  } catch {
    await store.fetchRooms()
  }
}

// DuelsPage.vue
async function handleAnswer(answer: UserAnswerPayload) {
  if (!flow.roomId.value) return
  
  try {
    const res = await store.submitAnswer(flow.roomId.value, answer)

    if (res.is_correct) {
      headerStore.showNotification('Правильно! 🎉', 'success', 2000)
    } else {
      headerStore.showNotification('Неверно 😕', 'error', 2000)
    }
    // НЕ перезаписываем store.gameState вручную! Ждем сокетного round_changed
  } catch (error) {
    headerStore.showNotification('Ошибка отправки ответа', 'error', 2500)
  }
}
</script>

<template>
  <div class="duels-page">
    <div class="page-body">
      <Transition name="slide" mode="out-in">

        <!-- 1. Лобби и список комнат -->
        <div v-if="flow.view.value === 'lobby'" key="lobby">
          <DuelLobby
            :rooms="store.rooms"
            :loading="store.isLoading"
            :is-submitting="store.isSubmitting"
            @create="flow.isCreateOpen.value = true"
            @join="handleJoin"
            @refresh="store.fetchRooms"
          />
        </div>

        <!-- 2. Комната ожидания оппонента -->
        <div v-else-if="flow.view.value === 'waiting' && store.activeRoom" key="waiting">
          <DuelWaitingRoom
            :room="store.activeRoom"
            :is-creator="store.isCreator"
            :opponent-found="store.opponentFound"
            :is-submitting="store.isSubmitting"
            @start="store.startRoom(store.activeRoom.id)"
            @leave="flow.exitDuel"
          />
        </div>

        <!-- 3. Сам раунд дуэли (Арена) -->
        <div v-else-if="flow.view.value === 'arena' && store.gameState" key="arena">
          <DuelArena
            :game-state="store.gameState"
            :is-submitting="store.isSubmitting"
            @answer="handleAnswer"
          />
        </div>

        <!-- 4. Результаты игры -->
        <div v-else-if="flow.view.value === 'result' && store.finalResult" key="result">
          <DuelResult
            :result="store.finalResult"
            :current-user-id="store.currentUserId"
          />
        </div>

      </Transition>
    </div>

    <!-- Модалка создания комнаты -->
    <CreateDuelModal
      v-if="flow.isCreateOpen.value"
      :is-submitting="store.isSubmitting"
      @close="flow.isCreateOpen.value = false"
      @submit="handleCreate"
    />
  </div>
</template>

<style scoped lang="scss">
.duels-page {
  min-height: 100vh;
  background: #f6f6f6;
  display: flex;
  justify-content: center;
  overflow-x: hidden;
}

.page-body {
  padding: 20px;
  padding-top: 80px;   /* под фиксированный Header */
  padding-bottom: 100px; /* над Navigator */
  max-width: 900px;
  width: 100%;
}

/* ── Анимация Slide (как в QuizPage) ── */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>