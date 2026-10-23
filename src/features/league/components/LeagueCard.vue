<script setup lang="ts">
// Карточка лиги на главной: уровень и моё место — тап открывает /league.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ArrowRight from '@iconify-vue/solar/alt-arrow-right-linear'
import LeagueBadge from './LeagueBadge.vue'
import type { League } from '../types.ts'

const props = defineProps<{ league: League | null }>()

const { t } = useI18n()
const router = useRouter()

const subtitle = computed(() => {
  const l = props.league
  if (!l) return ''
  if (!l.joined || !l.me) return t('league.cardJoin')
  return t('league.cardPlace', { rank: l.me.rank, size: l.group_size, points: l.me.points })
})
</script>

<template>
  <button v-if="league" type="button" class="league-card ui-card" @click="router.push('/league')">
    <LeagueBadge :tier="league.tier" :size="44" />
    <span class="league-card__body">
      <b>{{ t('league.title', { tier: t(`league.tiers.${league.tier}`) }) }}</b>
      <span>{{ subtitle }}</span>
    </span>
    <span v-if="league.me?.zone === 'promote'" class="ui-chip ui-chip--success">⬆</span>
    <span v-else-if="league.me?.zone === 'demote'" class="ui-chip ui-chip--warning">⬇</span>
    <ArrowRight class="league-card__arrow" />
  </button>
</template>

<style scoped lang="scss">
.league-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 16px;
  font-family: inherit;
  text-align: left;
  color: var(--c-ink);
  cursor: pointer;
  transition: transform 0.2s ease;

  &:active { transform: scale(0.97); }

  &__body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;

    b { font-size: 15px; color: var(--c-navy-900); }
    span { font-size: 13px; color: var(--c-muted); }
  }

  &__arrow { font-size: 20px; color: var(--c-muted); }
}
</style>
