<script setup lang="ts">
import Background from "@/pages/MainPage/Background.vue";
import Leaderboard from "@/features/mainPage/leaderboard/Leaderboard.vue";
import Statistics from "@/features/mainPage/statistic/Statistics.vue";
import DailyChallenge from "@/features/mainPage/dailyChallenge/DailyChallenge.vue";
import ProBanner from "@/features/subscription/ProBanner.vue";
import {useHeaderStore} from '@/shared/stores/useHeaderStore.ts'
import {onMounted, onUnmounted, ref} from 'vue'
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";
import {EdgeToEdge} from "@capawesome/capacitor-android-edge-to-edge-support";
import {useNavStore} from "@/shared/stores/useNavStore.ts";
// EdgeToEdge API нам больше не нужно вызывать в JS, убираем его импорт

const headerStore = useHeaderStore()
const navigatorStore = useNavStore()
const contentRef = ref<HTMLElement | null>(null)
let isStatusBarLight = false;

const handleScroll = async () => {
  if (!Capacitor.isNativePlatform() || !contentRef.value) return;

  const topPosition = contentRef.value.getBoundingClientRect().top;

  // Когда блок .content касается низа статус-бара (около 50px от верха экрана)
  if (topPosition <= 50 && !isStatusBarLight) {
    isStatusBarLight = true;
    try {
      // Только меняем иконки на тёмные (для белого фона #F6F6F6)
      await SystemBars.setStyle({ style: SystemBarsStyle.Light })

      await EdgeToEdge.setBackgroundColor({ color: '#F6F6F6' });
    } catch (e) {
      console.error('Ошибка смены StatusBar (Light):', e);
    }
  }
  // Когда скроллим обратно вниз
  else if (topPosition > 50 && isStatusBarLight) {
    isStatusBarLight = false;
    try {
      // Возвращаем светлые иконки (для тёмного фона #112437)
      await SystemBars.setStyle({ style: SystemBarsStyle.Dark })

      await EdgeToEdge.setBackgroundColor({ color: '#112437' });
    } catch (e) {
      console.error('Ошибка смены StatusBar (Dark):', e);
    }
  }
};

onMounted(async () => {
  headerStore.setIsVisible(false)
  navigatorStore.showTabs()

  if (Capacitor.isNativePlatform()) {
    try {
      // При старте ставим белые иконки
      await SystemBars.setStyle({ style: SystemBarsStyle.Dark })
      await EdgeToEdge.setBackgroundColor({ color: '#112437' });
    } catch (e) {
      console.error('Ошибка настройки StatusBar:', e);
    }
  }

  window.addEventListener('scroll', handleScroll, { passive: true });
})

onUnmounted(() => {
  headerStore.setIsVisible(true)
  window.removeEventListener('scroll', handleScroll);
})
</script>

<template>
  <Background />
  <div class="content" ref="contentRef">
    <DailyChallenge/>
    <ProBanner/>
    <Leaderboard/>
    <Statistics/>
  </div>
</template>

<style scoped lang="scss">
.content {
  margin-top: clamp(250px, 30vw, 300px);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  min-height: 100vh;
  background: #F6F6F6;
  width: 100%;
  padding: 20px;
  padding-top: calc(env(safe-area-inset-top) + 20px);
  padding-bottom: 100px;
  border-radius: 30px 30px 0 0;
  box-sizing: border-box;

  & > * {
    max-width: 700px;
    width: 100%;
  }

  @media (min-width: 900px) {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: auto;
    padding: 40px;
    padding-bottom: 100px;
    align-items: start;
    justify-items: center;

    & > * {
      max-width: none;
      width: 100%;
    }

    // Daily Challenge — full width
    & > :nth-child(1) {
      grid-column: 1 / -1;
      max-width: 700px;
    }

    // Pro Banner — full width
    & > :nth-child(2) {
      grid-column: 1 / -1;
      max-width: 700px;
    }

    // Leaderboard — left
    & > :nth-child(3) {
      grid-column: 1;
    }

    // Statistics — right
    & > :nth-child(4) {
      grid-column: 2;
    }
  }
}
</style>