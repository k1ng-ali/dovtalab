<script setup lang="ts">
// Компактный рейтинг: топ-3 и ваша строка с разрывом до следующего места.
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import type { LeaderboardItem } from '@/features/mainPage/leaderboard/types.ts'

const props = defineProps<{
  leaders: LeaderboardItem[] | null
  userId: number | null
}>()

const { t } = useI18n()
const router = useRouter()

const top = computed(() => (props.leaders ?? []).slice(0, 3))
const me = computed(() => (props.leaders ?? []).find(l => l.user_id === props.userId) ?? null)
const ahead = computed(() => {
  if (!me.value || me.value.rank <= 1) return null
  return (props.leaders ?? []).find(l => l.rank === me.value!.rank - 1) ?? null
})
</script>

<template>
  <section class="rank ui-card ui-card--list" v-if="top.length">
    <div class="rank__head">
      <b class="rank__title">{{ t('home.rankTitle') }}</b>
      <button type="button" class="ui-section-head__link" @click="router.push('/leaders')">{{ t('home.rankAll') }}</button>
    </div>
    <div v-for="l in top" :key="l.user_id" class="ui-row rank__row">
      <span class="rank__pos" :class="{ 'rank__pos--first': l.rank === 1 }">{{ l.rank }}</span>
      <img v-if="l.avatar_url" :src="l.avatar_url" alt="" class="rank__avatar" />
      <span v-else class="rank__avatar rank__avatar--fallback">{{ l.first_name?.[0] }}</span>
      <span class="rank__name">{{ l.first_name }}</span>
      <b class="rank__points">{{ l.total_points }}</b>
    </div>
    <div v-if="me && me.rank > 3" class="ui-row rank__row rank__row--me">
      <span class="rank__pos rank__pos--first">{{ me.rank }}</span>
      <span class="rank__name">
        <b>{{ t('home.you') }}</b>
        <small v-if="ahead">{{ t('home.rankGap', { r: ahead.rank, n: ahead.total_points - me.total_points }) }}</small>
      </span>
      <b class="rank__points">{{ me.total_points }}</b>
    </div>
    <div v-else-if="!me" class="ui-row rank__row rank__row--me">
      <span class="rank__name"><small>{{ t('home.rankOut') }}</small></span>
    </div>
  </section>
</template>

<style scoped lang="scss">
.rank {
  &__head { display: flex; justify-content: space-between; align-items: baseline; padding: 16px 18px 6px; }
  &__title { font-size: 16px; color: var(--c-navy-900); }

  &__row { min-height: 52px; padding: 8px 18px; }
  &__row--me { background: var(--c-teal-tint); }

  &__pos { width: 24px; font-weight: 800; color: var(--c-muted); }
  &__pos--first { color: var(--c-teal-600); }

  &__avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    object-fit: cover;
    flex-shrink: 0;
  }
  &__avatar--fallback {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    background: rgba(35, 73, 112, 0.12);
    color: var(--c-navy-700);
    font-size: 13px;
    font-weight: 700;
  }

  &__name {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    font-size: 14px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    small { font-size: 12px; color: var(--c-muted); }
  }

  &__points { font-size: 14px; color: var(--c-ink); }
}
</style>
