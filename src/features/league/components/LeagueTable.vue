<script setup lang="ts">
// Таблица группы лиги: места по баллам недели, разделители зон повышения и понижения.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import UpIcon from '@iconify-vue/solar/double-alt-arrow-up-linear'
import DownIcon from '@iconify-vue/solar/double-alt-arrow-down-linear'
import type { LeagueMember } from '../types.ts'

const props = defineProps<{
  members: LeagueMember[]
  promoteCount: number
  demoteCount: number
}>()

const { t } = useI18n()

// Подписи зон: перед верхом таблицы (повышение) и перед первой строкой зоны понижения
const rows = computed(() => props.members.map((m, i) => {
  const prev = props.members[i - 1]
  return {
    member: m,
    promoteDivider: props.promoteCount > 0 && i === 0 && m.zone === 'promote',
    demoteDivider: props.demoteCount > 0 && m.zone === 'demote' && prev?.zone !== 'demote',
  }
}))

const name = (m: LeagueMember) => m.first_name || (m.username ? '@' + m.username : t('league.player'))
</script>

<template>
  <div class="table ui-card ui-card--list">
    <template v-for="row in rows" :key="row.member.user_id">
      <div v-if="row.promoteDivider" class="divider divider--promote"><UpIcon /> {{ t('league.promoteZone') }}</div>
      <div v-if="row.demoteDivider" class="divider divider--demote"><DownIcon /> {{ t('league.demoteZone') }}</div>

      <div
          class="ui-row row"
          :class="{
            'row--me': row.member.is_me,
            'row--promote': row.member.zone === 'promote',
            'row--demote': row.member.zone === 'demote',
          }"
      >
        <span class="row__rank">{{ row.member.rank }}</span>
        <img v-if="row.member.avatar_url" :src="row.member.avatar_url" class="row__avatar" alt="" />
        <span v-else class="row__avatar row__avatar--fallback">{{ name(row.member)[0] }}</span>
        <span class="row__name">
          {{ name(row.member) }}
          <span v-if="row.member.is_me" class="ui-chip ui-chip--teal">{{ t('common.you') }}</span>
        </span>
        <UpIcon v-if="row.member.zone === 'promote'" class="row__zone row__zone--up" />
        <DownIcon v-else-if="row.member.zone === 'demote'" class="row__zone row__zone--down" />
        <span class="row__points">{{ row.member.points }} xp</span>
      </div>
    </template>
  </div>
</template>

<style scoped lang="scss">
/* ── Разделители зон ── */
.divider {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  font-size: var(--fs-caption);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  border-bottom: 1px solid var(--c-line);

  &--promote { color: var(--c-success); background: var(--c-success-tint); }
  &--demote { color: var(--c-warning-text); background: var(--c-warning-tint); }
}

/* ── Строка ── */
.row {
  min-height: 58px;

  &--me { background: rgba(231, 245, 246, 0.8); }

  &__rank {
    width: 28px;
    flex-shrink: 0;
    text-align: center;
    font-size: 14px;
    font-weight: 800;
    color: var(--c-muted);
  }
  &--promote &__rank { color: var(--c-success); }
  &--demote &__rank { color: var(--c-warning-text); }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    flex-shrink: 0;
    border-radius: 50%;
    object-fit: cover;

    &--fallback {
      background: var(--c-teal-tint);
      color: var(--c-teal-600);
      font-size: 15px;
      font-weight: 800;
    }
  }

  &__name {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    font-size: 15px;
    font-weight: 600;
    color: var(--c-ink);
  }

  &__zone { font-size: 18px; &--up { color: var(--c-success); } &--down { color: var(--c-warning); } }

  &__points { font-size: 14px; font-weight: 800; color: var(--c-navy-900); white-space: nowrap; }
}
</style>
