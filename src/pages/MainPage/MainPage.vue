<script setup lang="ts">
// Главная 2.0: одно главное действие дня, метрики, неделя, «продолжить», рейтинг.
// Телефон — одна колонка; десктоп — сетка 8/4.
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { Capacitor, SystemBars, SystemBarsStyle } from '@capacitor/core'
import TargetIcon from '@iconify-vue/solar/target-linear'
import ArrowRight from '@iconify-vue/solar/alt-arrow-right-linear'
import HomeHeader from '@/features/mainPage/home/HomeHeader.vue'
import TodayHero from '@/features/mainPage/home/TodayHero.vue'
import WeeklyChart from '@/features/mainPage/home/WeeklyChart.vue'
import ContinueList from '@/features/mainPage/home/ContinueList.vue'
import RankCard from '@/features/mainPage/home/RankCard.vue'
import ProBanner from '@/features/subscription/ProBanner.vue'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import { useUserStore } from '@/features/user/store.ts'
import { useStats } from '@/features/mainPage/statistic/store.ts'
import { useLeadersStore } from '@/features/mainPage/leaderboard/store.ts'
import { useClassroomStore } from '@/features/classroom/store.ts'
import { getDailyChallenge, type DailyChallengeData } from '@/features/mainPage/dailyChallenge/api.ts'

const { t } = useI18n()
const router = useRouter()
const headerStore = useHeaderStore()
const navStore = useNavStore()
const userStore = useUserStore()
const statStore = useStats()
const leadersStore = useLeadersStore()
const classroomStore = useClassroomStore()

const daily = ref<DailyChallengeData | null>(null)
const isLoading = ref(true)

const stats = computed(() => statStore.statistic)
const streak = computed(() => Math.max(stats.value?.streak_days ?? 0, daily.value?.streak ?? 0))
const assignment = computed(() => classroomStore.pending[0] ?? null)

// Вызов дня отдельной строкой, если hero занят заданием
const dailyRowVisible = computed(() =>
  !!assignment.value && !!daily.value && !daily.value.empty && daily.value.total_questions > 0
)

onMounted(async () => {
  headerStore.setIsVisible(false)
  navStore.showTabs()

  if (Capacitor.isNativePlatform()) {
    // Светлый фон — тёмные иконки статус-бара
    SystemBars.setStyle({ style: SystemBarsStyle.Light }).catch(() => {})
  }

  await Promise.allSettled([
    userStore.user ? Promise.resolve() : userStore.fetchProfile(),
    statStore.fetchStats(),
    statStore.fetchAttemptsHistory(0, 8),
    leadersStore.fetchLeaders(),
    classroomStore.fetchAll(),
    getDailyChallenge().then(r => { daily.value = r.data }),
  ])
  isLoading.value = false
})

onUnmounted(() => {
  headerStore.setIsVisible(true)
})
</script>

