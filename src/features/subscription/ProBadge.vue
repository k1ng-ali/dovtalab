<script setup lang="ts">
/**
 * Pro Badge — показывает бейдж "PRO" при нажатии на который
 * открывается модалка подписки.
 *
 * Использование:
 *   <ProBadge @click="openSubscriptionModal" />
 */
const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <span class="pro-badge" @click.stop="emit('click')">PRO</span>
</template>

<style scoped>
.pro-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  background: linear-gradient(135deg, #7C3AED, #4F46E5);
  color: #fff;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.5px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
}

.pro-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(124, 58, 237, 0.3);
}

.pro-badge:active {
  transform: scale(0.95);
}
</style>
