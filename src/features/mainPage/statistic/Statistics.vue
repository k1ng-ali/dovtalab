<script setup lang="ts">
import { HeFilledBioPharma, UnLetterEnglishA, CaFunctionMath, AdPhase } from '@kalimahapps/vue-icons'

// Когда бэкенд будет готов — убери isEmpty и подключи реальные данные
const isEmpty = true

const topics = [
  { name: "Биология ММТ2025",   progress: 90, color: "#4EBEC2", ico: HeFilledBioPharma  },
  { name: "English elementary", progress: 20, color: "#85ed8a", ico: UnLetterEnglishA   },
  { name: "Математика",         progress: 60, color: "#C2654E", ico: CaFunctionMath     },
  { name: "Физика",             progress: 55, color: "#A54EC2", ico: AdPhase            },
]
</script>

<template>
  <div class="statistics">
    <div class="header">
      <h2 class="title">Статистика 📈</h2>
      <p class="all" v-if="!isEmpty">ещё</p>
    </div>

    <!-- Обычный контент -->
    <div class="content" v-if="!isEmpty">
      <div
          class="item"
          v-for="(topic, i) in topics"
          :key="i"
          :style="{ '--color': topic.color, '--progress': topic.progress + '%' }"
      >
        <div class="ico">
          <component :is="topic.ico" />
        </div>
        <div class="container">
          <h4 class="topic-title">{{ topic.name }}</h4>
          <p class="progress">{{ topic.progress }}%</p>
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div class="empty" v-else>
      <div class="empty-bars">
        <div class="bar" style="--h: 60%; --c: #4EBEC2" />
        <div class="bar" style="--h: 35%; --c: #85ed8a" />
        <div class="bar" style="--h: 80%; --c: #C2654E" />
        <div class="bar" style="--h: 50%; --c: #A54EC2" />
        <div class="bar" style="--h: 25%; --c: #4EBEC2" />
      </div>
      <p class="empty-title">Статистика скоро появится</p>
      <p class="empty-sub">Начните проходить тесты — здесь будет ваш прогресс</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.statistics {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.content {
  display: flex;
  flex-direction: column;
  width: calc(100% - 40px);
  background: white;
  border-radius: 15px;
  box-shadow: rgba(34, 34, 34, 0.2) 0 0 20px;
  padding: 20px;

  .item {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin-bottom: 15px;
  }

  .ico {
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    background: var(--color);
    width: 45px;
    height: 45px;
    border-radius: 10px;
    margin-right: 10px;
  }

  .container {
    display: flex;
    flex-direction: row;
    width: 100%;
    justify-content: space-between;
    position: relative;
    padding-bottom: 15px;

    &::before {
      content: "";
      position: absolute;
      width: 100%;
      height: 10px;
      background: #F6F6F6;
      bottom: 0;
      border-radius: 5px;
    }

    &::after {
      content: "";
      position: absolute;
      width: var(--progress);
      height: 10px;
      background: linear-gradient(90deg, var(--color), rgba(74, 117, 74, 0.4));
      bottom: 0;
      border-radius: 5px;
      transition: width 0.4s ease;
    }

    .topic-title { margin: 0; }
    .progress    { margin: 0; }
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

/* Декоративные столбики графика */
.empty-bars {
  display: flex;
  align-items: flex-end;
  gap: 8px;
  height: 52px;
  margin-bottom: 4px;
}

.bar {
  width: 18px;
  height: var(--h);
  background: var(--c);
  border-radius: 4px 4px 0 0;
  opacity: 0.3;
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