<template>
  <div class="home">
    <HomeHeader :user="userStore.user" :streak="streak" />

    <div class="home__grid">
      <!-- ── Основная колонка ── -->
      <div class="home__main">
        <div v-if="isLoading" class="ui-skeleton home__skeleton-hero" />
        <TodayHero v-else :assignment="assignment" :daily="daily" />

        <!-- Метрики (на десктопе — в правой колонке) -->
        <div class="stats home__stats-mobile">
          <div class="ui-stat"><span class="ui-stat__label">{{ t('home.accuracy') }}</span><b class="ui-stat__value">{{ stats ? Math.round(stats.accuracy_percent) + '%' : '—' }}</b></div>
          <div class="ui-stat"><span class="ui-stat__label">{{ t('home.answers') }}</span><b class="ui-stat__value">{{ stats?.total_questions_answered ?? '—' }}</b></div>
          <div class="ui-stat"><span class="ui-stat__label">{{ t('home.points') }}</span><b class="ui-stat__value">{{ stats?.total_points ?? '—' }}</b></div>
        </div>

        <button v-if="dailyRowVisible" type="button" class="daily-row ui-card home__daily-mobile" @click="router.push('/daily')">
          <span class="ui-tile-icon"><TargetIcon /></span>
          <span class="daily-row__body">
            <span class="daily-row__top"><b>{{ t('daily.title') }}</b><span>{{ daily!.answered_count }} / {{ daily!.total_questions }}</span></span>
            <span class="ui-progress"><span class="ui-progress__fill" :style="{ width: (daily!.answered_count / daily!.total_questions) * 100 + '%' }" /></span>
          </span>
          <ArrowRight class="daily-row__arrow" />
        </button>

        <WeeklyChart v-if="stats" :correct="stats.weekly_activity.correct" :incorrect="stats.weekly_activity.incorrect" />
        <div v-else-if="isLoading" class="ui-skeleton home__skeleton-chart" />

        <ContinueList :attempts="statStore.attempts" />

        <div class="home__mobile-only">
          <RankCard :leaders="leadersStore.leaders" :user-id="userStore.user?.id ?? null" />
          <ProBanner />
        </div>
      </div>

      <!-- ── Правая колонка (десктоп) ── -->
      <aside class="home__aside">
        <div class="stats stats--two">
          <div class="ui-stat"><span class="ui-stat__label">{{ t('home.accuracy') }}</span><b class="ui-stat__value">{{ stats ? Math.round(stats.accuracy_percent) + '%' : '—' }}</b></div>
          <div class="ui-stat"><span class="ui-stat__label">{{ t('home.points') }}</span><b class="ui-stat__value">{{ stats?.total_points ?? '—' }}</b></div>
        </div>

        <button v-if="dailyRowVisible" type="button" class="daily-row ui-card" @click="router.push('/daily')">
          <span class="ui-tile-icon"><TargetIcon /></span>
          <span class="daily-row__body">
            <span class="daily-row__top"><b>{{ t('daily.title') }}</b><span>{{ daily!.answered_count }} / {{ daily!.total_questions }}</span></span>
            <span class="ui-progress"><span class="ui-progress__fill" :style="{ width: (daily!.answered_count / daily!.total_questions) * 100 + '%' }" /></span>
          </span>
        </button>

        <RankCard :leaders="leadersStore.leaders" :user-id="userStore.user?.id ?? null" />
        <ProBanner />
      </aside>
    </div>
  </div>
</template>

<style scoped lang="scss">
.home {
  display: flex;
  flex-direction: column;
  gap: 22px;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  box-sizing: border-box;
  padding: calc(var(--sat) + 90px) 14px calc(var(--sab) + 120px);

  @media (min-width: 1024px) {
    max-width: var(--content-max);
    padding: 32px 24px 48px;
  }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;

    @media (min-width: 1024px) {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      align-items: start;
    }
  }

  &__main, &__aside, &__mobile-only {
    display: flex;
    flex-direction: column;
    gap: 14px;
    min-width: 0;

    @media (min-width: 1024px) { gap: 22px; }
  }

  &__aside {
    display: none;
    @media (min-width: 1024px) { display: flex; }
  }

  &__mobile-only, &__stats-mobile, &__daily-mobile {
    @media (min-width: 1024px) { display: none !important; }
  }

  &__skeleton-hero { height: 190px; border-radius: var(--r-xl); }
  &__skeleton-chart { height: 220px; }
}

.stats {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;

  &--two { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
  &--two .ui-stat__value { font-size: 28px; }
}

.daily-row {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 14px 16px;
  font-family: inherit;
  text-align: left;
  color: var(--c-ink);
  cursor: pointer;

  &__body { display: flex; flex-direction: column; gap: 8px; flex: 1; min-width: 0; }
  &__top { display: flex; justify-content: space-between; font-size: 15px; span { font-size: 13px; color: var(--c-muted); } }
  &__arrow { font-size: 20px; color: var(--c-muted); }

  &:active { transform: scale(0.99); }
}
</style>
