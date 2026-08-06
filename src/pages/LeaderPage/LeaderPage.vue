<script setup lang="ts">
import { useLeadersStore } from "@/features/mainPage/leaderboard/store.ts"
import { computed, onMounted, onUnmounted, ref, watch } from "vue"
import { useUserStore } from "@/features/user/store.ts"
import { useHeaderStore } from "@/shared/stores/useHeaderStore.ts"
import { useRouter } from "vue-router"
import { BsArrowLeft } from "@kalimahapps/vue-icons"
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import {EdgeToEdge} from "@capawesome/capacitor-android-edge-to-edge-support";
import { useI18n } from 'vue-i18n'

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
      await EdgeToEdge.setBackgroundColor({ color: '#00000000' });
    } catch (e) {
      console.error('Ошибка настройки StatusBar:', e);
    }
  }
})

onUnmounted(() => { observer?.disconnect() })
</script>

<template>
  <div class="leaders">
    <div class="content" v-if="!isEmpty">

      <!-- ── ТОП 3 ─────────────────────────────────────────────── -->
      <h2 class="section-title">{{ t('leaders.top3') }}</h2>

      <div class="item gold" v-if="first">
        <div class="item--left">
          <img v-if="first.avatar_url" :src="first.avatar_url" class="avatar gold" alt="avatar" />
          <div v-else class="avatar avatar--fallback gold">{{ first.first_name?.[0] }}</div>
          <div>
            <h4 class="name">{{ first.first_name }}</h4>
            <p class="score">{{ first.total_points }} xp</p>
          </div>
        </div>
        <div class="item--rank gold">🥇</div>
      </div>

      <div class="item silver" v-if="second">
        <div class="item--left">
          <img v-if="second.avatar_url" :src="second.avatar_url" class="avatar silver" alt="avatar" />
          <div v-else class="avatar avatar--fallback silver">{{ second.first_name?.[0] }}</div>
          <div>
            <h4 class="name">{{ second.first_name }}</h4>
            <p class="score">{{ second.total_points }} xp</p>
          </div>
        </div>
        <div class="item--rank silver">🥈</div>
      </div>

      <div class="item bronze" v-if="third">
        <div class="item--left">
          <img v-if="third.avatar_url" :src="third.avatar_url" class="avatar bronze" alt="avatar" />
          <div v-else class="avatar avatar--fallback bronze">{{ third.first_name?.[0] }}</div>
          <div>
            <h4 class="name">{{ third.first_name }}</h4>
            <p class="score">{{ third.total_points }} xp</p>
          </div>
        </div>
        <div class="item--rank bronze">🥉</div>
      </div>

      <!-- ── ТОП 50 (топ 3 исключены из v-for) ─────────────────── -->
      <h2 class="section-title">{{ t('leaders.top50') }}</h2>

      <div
          v-for="leader in regularLeaders"
          :key="leader.user_id"
          :ref="(el) => { if (leader.user_id === userStore.user?.id) userRowRef = el as HTMLElement }"
          class="item"
          :class="{ 'item--me': leader.user_id === userStore.user?.id }"
      >
        <div class="item--left">
          <img v-if="leader.avatar_url" :src="leader.avatar_url" class="avatar" alt="avatar" />
          <div v-else class="avatar avatar--fallback">{{ leader.first_name?.[0] }}</div>
          <div>
            <h4 class="name">
              {{ leader.first_name }}
              <span v-if="leader.user_id === userStore.user?.id" class="you-badge">{{ t('common.you') }}</span>
            </h4>
            <p class="score">{{ leader.total_points }} xp</p>
          </div>
        </div>
        <div class="item--rank">{{ leader.rank }}</div>
      </div>

      <!-- Отступ снизу чтобы sticky-карточка не перекрывала последний элемент -->
      <div v-if="currentUser" style="height: 80px" aria-hidden="true" />
    </div>

    <!-- ── Empty state ─────────────────────────────────────────── -->
    <div class="empty" v-else>
      <div class="empty-podium">
        <div class="podium-bar podium-bar--2" />
        <div class="podium-bar podium-bar--1" />
        <div class="podium-bar podium-bar--3" />
      </div>
      <p class="empty-title">{{ t('leaders.emptyTitle') }}</p>
      <p class="empty-sub">{{ t('leaders.emptySub') }}</p>
    </div>
  </div>

  <!-- ── Sticky карточка текущего пользователя ─────────────────── -->
  <!-- Появляется когда реальная карточка пользователя не видна во viewport -->
  <Transition name="slide-up">
    <div v-if="currentUser && showStickyUser" class="sticky-user">
      <div class="sticky-user__inner">
        <div class="item--left">
          <img v-if="currentUser.avatar_url" :src="currentUser.avatar_url" class="avatar" alt="avatar" />
          <div v-else class="avatar avatar--fallback">{{ currentUser.first_name?.[0] }}</div>
          <div>
            <h4 class="name">
              {{ currentUser.first_name }}
              <span class="you-badge">{{ t('common.you') }}</span>
            </h4>
            <p class="score">{{ currentUser.total_points }} xp</p>
          </div>
        </div>
        <div class="sticky-rank">{{ currentUser.rank }}</div>
      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.leaders {
  display: flex;
  justify-content: center;
  width: 100%;
  padding-bottom: 100px;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
  margin-top: 70px;
  width: 100%;
  max-width: 800px;
}

