<script setup lang="ts">
import {useLeadersStore} from "@/features/mainPage/leaderboard/store.ts";
import {computed, onMounted} from "vue";
import {useUserStore} from "@/features/user/store.ts";
import {useRouter} from "vue-router";
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const userStore = useUserStore();
const router   = useRouter()

const leadersStore = useLeadersStore()
const leaders = computed(() => leadersStore.getLeaders)
const first = computed(() => leadersStore.first)
const second = computed(() => leadersStore.second)
const third = computed(() => leadersStore.third)
const user = computed(() => {
  let _user = leaders.value?.find(s => s.user_id === userStore.user?.id)
  if (_user?.rank !== 1 && _user?.rank !== 2 && _user?.rank !== 3) {
    return _user
  } else {return null}
})

const isEmpty = computed(() => !leaders.value || !leaders.value?.length)

onMounted(() => {
   leadersStore.fetchLeaders();
})

</script>

<template>
  <div class="leaderboard">
    <div class="header">
      <h2 class="title">{{ t('mainPage.topPlayers') }}</h2>
      <button class="all" v-if="!isEmpty"
        @click="router.push('/leaders')"
      >{{ t('common.more') }}</button>
    </div>

    <!-- Обычный контент -->

    <div class="content" v-if="!isEmpty">
      <!-- ── ТОП 3 ─────────────────────────────────────────────── -->
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

      <!------------------------------------------>
      <div class="item me"
       v-if="user"
      >
        <div class="item--left">
          <img v-if="user.avatar_url" :src="user.avatar_url" class="avatar" alt="avatar" />
          <div v-else class="avatar avatar--fallback">{{ user.first_name?.[0] }}</div>
          <div>
            <h4 class="name">
              {{ user.first_name }}
              <span class="you-badge">{{ t('common.you') }}</span>
            </h4>
            <p class="score">{{ user.total_points }} xp</p>
          </div>
        </div>
        <div class="item--rank">{{ user.rank }}</div>
      </div>
      <!------------------------------------------>
    </div>

    <!-- Empty state -->
    <div class="empty" v-else>
      <div class="empty-podium">
        <div class="podium-bar podium-bar--2" />
        <div class="podium-bar podium-bar--1" />
        <div class="podium-bar podium-bar--3" />
      </div>
      <p class="empty-title">{{ t('mainPage.leaderboardEmpty') }}</p>
      <p class="empty-sub">{{ t('mainPage.leaderboardEmptySub') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.leaderboard {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  width: calc(100% - 20px);
  justify-content: space-between;
  align-items: end;
  margin-bottom: 10px;
  padding: 0 10px;

  & .title {
    margin-bottom: 0;
  }
  & .all {
    margin-bottom: 0;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .all {
    background: none;
    border: none;
    color: #4F4F4F;
    font-size: 18px;
    font-weight: 600;
    cursor: pointer;
  }
}

.item {
  background: linear-gradient(to bottom, white, rgb(235, 238, 241));
  border: 1px solid rgba(35, 73, 112, 0.3);
  border-radius: 20px;
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 10px 10px;
  box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.06);
  color: #234970;
  justify-content: space-between;

  &.gold {
    background:  linear-gradient(to bottom, rgba(239, 191, 4, 0.1), rgba(239, 191, 4, 0.2));
    color: #856A00;
    border: #EFBF04 1px solid;
    margin-bottom: 10px;
  }

  &.silver {
    background:  linear-gradient(to bottom, rgba(217, 217, 217, 0.3), #D9D9D9);
    color: #4F4F4F;
    border: #C4C4C4 1px solid;
  }

  &.bronze {
    background:  linear-gradient(to bottom, rgba(252, 169, 86, 0.1), rgba(252, 169, 86, 0.3));
    color: #82572C;
    border: #CE8946 1px solid;
  }

  &--left {
    display: flex;
    flex-direction: row;
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

    &.gold {
      border: none;
      background: none;
      font-size: 25px;
    }
    &.silver {
      border: none;
      background: none;
      font-size: 25px;
    }
    &.bronze {
      border: none;
      background: none;
      font-size: 25px;
    }

  }

  &.me {
    border: 1.5px solid #4EBEC2;
    background: linear-gradient(to bottom, rgba(78, 190, 194, 0.05), rgba(78, 190, 194, 0.12));
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
  .name  { margin: 0; }
  .score { margin: 0; }

  .avatar {
    width: clamp(40px, 1.5rem, 60px);
    height: clamp(40px, 1.5rem, 60px);
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid #234970;
    box-shadow: 0 6px 20px rgba(35, 73, 112, 0.18);

    &.gold {
      border: 2px solid #efbf04;
    }
    &.silver {
      border: #4F4F4F 2px solid;
    }
    &.bronze {
      border: #CE8946 2px solid;
    }

    &--fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(to bottom, rgba(35, 73, 112, 0.3), rgb(203, 218, 232));
      color: #234970;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -1px;

      &.gold {
        background:  linear-gradient(to bottom, rgba(239, 191, 4, 0.1), rgba(239, 191, 4, 0.2));
        color: #856A00;
      }

      &.silver {
        background:  linear-gradient(to bottom, #D9D9D9, #C4C4C4);
        color: #4F4F4F;
      }
      &.bronze {
        background:  linear-gradient(to bottom, rgba(252, 169, 86, 0.2), rgba(252, 169, 86, 0.4));
        color: #82572C;
      }
    }
  }
}

p { font-weight: 500; }

/* ── Empty state ── */
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 16px 24px;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  gap: 8px;
}

/* Декоративный подиум из трёх полосок */
.empty-podium {
  display: flex;
  align-items: flex-end;
  gap: 6px;
  margin-bottom: 4px;
}

.podium-bar {
  width: 28px;
  border-radius: 6px 6px 0 0;
  opacity: 0.25;

  &--1 {
    height: 44px;
    background: #4EBEC2;
    opacity: 0.5;
  }
  &--2 {
    height: 32px;
    background: #234970;
    opacity: 0.3;
  }
  &--3 {
    height: 24px;
    background: #234970;
    opacity: 0.2;
  }
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