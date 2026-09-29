<!-- src/features/duels/components/DuelWaitingRoom.vue -->
<script setup lang="ts">
import type { DuelRoom } from '../types.ts'

defineProps<{
  room: DuelRoom
  isCreator: boolean
  opponentFound: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  (e: 'leave'): void
}>()
</script>

<template>
  <div class="waiting-card">
    <span class="room-badge">КОМНАТА #{{ room.id }}</span>
    <h1 class="room-title">{{ room.quiz_title }}</h1>
    <p class="room-meta">{{ room.question_count }} вопросов · {{ room.participant_count }}/2 участников</p>

    <!-- VS Illustration -->
    <div class="versus-wrapper" :class="{ ready: opponentFound }">
      <div class="avatar you">
        <span>Вы</span>
      </div>
      <div class="versus-text">VS</div>
      <div class="avatar opponent">
        <span>{{ opponentFound ? 'Соперник' : '?' }}</span>
      </div>
    </div>

    <div class="status-box">
      <span class="status-indicator" :class="{ ready: opponentFound }" />
      <span class="status-text">
        {{ opponentFound ? 'Соперник подключился!' : 'Ожидаем второго игрока...' }}
      </span>
    </div>

    <p class="status-desc">
      {{
        opponentFound
          ? isCreator
            ? 'Соперник в комнате. Нажмите «Начать дуэль» внизу экрана.'
            : 'Комната готова. Ожидайте, пока создатель запустит дуэль.'
          : 'Комната открыта для подключения. Слот обновится автоматически.'
      }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.waiting-card {
  max-width: 520px;
  margin: 0 auto;
  padding: 32px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 28px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.06);
}

.room-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #4ebec2;
}

.room-title {
  margin: 8px 0 4px;
  font-size: 22px;
  color: #234970;
}

.room-meta {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

.versus-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  margin: 36px 0;

  .avatar {
    width: 72px;
    height: 72px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
  }

  .you {
    background: #e6f4f5;
    color: #234970;
    border: 2px solid #4ebec2;
  }

  .opponent {
    background: #edf2f7;
    color: #a0aec0;
    border: 2px dashed #cbd5e0;
  }

  &.ready .opponent {
    background: #e6f7f2;
    color: #258a72;
    border: 2px solid #258a72;
  }

  .versus-text {
    font-size: 20px;
    font-weight: 900;
    color: #4ebec2;
  }
}

.status-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 16px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.04);
  font-size: 13px;
  font-weight: 600;
  color: #234970;
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #f6c85f;
  &.ready { background: #258a72; }
}

.status-desc {
  margin: 14px 0 0;
  font-size: 13px;
  color: #718096;
  line-height: 1.5;
}
</style>