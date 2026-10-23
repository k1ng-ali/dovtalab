<script setup lang="ts">
// Шапка лиги: уровень, сколько осталось до конца недели, правила зон и итог прошлой недели.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import ClockIcon from '@iconify-vue/solar/clock-circle-linear'
import LeagueBadge from './LeagueBadge.vue'
import type { League } from '../types.ts'

const props = defineProps<{ league: League }>()

const { t } = useI18n()

// Обратный отсчёт обновляется раз в минуту
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => { timer = setInterval(() => { now.value = Date.now() }, 60_000) })
onUnmounted(() => { if (timer) clearInterval(timer) })

const timeLeft = computed(() => {
  const ms = Math.max(0, new Date(props.league.ends_at).getTime() - now.value)
  const hours = Math.floor(ms / 3_600_000)
  const days = Math.floor(hours / 24)
  return days > 0
      ? t('league.leftDays', { d: days, h: hours % 24 })
      : t('league.leftHours', { h: hours })
})

const tierName = (tier: number) => t(`league.tiers.${tier}`)

const lastWeekText = computed(() => {
  const last = props.league.last_week
  if (!last) return null
  return t(`league.result.${last.result}`, { tier: tierName(last.new_tier), rank: last.rank, points: last.points })
})
</script>

<template>
  <section class="hero ui-card">
    <div class="hero__top">
      <LeagueBadge :tier="league.tier" :size="64" />
      <div class="hero__title">
        <span class="hero__caption">{{ t('league.weekly') }}</span>
        <b class="hero__name">{{ t('league.title', { tier: tierName(league.tier) }) }}</b>
        <span class="hero__time"><ClockIcon /> {{ t('league.endsIn', { left: timeLeft }) }}</span>
      </div>
    </div>

    <p v-if="league.joined" class="hero__rules">
      <span class="ui-chip ui-chip--success" v-if="league.promote_count">⬆ {{ t('league.promoteRule', { n: league.promote_count }) }}</span>
      <span class="ui-chip ui-chip--warning" v-if="league.demote_count">⬇ {{ t('league.demoteRule', { n: league.demote_count }) }}</span>
    </p>

    <p
        v-if="lastWeekText"
        class="hero__last"
        :class="'hero__last--' + league.last_week!.result"
    >
      {{ lastWeekText }}
    </p>
  </section>
</template>

<style scoped lang="scss">
.hero {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 18px;

  &__top { display: flex; align-items: center; gap: 16px; }

  &__title { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  &__caption { font-size: var(--fs-caption); font-weight: 700; color: var(--c-muted); text-transform: uppercase; letter-spacing: 0.04em; }
  &__name { font-size: var(--fs-h1); color: var(--c-navy-900); line-height: 1.2; }
  &__time { display: inline-flex; align-items: center; gap: 6px; font-size: var(--fs-small); color: var(--c-muted); }

  &__rules { display: flex; flex-wrap: wrap; gap: 8px; margin: 0; }

  &__last {
    margin: 0;
    padding: 10px 14px;
    border-radius: var(--r-sm);
    font-size: var(--fs-small);
    font-weight: 600;
    background: var(--c-teal-tint);
    color: var(--c-teal-600);

    &--promoted { background: var(--c-success-tint); color: var(--c-success); }
    &--demoted { background: var(--c-warning-tint); color: var(--c-warning-text); }
  }
}
</style>
