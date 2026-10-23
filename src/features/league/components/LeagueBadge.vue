<script setup lang="ts">
// Значок уровня лиги: кубок на круге цвета уровня (Бронза … Алмаз).
import { computed } from 'vue'
import CupIcon from '@iconify-vue/solar/cup-first-bold-duotone'

const props = withDefaults(defineProps<{
  tier: number
  size?: number
}>(), { size: 56 })

// Цвета уровней: 0 Бронза, 1 Серебро, 2 Золото, 3 Изумруд, 4 Сапфир, 5 Рубин, 6 Алмаз
const TIER_COLORS = ['#B97A4E', '#8C9AAD', '#D9A21B', '#15803D', '#1D4ED8', '#B91C1C', '#0F7A80']

const color = computed(() => TIER_COLORS[props.tier] ?? TIER_COLORS[0])
</script>

<template>
  <span
      class="league-badge"
      :style="{ '--tier': color, width: size + 'px', height: size + 'px', fontSize: size * 0.5 + 'px' }"
      aria-hidden="true"
  >
    <CupIcon />
  </span>
</template>

<style scoped lang="scss">
.league-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border-radius: 50%;
  color: #FFFFFF;
  background:
      radial-gradient(circle at 30% 25%, rgba(255, 255, 255, 0.45), transparent 55%),
      var(--tier);
  box-shadow: 0 0 0 3px #FFFFFF, 0 8px 20px color-mix(in srgb, var(--tier) 35%, transparent);
}
</style>
