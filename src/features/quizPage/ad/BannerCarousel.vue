<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { Capacitor } from '@capacitor/core'
import type { Banner } from './types'
import type { QuizIn } from '@/features/quizPage/types'
import { fetchBanners } from './api'
import { useQuiz } from '@/features/quizPage/store'
import { useStats } from '@/features/mainPage/statistic/store'

const emit = defineEmits<{
  (e: 'select-quiz', quiz: QuizIn): void
}>()

const banners = ref<Banner[]>([])
const continueQuiz = ref<QuizIn | null>(null)
const loading = ref(true)

// Carousel state
const currentIndex = ref(0)
const isTransitioning = ref(false)
const direction = ref<'next' | 'prev'>('next')
const isPaused = ref(false)

const INTERVAL = 5000 // 5 seconds
let timer: ReturnType<typeof setInterval> | null = null
let progressStart = 0

// Progress animation (0 to 1)
const progress = ref(0)
let progressFrame: number | null = null

// Combined slides: dynamic banners + "continue playing" banner
interface Slide {
  type: 'banner' | 'continue'
  banner?: Banner
  quiz?: QuizIn
}

const slides = computed<Slide[]>(() => {
  const items: Slide[] = banners.value.map(b => ({ type: 'banner' as const, banner: b }))
  if (continueQuiz.value) {
    items.push({ type: 'continue', quiz: continueQuiz.value })
  }
  return items
})

const totalSlides = computed(() => slides.value.length)

// Current slide (safe access)
const currentSlide = computed(() => slides.value[currentIndex.value])

