<script setup lang="ts">
import {useStats} from "@/features/mainPage/statistic/store.ts";
import {computed, onMounted} from "vue";
import { timeFormat} from "@/shared/utils.ts"
// Когда бэкенд будет готов — убери isEmpty и подключи реальные данные

const statStore = useStats()
const userStats = computed(() => statStore.stats)
const attemptHistory = computed(() => statStore.attempts)

const isEmpty = computed(() => {
  const stats = userStats.value
  return !stats
})

onMounted(async () => {
  try {
    await statStore.fetchStats()
    await statStore.fetchAttemptsHistory(0,5)
  } catch (error) {
    console.error(error)
  }
})

</script>

<template>
  <div class="statistics">
    <div class="header">
      <h2 class="title">Статистика 📈</h2>
      <p class="all" v-if="!isEmpty">ещё</p>
    </div>

    <!-- Обычный контент -->
    <div class="content" v-if="!isEmpty">
      <div class="meta-grid">
        <div class="meta-item" v-if="userStats && userStats.total_quizzes_completed > 0">
          <span class="meta-icon">📌</span>
          <span class="meta-label">Тестов пройдено</span>
          <span class="meta-value">{{userStats.total_quizzes_completed}}</span>
        </div>

        <div class="meta-item" v-if="userStats && userStats.total_questions_answered">
          <span class="meta-icon">💠</span>
          <span class="meta-label">Ответили вопросов</span>
          <span class="meta-value">{{userStats.total_questions_answered}}</span>
        </div>

        <div class="meta-item" v-if="userStats && userStats.correct_answers">
          <span class="meta-icon">✅</span>
          <span class="meta-label">Правильных ответов</span>
          <span class="meta-value">{{userStats.correct_answers}}</span>
        </div>

        <div class="meta-item" v-if="userStats && userStats.accuracy_percent">
          <span class="meta-icon">📈</span>
          <span class="meta-label">Точность</span>
          <span class="meta-value">{{userStats.accuracy_percent}}</span>
        </div>
      </div>

      <h4 class="attempt-tile">История попыток</h4>
      <div class="attempt-contnet" v-if="attemptHistory">
        <div class="attempt-history"
             v-for="attempt in attemptHistory.filter(a => a.correct_count)"
             :key="attemptHistory.indexOf(attempt)"
        >
          <h5 class="title">{{attempt.quiz_title}}</h5>
          <div class="desc" v-if="attempt.correct_count && attempt.questions_count">
            <p>✅{{attempt.correct_count}} • {{Math.round(attempt.correct_count/attempt.questions_count*100)}}%</p>
            <p v-if="attempt.duration_sec">
              {{timeFormat(attempt.duration_sec)}}
            </p>
          </div>
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
  box-sizing: border-box;
}

.header {
  display: flex;
  width: 100%;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
  box-sizing: border-box;
}

.content {
  display: flex;
  flex-direction: column;
  width: 100%;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  box-shadow: rgba(34, 34, 34, 0.2) 0 0 20px;
  padding: 20px;
  box-sizing: border-box;

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

/* ── Meta grid ── */
.meta-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  width: 100%;
}

.meta-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 18px;
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.05);
}

.meta-icon {
  font-size: 20px;
  margin-bottom: 4px;
}

.meta-label {
  font-size: 14px;
  color: #9CA3AF;
  font-weight: 500;
}

.meta-header {
  font-size: large;
  font-weight: 700;
  color: #234970;
}

.meta-value {
  font-weight: 500;
  color: rgba(64, 64, 64);
}

/* ── Attempt History ── */

.attempt-tile {
  margin-top: 30px;
}

.attempt-contnet {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .attempt-history {
    display: flex;
    flex-direction: column;
    background: white;
    padding: 20px;
    border-radius: 20px;

    .title {
      margin: 0;
    }

    .desc {
      display: flex;
      justify-content: space-between;
      color: #6B7280;
    }
    p {
      margin-bottom: 0;
    }
  }
}

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