<script setup lang="ts">
import type { DuelRoom } from '../types.ts'

defineProps<{
  rooms: DuelRoom[]
  loading: boolean
  isSubmitting: boolean
}>()

const emit = defineEmits<{
  (e: 'create'): void
  (e: 'join', room: DuelRoom): void
  (e: 'refresh'): void
}>()
</script>

<template>
  <div class="duel-lobby">
    <section class="hero-banner">
      <div class="hero-content">
        <span class="hero-badge">1 VS 1</span>
        <h1>Битва умов</h1>
        <p class="subtitle">Отвечай быстрее и точнее соперника в реальном времени</p>
      </div>
      <button class="create-btn" type="button" @click="emit('create')">
        Создать дуэль
      </button>
    </section>

    <div class="lobby-header">
      <h2>Ожидают соперника</h2>
      <button class="refresh-btn" type="button" :disabled="loading" @click="emit('refresh')">
        Обновить
      </button>
    </div>

    <div v-if="loading" class="lobby-state">Загрузка комнат...</div>

    <div v-else-if="rooms.length === 0" class="empty-state">
      <div class="empty-icon">⚔️</div>
      <h3>Свободных комнат нет</h3>
      <p>Создайте первую дуэль и пригласите оппонента</p>
    </div>

    <div v-else class="rooms-grid">
      <div v-for="room in rooms" :key="room.id" class="room-card">
        <div class="room-info">
          <span class="room-id">Комната #{{ room.id }}</span>
          <h3 class="room-title">{{ room.quiz_title }}</h3>
          <p class="room-meta">{{ room.question_count }} вопросов · {{ room.participant_count }}/2 игроков</p>
        </div>
        <div class="room-actions">
          <span class="status-online">● Ждёт игрока</span>
          <button
            class="join-btn"
            type="button"
            :disabled="isSubmitting"
            @click="emit('join', room)"
          >
            Войти
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.duel-lobby {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.hero-banner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px 28px;
  background: linear-gradient(135deg, #112437, #234970 65%, #4ebec2);
  border-radius: 24px;
  color: #fff;
  box-shadow: 0 12px 30px rgba(35, 73, 112, 0.18);

  h1 {
    margin: 4px 0 6px;
    font-size: 24px;
    font-weight: 800;
  }

  .subtitle {
    margin: 0;
    font-size: 14px;
    opacity: 0.85;
  }
}

.hero-badge {
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.1em;
  color: #4ebec2;
}

.create-btn {
  padding: 12px 22px;
  border-radius: 14px;
  background: #f6c85f;
  color: #182d43;
  font-weight: 700;
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.2s;
  &:active { transform: scale(0.96); }
}

.lobby-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  h2 {
    margin: 0;
    font-size: 18px;
    color: #234970;
  }
}

.refresh-btn {
  background: none;
  border: none;
  color: #4ebec2;
  font-weight: 600;
  cursor: pointer;
  &:disabled { opacity: 0.5; }
}

.rooms-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.room-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
}

.room-id {
  font-size: 11px;
  font-weight: 700;
  color: #4ebec2;
}

.room-title {
  margin: 2px 0 4px;
  font-size: 16px;
  color: #234970;
}

.room-meta {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

.room-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.status-online {
  font-size: 12px;
  color: #258a72;
  font-weight: 600;
}

.join-btn {
  padding: 8px 18px;
  background: #234970;
  color: #fff;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  cursor: pointer;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  border: 1px dashed rgba(35, 73, 112, 0.2);

  .empty-icon { font-size: 40px; margin-bottom: 10px; }
  h3 { margin: 0 0 6px; color: #234970; }
  p { margin: 0; color: #718096; font-size: 14px; }
}

@media (max-width: 600px) {
  .hero-banner {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
    .create-btn { width: 100%; }
  }
}
</style>