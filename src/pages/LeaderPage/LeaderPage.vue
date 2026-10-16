<script setup lang="ts">
import { useLeadersStore } from "@/features/mainPage/leaderboard/store.ts"
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useUserStore } from "@/features/user/store.ts"
import { useHeaderStore } from "@/shared/stores/useHeaderStore.ts"
import { useRouter } from "vue-router"
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import { useI18n } from 'vue-i18n'
import RankIcon from '@iconify-vue/solar/ranking-linear'

const { t } = useI18n()
const userStore   = useUserStore()
const headerStore = useHeaderStore()
const router      = useRouter()

const leadersStore = useLeadersStore()
const leaders      = computed(() => leadersStore.getLeaders)
const first        = computed(() => leadersStore.first)
const second       = computed(() => leadersStore.second)
const third        = computed(() => leadersStore.third)
const isEmpty      = computed(() => !leaders.value || leaders.value.length === 0)

// Топ 4+ (исключаем топ 3 из v-for)
const regularLeaders = computed(() =>
    leaders.value?.filter(l => l.rank > 3) ?? []
)

// Текущий пользователь — только если не в топ 3
const currentUser = computed(() => {
  const found = leaders.value?.find(s => s.user_id === userStore.user?.id)
  return found && found.rank > 3 ? found : null
})

// ── Sticky карточка пользователя ──────────────────────────────────────────
// Показываем fixed-карточку снизу, когда реальная карточка пользователя
// в списке не видна во viewport (либо ещё не доскроллили, либо уже выше).
const userRowRef     = ref<HTMLElement | null>(null)
const showStickyUser = ref(false)
let   observer: IntersectionObserver | null = null

const setupObserver = () => {
  observer?.disconnect()
  if (!userRowRef.value || !currentUser.value) return

  observer = new IntersectionObserver(
      ([entry]) => { showStickyUser.value = !entry?.isIntersecting },
      { threshold: 0.5 }
  )
  observer.observe(userRowRef.value)
}

// Пересоздаём observer когда ref появляется после загрузки данных
watch(userRowRef, (el) => { if (el) setupObserver() })

onMounted(async () => {
  leadersStore.fetchLeaders()
  headerStore.setTitle(t('leaders.title'))
  headerStore.setLeftAction({
    icon: BsArrowLeft,
    onClick: () => router.push("/"),
  })
  if (Capacitor.isNativePlatform()) {
    try {
      // Исходное состояние при загрузке
      //await StatusBar.setBackgroundColor({ color: '#F6F6F6' });
      await SystemBars.setStyle({ style: SystemBarsStyle.Light})
    } catch (e) {
      console.error('Ошибка настройки StatusBar:', e);
    }
  }
})

onUnmounted(() => { observer?.disconnect() })

// Пьедестал: 2 — 1 — 3
const podium = computed(() =>
    [second.value, first.value, third.value]
        .map((l, i) => l ? { leader: l, place: [2, 1, 3][i] } : null)
        .filter(Boolean) as { leader: NonNullable<typeof first.value>; place: number }[]
)
</script>

<template>
  <div class="leaders ui-page">
    <template v-if="!isEmpty">

      <!-- ── Пьедестал ── -->
      <section class="podium ui-card" :aria-label="t('leaders.top3')">
        <div
            v-for="p in podium"
            :key="p.leader.user_id"
            class="podium__col"
            :class="['podium__col--' + p.place, { 'podium__col--me': p.leader.user_id === userStore.user?.id }]"
        >
          <div class="podium__avatar-wrap">
            <img v-if="p.leader.avatar_url" :src="p.leader.avatar_url" class="podium__avatar" alt="" />
            <span v-else class="podium__avatar podium__avatar--fallback">{{ p.leader.first_name?.[0] }}</span>
            <span class="podium__place">{{ p.place }}</span>
          </div>
          <b class="podium__name">{{ p.leader.first_name }}</b>
          <span class="podium__points">{{ p.leader.total_points }} xp</span>
          <span class="podium__step" />
        </div>
      </section>

      <!-- ── Остальные ── -->
      <div class="ui-section-head">
        <h3 class="ui-section-head__title">{{ t('leaders.top50') }}</h3>
      </div>

      <div class="list ui-card ui-card--list">
        <div
            v-for="leader in regularLeaders"
            :key="leader.user_id"
            :ref="(el) => { if (leader.user_id === userStore.user?.id) userRowRef = el as HTMLElement }"
            class="ui-row row"
            :class="{ 'row--me': leader.user_id === userStore.user?.id }"
        >
          <span class="row__rank">{{ leader.rank }}</span>
          <img v-if="leader.avatar_url" :src="leader.avatar_url" class="row__avatar" alt="" />
          <span v-else class="row__avatar row__avatar--fallback">{{ leader.first_name?.[0] }}</span>
          <span class="row__name">
            {{ leader.first_name }}
            <span v-if="leader.user_id === userStore.user?.id" class="ui-chip ui-chip--teal">{{ t('common.you') }}</span>
          </span>
          <span class="row__points">{{ leader.total_points }} xp</span>
        </div>
      </div>
    </template>

    <!-- ── Пусто ── -->
    <div class="ui-empty ui-card" v-else>
      <RankIcon class="ui-empty__icon" />
      <p class="ui-empty__title">{{ t('leaders.emptyTitle') }}</p>
      <p class="ui-empty__text">{{ t('leaders.emptySub') }}</p>
    </div>
  </div>

  <!-- ── Плавающая строка «я», когда своя строка вне экрана ── -->
  <Transition name="slide-up">
    <div v-if="currentUser && showStickyUser" class="sticky-me ui-bar">
      <span class="row__rank">{{ currentUser.rank }}</span>
      <img v-if="currentUser.avatar_url" :src="currentUser.avatar_url" class="row__avatar" alt="" />
      <span v-else class="row__avatar row__avatar--fallback">{{ currentUser.first_name?.[0] }}</span>
      <span class="row__name">
        {{ currentUser.first_name }}
        <span class="ui-chip ui-chip--teal">{{ t('common.you') }}</span>
      </span>
      <span class="row__points">{{ currentUser.total_points }} xp</span>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.leaders {
  max-width: 640px;
  padding-bottom: calc(var(--sab) + 170px);
  @media (min-width: 1024px) { padding-bottom: 100px; }
}