.section-title {
  margin: 10px 0 4px;
  font-size: 13px;
  font-weight: 700;
  color: #234970;
  opacity: 0.5;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

// ── Общая карточка ──────────────────────────────────────────────
.item {
  background: linear-gradient(to bottom, white, rgb(235, 238, 241));
  border: 1px solid rgba(35, 73, 112, 0.3);
  border-radius: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px;
  box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.06);
  color: #234970;
  justify-content: space-between;

  // Карточка текущего пользователя в списке — подсветка
  &--me {
    border: 1.5px solid #4EBEC2;
    background: linear-gradient(to bottom, rgba(78, 190, 194, 0.05), rgba(78, 190, 194, 0.12));
  }

  &.gold {
    background: linear-gradient(to bottom, rgba(239, 191, 4, 0.1), rgba(239, 191, 4, 0.2));
    color: #856A00;
    border: #EFBF04 1px solid;
    margin-bottom: 4px;
  }
  &.silver {
    background: linear-gradient(to bottom, rgba(217, 217, 217, 0.3), #D9D9D9);
    color: #4F4F4F;
    border: #C4C4C4 1px solid;
  }
  &.bronze {
    background: linear-gradient(to bottom, rgba(252, 169, 86, 0.1), rgba(252, 169, 86, 0.3));
    color: #82572C;
    border: #CE8946 1px solid;
  }

  &--left {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 10px;
  }

  &--rank {
    background: linear-gradient(to bottom, rgba(35, 73, 112, 0.3), rgb(203, 218, 232));
    border: 1px solid rgba(35, 73, 112, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 900;
    min-width: unset;
    white-space: nowrap;
    min-height: 36px;
    border-radius: 20px;
    padding: 0 10px;
    font-size: 14px;

    // Медальки для топ 3 — без фона, только эмодзи
    &.gold, &.silver, &.bronze {
      background: none;
      border: none;
      font-size: 22px;
    }
  }

  .name {
    margin: 0;
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 15px;
  }
  .score {
    margin: 0;
    font-size: 13px;
    opacity: 0.75;
  }
}

// ── Аватар ──────────────────────────────────────────────────────
.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #234970;
  box-shadow: 0 6px 20px rgba(35, 73, 112, 0.18);
  flex-shrink: 0;

  &.gold   { border-color: #efbf04; }
  &.silver { border-color: #888; }
  &.bronze { border-color: #CE8946; }

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(to bottom, rgba(35, 73, 112, 0.3), rgb(203, 218, 232));
    color: #234970;
    font-size: 20px;
    font-weight: 700;

    &.gold   { background: linear-gradient(to bottom, rgba(239, 191, 4, 0.1), rgba(239, 191, 4, 0.2)); color: #856A00; }
    &.silver { background: linear-gradient(to bottom, #D9D9D9, #C4C4C4); color: #4F4F4F; }
    &.bronze { background: linear-gradient(to bottom, rgba(252, 169, 86, 0.2), rgba(252, 169, 86, 0.4)); color: #82572C; }
  }
}

// ── Бейдж "Вы" ──────────────────────────────────────────────────
.you-badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.04em;
  background: #4EBEC2;
  color: white;
  border-radius: 20px;
  padding: 1px 7px;
  vertical-align: middle;
  line-height: 1.6;
}

// ── Sticky карточка ─────────────────────────────────────────────
// position: fixed — чтобы прибить к низу экрана независимо от скролла.
// Показывается через Transition только когда реальная карточка не видна.
.sticky-user {
  position: fixed;
  // Подбери bottom под высоту своего Navigator'а
  bottom: 100px;
  left: 0;
  right: 0;
  z-index: 50;
  padding: 0 16px;

  &__inner {
    max-width: 800px;
    margin: 0 auto;
    background: rgba(240, 252, 252, 0.85);
    border: 1.5px solid #4EBEC2;
    border-radius: 20px;
    display: flex;
    flex-direction: row;
    align-items: center;
    padding: 10px;
    justify-content: space-between;
    box-shadow:
        0 8px 32px rgba(78, 190, 194, 0.25),
        0 2px 8px rgba(0, 0, 0, 0.10);
    color: #234970;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);

    .name  { margin: 0; display: flex; align-items: center; gap: 6px; font-size: 15px; }
    .score { margin: 0; font-size: 13px; opacity: 0.75; }
  }
}

.sticky-rank {
  background: linear-gradient(to bottom, rgba(78, 190, 194, 0.3), rgba(78, 190, 194, 0.6));
  border: 1.5px solid #4EBEC2;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 900;
  min-width: 36px;
  min-height: 36px;
  border-radius: 50%;
  font-size: 14px;
  color: #234970;
}

// ── Анимация появления sticky ────────────────────────────────────
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.25s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

// ── Empty state ─────────────────────────────────────────────────
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 120px;
  padding: 20px 16px 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  gap: 8px;
  max-width: 400px;
  width: calc(100% - 40px);
  align-self: center;
}
.empty-podium {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-bottom: 4px;
}
.podium-bar {
  width: 28px;
  border-radius: 6px 6px 0 0;
  &--1 { height: 44px; background: #4EBEC2; opacity: 0.5; }
  &--2 { height: 32px; background: #234970; opacity: 0.3; }
  &--3 { height: 24px; background: #234970; opacity: 0.2; }
}
.empty-title {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #234970;
}
.empty-sub {
  margin: 0;
  font-size: 13px;
  color: #9CA3AF;
  text-align: center;
  line-height: 1.4;
  font-weight: 400;
}
</style>