// Background style per slide
const getSlideStyle = (slide: Slide) => {
  if (slide.type === 'continue') {
    return { background: 'linear-gradient(135deg, #4EBEC2 0%, #234970 100%)' }
  }
  if (slide.banner?.background_type === 'image') {
    return {
      backgroundImage: `url(${slide.banner.background_value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
    }
  }
  return { background: slide.banner?.background_value || 'linear-gradient(135deg, #4EBEC2, #234970)' }
}

// Navigation
const goTo = (index: number) => {
  if (isTransitioning.value || index === currentIndex.value) return
  direction.value = index > currentIndex.value ? 'next' : 'prev'
  isTransitioning.value = true
  currentIndex.value = index
  resetProgress()
  setTimeout(() => { isTransitioning.value = false }, 400)
}

const next = () => {
  if (totalSlides.value <= 1) return
  goTo((currentIndex.value + 1) % totalSlides.value)
}

// Auto-play with progress bar
const startProgress = () => {
  progressStart = Date.now()
  progress.value = 0

  const animate = () => {
    if (isPaused.value) {
      progressFrame = requestAnimationFrame(animate)
      return
    }
    const elapsed = Date.now() - progressStart
    progress.value = Math.min(elapsed / INTERVAL, 1)

    if (progress.value >= 1) {
      next()
    } else {
      progressFrame = requestAnimationFrame(animate)
    }
  }
  progressFrame = requestAnimationFrame(animate)
}

const resetProgress = () => {
  if (progressFrame) cancelAnimationFrame(progressFrame)
  progressStart = Date.now()
  progress.value = 0
  startProgress()
}

// Touch handling
let touchStartX = 0
let touchStartY = 0

const onTouchStart = (e: TouchEvent) => {
  isPaused.value = true
  touchStartX = e.touches[0]?.clientX ?? 0
  touchStartY = e.touches[0]?.clientY ?? 0
}

const onTouchEnd = (e: TouchEvent) => {
  isPaused.value = false
  const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartX
  const dy = (e.changedTouches[0]?.clientY ?? 0) - touchStartY

  // Swipe only if horizontal movement > vertical and > 50px
  if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
    if (dx < 0) {
      goTo((currentIndex.value + 1) % totalSlides.value)
    } else {
      goTo((currentIndex.value - 1 + totalSlides.value) % totalSlides.value)
    }
  } else {
    resetProgress()
  }
}

// Action handling
const handleAction = (slide: Slide) => {
  if (slide.type === 'continue' && slide.quiz) {
    emit('select-quiz', slide.quiz)
    return
  }
  if (slide.banner) {
    if (slide.banner.action_type === 'url' && slide.banner.action_value) {
      if (Capacitor.isNativePlatform()) {
        import('@capacitor/browser').then(({ Browser }) => {
          Browser.open({ url: slide.banner!.action_value! })
        })
      } else {
        window.open(slide.banner.action_value, '_blank')
      }
    } else if (slide.banner.action_type === 'quiz' && slide.banner.action_value) {
      // Fetch quiz and open info
      const quizStore = useQuiz()
      quizStore.getQuiz(Number(slide.banner.action_value)).then(quiz => {
        emit('select-quiz', quiz)
      })
    }
  }
}

// Load data
onMounted(async () => {
  try {
    const [bannersRes] = await Promise.all([fetchBanners()])
    banners.value = bannersRes.data

    // Load "continue playing" quiz
    const statStore = useStats()
    await statStore.fetchAttemptsHistory(0, 5)
    if (statStore.attempts?.length && statStore.attempts[0]) {
      const quizStore = useQuiz()
      continueQuiz.value = await quizStore.getQuiz(statStore.attempts[0].quiz_id)
    }
  } catch (e) {
    console.error('Failed to load banners:', e)
  } finally {
    loading.value = false
  }

  if (slides.value.length > 1) {
    startProgress()
  }
})

onUnmounted(() => {
  if (progressFrame) cancelAnimationFrame(progressFrame)
  if (timer) clearInterval(timer)
})

// Restart progress when slides change
watch(totalSlides, (val) => {
  if (val > 1 && !progressFrame) {
    startProgress()
  }
})
</script>

<template>
  <!-- Skeleton -->
  <div v-if="loading" class="banner-skeleton">
    <div class="skeleton-shimmer" />
  </div>

  <!-- Carousel -->
  <div
    v-else-if="slides.length > 0"
    class="banner-carousel"
    @touchstart.passive="onTouchStart"
    @touchend="onTouchEnd"
  >
    <!-- Slides -->
    <div class="slides-container" v-if="currentSlide">
      <Transition :name="direction === 'next' ? 'slide-next' : 'slide-prev'" mode="out-in">
        <div
          :key="currentIndex"
          class="slide"
          :style="getSlideStyle(currentSlide)"
          @click="handleAction(currentSlide)"
        >
          <div class="slide-content">
            <h3 class="slide-title">
              {{ currentSlide.type === 'continue' ? currentSlide.quiz?.title : currentSlide.banner?.title }}
            </h3>
            <p class="slide-desc">
              {{ currentSlide.type === 'continue' ? 'Продолжайте играть' : currentSlide.banner?.description }}
            </p>
            <div
              v-if="currentSlide.type === 'continue' || currentSlide.banner?.cta_text"
              class="slide-cta"
              :style="currentSlide.banner?.cta_color ? { background: currentSlide.banner.cta_color } : {}"
            >
              {{ currentSlide.type === 'continue' ? 'Играть' : currentSlide.banner?.cta_text }}
            </div>
          </div>
        </div>
      </Transition>
    </div>

    <!-- Indicators with progress -->
    <div v-if="totalSlides > 1" class="indicators">
      <div
        v-for="(_, idx) in slides"
        :key="idx"
        class="indicator"
        :class="{ active: idx === currentIndex }"
        @click="goTo(idx)"
      >
        <div
          v-if="idx === currentIndex"
          class="indicator-progress"
          :style="{ transform: `scaleX(${progress})` }"
        />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.banner-carousel {
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}

.slides-container {
  position: relative;
  min-height: 140px;
}

.slide {
  min-height: 140px;
  padding: 20px;
  display: flex;
  align-items: flex-start;
  border-radius: 20px;
  cursor: pointer;
  user-select: none;
  position: relative;
  overflow: hidden;

  &::after {
    content: '';
    position: absolute;
    top: -40%;
    right: -15%;
    width: 140px;
    height: 140px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.06);
    pointer-events: none;
  }
}

.slide-content {
  display: flex;
  flex-direction: column;
  color: white;
  z-index: 1;
}

.slide-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  line-height: 1.3;
}

.slide-desc {
  margin: 4px 0 0;
  font-size: 13px;
  opacity: 0.85;
  line-height: 1.4;
}

.slide-cta {
  margin-top: 16px;
  padding: 6px 20px;
  background: rgba(205, 174, 100, 0.95);
  color: white;
  width: max-content;
  border-radius: 50px;
  font-weight: 600;
  font-size: 14px;
  transition: transform 0.15s ease;

  &:active {
    transform: scale(0.95);
  }
}

/* ── Indicators ── */
.indicators {
  display: flex;
  gap: 6px;
  justify-content: center;
  padding: 10px 0 4px;
}

.indicator {
  width: 24px;
  height: 4px;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: width 0.3s ease;

  &.active {
    width: 36px;
    background: rgba(35, 73, 112, 0.15);
  }
}

.indicator-progress {
  position: absolute;
  inset: 0;
  background: #234970;
  border-radius: 4px;
  transform-origin: left;
  transition: none;
}

/* ── Slide transitions ── */
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-next-enter-from {
  opacity: 0;
  transform: translateX(40px) scale(0.97);
}
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-40px) scale(0.97);
}

.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-40px) scale(0.97);
}
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(40px) scale(0.97);
}

/* ── Skeleton ── */
.banner-skeleton {
  min-height: 140px;
  border-radius: 20px;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.skeleton-shimmer {
  width: 100%;
  height: 100%;
  min-height: 140px;
  background: linear-gradient(
    90deg,
    rgba(0, 0, 0, 0.04) 25%,
    rgba(0, 0, 0, 0.08) 50%,
    rgba(0, 0, 0, 0.04) 75%
  );
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
}

@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}
</style>
