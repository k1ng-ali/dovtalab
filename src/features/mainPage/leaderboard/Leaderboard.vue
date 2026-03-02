<script setup lang="ts">
// Когда бэкенд будет готов — убери isEmpty и подключи реальные данные
const isEmpty = true

const users = [
  { name: "Jaemy",   score: "1100", img: "./leaderboard/2.png", order: 2, profile: "default" },
  { name: "Ali",     score: "1200", img: "./leaderboard/1.png", order: 1, profile: "gold"    },
  { name: "Кристина", score: "650", img: "./leaderboard/3.png", order: 3, profile: "default" },
]
</script>

<template>
  <div class="leaderboard">
    <div class="header">
      <h2 class="title">Топ игроков 🏆</h2>
      <p class="all" v-if="!isEmpty">ещё</p>
    </div>

    <!-- Обычный контент -->
    <div class="content" v-if="!isEmpty">
      <div
          class="item"
          v-for="(user, i) in users"
          :key="i"
          :class="user.profile"
          :style="{ '--order': `'${user.order}'` }"
      >
        <div class="ico">
          <img :src="user.img" />
        </div>
        <h4 class="name">{{ user.name }}</h4>
        <p class="score">{{ user.score }} xp</p>
      </div>
    </div>

    <!-- Empty state -->
    <div class="empty" v-else>
      <div class="empty-podium">
        <div class="podium-bar podium-bar--2" />
        <div class="podium-bar podium-bar--1" />
        <div class="podium-bar podium-bar--3" />
      </div>
      <p class="empty-title">Рейтинг скоро появится</p>
      <p class="empty-sub">Проходите тесты и занимайте первые места</p>
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
  width: 100%;
  justify-content: space-between;
  align-items: center;
}

.content {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.item {
  background: #D8DBE4;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 10px;
  box-shadow:
      0 8px 25px rgba(0, 0, 0, 0.12),
      0 2px 6px rgba(0, 0, 0, 0.06);
  color: #5B6C85;

  &.gold {
    background: #4EBEC2;
    scale: 1.05;
    color: white;

    .ico::before { background: #CDAE64; }
  }

  .name  { margin: 10px 0 0 0; }
  .score { margin: 0; }

  .ico {
    position: relative;

    &::before {
      content: var(--order);
      position: absolute;
      bottom: -7px;
      left: calc(50% - 12.5px);
      width: 25px;
      height: 25px;
      background: white;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.2);
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