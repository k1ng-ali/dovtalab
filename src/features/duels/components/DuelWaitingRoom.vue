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
  <div class="waiting-card ui-card">
    <span class="ui-chip ui-chip--teal">{{ $t('duels.room', { id: room.id }) }}</span>
    <h1 class="room-title">{{ room.quiz_title }}</h1>
    <p class="room-meta">{{ $t('plural.questions', room.question_count) }} · {{ $t('duels.participants', { n: room.participant_count }) }}</p>

    <!-- VS Illustration -->
    <div class="versus-wrapper" :class="{ ready: opponentFound }">
      <div class="avatar you">
        <span>{{ $t('common.you') }}</span>
      </div>
      <div class="versus-text">VS</div>
      <div class="avatar opponent">
        <span>{{ opponentFound ? $t('duels.opponent') : '?' }}</span>
      </div>
    </div>

    <div class="status-box">
      <span class="status-indicator" :class="{ ready: opponentFound }" />
      <span class="status-text">
        {{ opponentFound ? $t('duels.opponentJoined') : $t('duels.waitingSecond') }}
      </span>
    </div>

    <p class="status-desc">
      {{
        opponentFound
          ? isCreator
            ? $t('duels.statusCreator')
            : $t('duels.statusGuest')
          : $t('duels.statusOpen')
      }}
    </p>
  </div>
</template>

<style scoped lang="scss">
.waiting-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 520px;
  margin: 0 auto;
  padding: 28px 22px;
  text-align: center;
}

.room-title {
  margin: 12px 0 4px;
  font-size: var(--fs-h1);
  font-weight: 800;
  color: var(--c-navy-900);
}

.room-meta {
  margin: 0;
  font-size: 13px;
  color: var(--c-muted);
}

.versus-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 18px;
  margin: 32px 0;

  .avatar {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 800;
    font-size: 14px;
  }

  .you {
    background: var(--grad-primary);
    color: #FFFFFF;
    box-shadow: 0 0 0 4px #FFFFFF, var(--shadow-hero);
  }

  .opponent {
    background: rgba(255, 255, 255, 0.6);
    color: var(--c-muted-2);
    font-size: 24px;
    box-shadow: inset 0 0 0 2px var(--c-line-2);
    animation: breathe 1.8s ease-in-out infinite;
  }

  &.ready .opponent {
    background: var(--c-teal-tint);
    color: var(--c-teal-600);
    font-size: 14px;
    box-shadow: 0 0 0 4px #FFFFFF, inset 0 0 0 2px var(--c-teal-600);
    animation: none;
  }

  .versus-text {
    font-size: 18px;
    font-weight: 900;
    color: var(--c-navy-900);
    letter-spacing: 0.05em;
  }
}

@keyframes breathe { 50% { transform: scale(0.94); opacity: 0.7; } }

.status-box {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border-radius: var(--r-pill);
  background: rgba(35, 73, 112, 0.06);
  font-size: 13px;
  font-weight: 700;
  color: var(--c-navy-900);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--c-wrong);
  animation: pulse 1.4s ease infinite;
  &.ready { background: var(--c-success); animation: none; }
}

@keyframes pulse { 50% { opacity: 0.35; } }

.status-desc {
  margin: 14px 0 0;
  max-width: 340px;
  font-size: 13px;
  color: var(--c-muted);
  line-height: 1.5;
}
</style>
