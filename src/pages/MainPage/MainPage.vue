<script setup lang="ts">
import Background from "@/pages/MainPage/Background.vue";
import Leaderboard from "@/features/mainPage/leaderboard/Leaderboard.vue";
import Statistics from "@/features/mainPage/statistic/Statistics.vue";
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import {onMounted, onUnmounted} from 'vue'

const headerStore = useHeaderStore()

onMounted(() => {
  headerStore.setIsVisible(false)
})

onUnmounted(() => {
  headerStore.setIsVisible(true)
})

</script>

<template>
  <Background />
  <div class="content">
    <Leaderboard/>
    <Statistics/>
  </div>
</template>

<style scoped lang="scss">
  .content {
    margin-top: clamp(250px, 30vw, 300px);
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    grid-auto-rows: max-content;
    gap: 20px;
    justify-content: center;
    justify-items: center;
    min-height: 100vh;
    background: #F6F6F6;
    width: calc(100% - 40px);
    padding: 20px;
    border-radius: 30px 30px 0 0;

    & > * {
      max-width: 700px;
      width: 100%;
    }
  }
</style>