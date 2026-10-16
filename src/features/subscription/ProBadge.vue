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
  <button type="button" class="pro-badge" @click.stop="emit('click')">PRO</button>
</template>

<style scoped>
.pro-badge {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  padding: 4px 10px;
  border: none;
  border-radius: var(--r-pill);
  background: var(--grad-primary);
  color: #FFFFFF;
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.6px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.18s ease;
}

.pro-badge:active {
  transform: scale(0.94);
}
</style>
