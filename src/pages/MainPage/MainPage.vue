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
    margin-top: 250px;
    display: flex;
    flex-direction: column;
    position: relative;
    width: calc(100% - 40px);
    height: 100%;
    max-height: 100vh;
    background: #F6F6F6;
    padding: 20px;
    border-radius: 30px 30px 0 0;
    padding-bottom: 300px;

  }
</style>