/* ── Пьедестал ── */
.podium {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: end;
  gap: 8px;
  padding: 20px 14px 0;
  overflow: hidden;

  &__col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    min-width: 0;
    text-align: center;

    &--1 { order: 2; }
    &--2 { order: 1; }
    &--3 { order: 3; }
  }

  &__avatar-wrap { position: relative; margin-bottom: 6px; }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 58px;
    height: 58px;
    border-radius: 50%;
    object-fit: cover;
    box-shadow: 0 0 0 3px #FFFFFF, 0 0 0 5px var(--medal);

    &--fallback {
      background: var(--c-teal-tint);
      color: var(--c-teal-600);
      font-size: 22px;
      font-weight: 800;
    }
  }

  &__col--1 &__avatar { width: 74px; height: 74px; font-size: 28px; }

  &__place {
    position: absolute;
    left: 50%;
    bottom: -8px;
    transform: translateX(-50%);
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--medal);
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 800;
    box-shadow: 0 0 0 2px #FFFFFF;
  }

  &__name {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: 14px;
    color: var(--c-navy-900);
  }

  &__points { font-size: 12px; font-weight: 700; color: var(--c-muted); }

  &__step {
    width: 100%;
    margin-top: 8px;
    border-radius: 16px 16px 0 0;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.35));
    box-shadow: inset 0 1px 0 #FFFFFF;
  }

  &__col--1 { --medal: #D9A21B; .podium__step { height: 64px; background: linear-gradient(180deg, rgba(217, 162, 27, 0.22), rgba(217, 162, 27, 0.04)); } }
  &__col--2 { --medal: #8C9AAD; .podium__step { height: 44px; } }
  &__col--3 { --medal: #B97A4E; .podium__step { height: 30px; } }

  &__col--me .podium__name { color: var(--c-teal-600); }
}

/* ── Список ── */
.row {
  min-height: 60px;

  &--me { background: rgba(231, 245, 246, 0.8); }

  &__rank {
    width: 28px;
    flex-shrink: 0;
    text-align: center;
    font-size: 14px;
    font-weight: 800;
    color: var(--c-muted);
  }

  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    object-fit: cover;

    &--fallback {
      background: var(--c-teal-tint);
      color: var(--c-teal-600);
      font-size: 16px;
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

  &__points { font-size: 14px; font-weight: 800; color: var(--c-navy-900); }
}

/* ── Плавающая строка «я» ── */
.sticky-me {
  position: fixed;
  z-index: 90;
  left: 14px;
  right: 14px;
  bottom: calc(var(--sab) + 96px);
  max-width: 612px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 18px 8px 10px;
  border-radius: var(--r-pill);
  background: rgba(255, 255, 255, 0.82);

  .row__name { font-size: 14px; }

  @media (min-width: 1024px) {
    left: calc(var(--sidebar-w) + 36px);
    right: 24px;
    bottom: 24px;
  }
}

.slide-up-enter-active,
.slide-up-leave-active { transition: transform 0.25s ease, opacity 0.25s ease; }
.slide-up-enter-from,
.slide-up-leave-to { transform: translateY(16px); opacity: 0; }
</style>
