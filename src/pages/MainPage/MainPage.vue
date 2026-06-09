<script setup lang="ts">
import Background from "@/pages/MainPage/Background.vue";
import Leaderboard from "@/features/mainPage/leaderboard/Leaderboard.vue";
import Statistics from "@/features/mainPage/statistic/Statistics.vue";
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
    <Leaderboard/>
    <Statistics/>
  </div>
</template>

<style scoped lang="scss">
/* Твои стили остаются без изменений */
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
  width: 100%;
  padding: 20px;
  padding-top: calc(env(safe-area-inset-top) + 20px);
  border-radius: 30px 30px 0 0;
  box-sizing: border-box;

  & > * {
    max-width: 700px;
    width: 100%;
  }
}
</style>