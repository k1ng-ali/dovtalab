<script setup lang="ts">
// Недельная лига: уровень, таблица группы до 30 игроков, зоны повышения / понижения.
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import CupIcon from '@iconify-vue/solar/cup-first-linear'
import LeagueHero from '@/features/league/components/LeagueHero.vue'
import LeagueTable from '@/features/league/components/LeagueTable.vue'
import { useLeagueStore } from '@/features/league/store.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'

const { t } = useI18n()
const router = useRouter()
const headerStore = useHeaderStore()
const navStore = useNavStore()
const leagueStore = useLeagueStore()

const league = computed(() => leagueStore.league)

onMounted(() => {
  headerStore.setTitle(t('league.pageTitle'))
  headerStore.setLeftAction({ icon: BsArrowLeft, onClick: () => router.push('/') })
  navStore.showTabs()
  if (Capacitor.isNativePlatform()) {
    SystemBars.setStyle({ style: SystemBarsStyle.Light }).catch(() => {})
  }
  leagueStore.fetchLeague()
})
</script>

<template>
  <div class="league ui-page">
    <!-- 1. Загрузка -->
    <template v-if="leagueStore.isLoading && !league">
      <div class="ui-skeleton league__skeleton-hero" />
      <div class="ui-skeleton league__skeleton-table" />
    </template>

    <!-- 2. Ошибка -->
    <div v-else-if="!league" class="ui-empty ui-card">
      <CupIcon class="ui-empty__icon" />
      <p class="ui-empty__title">{{ t('league.errorTitle') }}</p>
      <button type="button" class="ui-btn ui-btn--secondary ui-btn--sm" @click="leagueStore.fetchLeague()">
        {{ t('common.retry') }}
      </button>
    </div>

    <!-- 3. Лига -->
    <template v-else>
      <LeagueHero :league="league" />

      <LeagueTable
          v-if="league.joined && league.members.length"
          :members="league.members"
          :promote-count="league.promote_count"
          :demote-count="league.demote_count"
      />

      <!-- Ещё нет баллов на этой неделе -->
      <div v-else class="ui-empty ui-card">
        <CupIcon class="ui-empty__icon" />
        <p class="ui-empty__title">{{ t('league.notJoinedTitle') }}</p>
        <p class="ui-empty__text">{{ t('league.notJoinedText') }}</p>
        <button type="button" class="ui-btn ui-btn--primary" @click="router.push('/quiz')">
          {{ t('home.chooseTest') }}
        </button>
      </div>

      <p class="league__hint">{{ t('league.hint') }}</p>
    </template>
  </div>
</template>

<style scoped lang="scss">
.league {
  max-width: 640px;

  &__skeleton-hero { height: 150px; border-radius: var(--r-lg); }
  &__skeleton-table { height: 420px; border-radius: var(--r-lg); }

  &__hint {
    margin: 0;
    padding: 0 6px;
    font-size: var(--fs-caption);
    color: var(--c-muted);
    text-align: center;
  }
}
</style>
