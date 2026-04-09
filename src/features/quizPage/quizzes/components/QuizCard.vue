<script setup lang="ts">
import type { QuizIn } from "src/features/quizPage/types.ts"

const props = defineProps<{
  quiz: QuizIn
}>()

</script>

<template>
  <div class="quiz-card">
    <!-- Иконка -->
    <div class="icon-wrapper">
      📘
    </div>

    <!-- Контент -->
    <div class="content">
      <div class="top">
        <h3 class="title">{{ quiz.title }}</h3>
        <span class="time" v-if="(quiz.time_limit/60) > 1">⏱ {{ Math.floor(quiz.time_limit / 60) }} мин</span>
      </div>

      <p class="description">
        {{ quiz.description }}
      </p>

      <!-- Прогресс
      <div class="progress-wrapper" v-if="hasProgress">
        <div class="progress-bar">
          <div
              class="progress-fill"
              :class="{ done: isCompleted }"
              :style="{ width: percent + '%' }"
          />
        </div>

        <div class="progress-info">
          {{ quiz.details?.stat.completed }} / {{ quiz.details!.total }}
          • {{ percent }}%
        </div>
      </div>

      <div v-else class="no-progress">
        Начните викторину
      </div>-->
    </div>
  </div>
</template>

<style scoped lang="scss">
.quiz-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;

  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);

  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  cursor: pointer;
  user-select: none;

  &:active {
    transform: scale(0.97);
  }
}

.icon-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;

  background: rgba(78, 190, 194, 0.2);
  font-size: 22px;
}

.content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  margin: 0;
  color: #234970;
}

.time {
  color: #8A94A6;
}

.description {
  margin: 0;
  color: #6B7280;
}

.progress-wrapper {
  margin-top: 6px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  border-radius: 6px;
  background: rgba(0, 0, 0, 0.06);
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(
          90deg,
          rgba(78, 190, 194, 1),
          rgba(35, 73, 112, 1)
  );
  transition: width 0.3s ease;
}

.progress-info {
  margin-top: 4px;
  font-size: 12px;
  color: #8A94A6;
}

.no-progress {
  font-size: 13px;
  color: #9CA3AF;
  margin-top: 6px;
}

.progress-fill.done {
  background: linear-gradient(
          90deg,
          #22c55e,
          #16a34a
  );
}
</style>