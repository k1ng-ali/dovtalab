<script setup lang="ts">
import BoltIcon from '@iconify-vue/solar/bolt-linear'
import RefreshIcon from '@iconify-vue/solar/refresh-linear'
import ListIcon from '@iconify-vue/solar/notebook-linear'
import UsersIcon from '@iconify-vue/solar/users-group-rounded-linear'
import type { DuelRoom } from '../types.ts'
import { subjectInitials, subjectTint } from '@/shared/lib/subjectTint.ts'

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
    <section class="hero ui-hero">
      <span class="ui-chip ui-chip--on-dark hero__chip"><BoltIcon />1 VS 1</span>
      <div class="hero__text">
        <b class="hero__title">{{ $t('duels.lobbyTitle') }}</b>
        <span class="hero__sub">{{ $t('duels.lobbySubtitle') }}</span>
      </div>
      <button class="ui-btn ui-btn--light hero__cta" type="button" @click="emit('create')">
        {{ $t('duels.create') }}
      </button>
    </section>

    <div class="ui-section-head">
      <h3 class="ui-section-head__title">{{ $t('duels.awaitingOpponent') }}</h3>
      <button class="ui-section-head__link refresh" type="button" :disabled="loading" @click="emit('refresh')">
        <RefreshIcon :class="{ spin: loading }" />{{ $t('duels.refresh') }}
      </button>
    </div>

    <div v-if="loading && rooms.length === 0" class="rooms">
      <div v-for="i in 3" :key="i" class="ui-skeleton room-skeleton" />
    </div>

    <div v-else-if="rooms.length === 0" class="ui-empty ui-card">
      <BoltIcon class="ui-empty__icon" />
      <p class="ui-empty__title">{{ $t('duels.noRoomsTitle') }}</p>
      <p class="ui-empty__text">{{ $t('duels.noRoomsSub') }}</p>
    </div>

    <div v-else class="rooms">
      <div v-for="room in rooms" :key="room.id" class="room ui-card">
        <span class="room__tile" :style="{ background: subjectTint(room.quiz_id).bg, color: subjectTint(room.quiz_id).color }">
          {{ subjectInitials(room.quiz_title) }}
        </span>
        <div class="room__info">
          <b class="room__title">{{ room.quiz_title }}</b>
          <span class="room__meta">
            <span><ListIcon />{{ $t('plural.questions', room.question_count) }}</span>
            <span><UsersIcon />{{ $t('duels.players', { n: room.participant_count }) }}</span>
          </span>
          <span class="room__status"><i />{{ $t('duels.waitingPlayer') }} · {{ $t('duels.room', { id: room.id }) }}</span>
        </div>
        <button
          class="ui-btn ui-btn--primary ui-btn--sm"
          type="button"
          :disabled="isSubmitting"
          @click="emit('join', room)"
        >
          {{ $t('duels.join') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.duel-lobby {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 14px;
  padding: 22px;

  &__chip { letter-spacing: 0.08em; :deep(svg) { font-size: 14px; } }
  &__text { display: flex; flex-direction: column; gap: 4px; }
  &__title { font-size: 24px; line-height: 1.2; }
  &__sub { font-size: 14px; color: rgba(255, 255, 255, 0.92); }
  &__cta { align-self: stretch; min-height: 50px; font-size: 16px; }

  @media (min-width: 768px) {
    display: grid;
    grid-template-columns: 1fr auto;
    align-items: center;
    column-gap: 24px;
    padding: 28px 32px;

    > .hero__chip { justify-self: start; }
    &__chip, &__text { grid-column: 1; }
    &__cta { grid-column: 2; grid-row: 1 / span 2; padding: 0 30px; }
  }
}

.refresh {
  display: inline-flex;
  align-items: center;
  gap: 6px;

  &:disabled { opacity: 0.5; }
  svg { font-size: 16px; }
}

.spin { animation: spin 1s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.rooms {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;
}

.room-skeleton { height: 92px; }

.room {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;

  &__tile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 44px;
    height: 44px;
    flex-shrink: 0;
    border-radius: 14px;
    font-size: 15px;
    font-weight: 800;
  }

  &__info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 0; }

  &__title {
    font-size: 15px;
    font-weight: 700;
    color: var(--c-navy-900);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__meta {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    font-size: 12px;
    color: var(--c-muted);

    span { display: inline-flex; align-items: center; gap: 4px; }
    svg { font-size: 14px; }
  }

  &__status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--c-success);

    i { width: 7px; height: 7px; border-radius: 50%; background: var(--c-success); animation: pulse 1.6s ease infinite; }
  }
}

@keyframes pulse { 50% { opacity: 0.35; } }
</style>
