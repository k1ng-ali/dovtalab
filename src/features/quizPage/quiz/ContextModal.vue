<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { ContextIn } from 'src/features/quizPage/types.ts'

const props = defineProps<{
  context: ContextIn | null
}>()

const visible = ref(false)

const open  = () => { visible.value = true }
const close = () => { visible.value = false }

// Слушаем глобальное событие из QuizPage
const onGlobalOpen = () => open()

onMounted(()  => window.addEventListener('open-context-modal', onGlobalOpen))
onUnmounted(() => window.removeEventListener('open-context-modal', onGlobalOpen))
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="visible && context" class="sheet-overlay" @click.self="close">
        <div class="sheet">

          <!-- Handle -->
          <div class="handle" />

          <!-- Заголовок -->
          <div class="sheet-header">
            <h3 class="sheet-title">{{ context.title }}</h3>
            <button class="close-btn" @click="close">✕</button>
          </div>

          <!-- Контент -->
          <div class="sheet-body">
            <p class="context-text">{{ context.text }}</p>

            <div class="rule-block" v-if="context.rule">
              <p class="rule-label">📌 Правило</p>
              <p class="rule-text">{{ context.rule }}</p>
            </div>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.sheet-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(4px);
  z-index: 200;
  display: flex;
  align-items: flex-end;
}

.sheet {
  width: 100%;
  max-height: 75vh;
  background: #F6F6F6;
  border-radius: 28px 28px 0 0;
  padding: 0 20px 40px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  overflow-y: auto;
}

.handle {
  width: 40px;
  height: 4px;
  border-radius: 4px;
  background: rgba(35, 73, 112, 0.15);
  margin: 12px auto 0;
  flex-shrink: 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.sheet-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #234970;
}

.close-btn {
  background: rgba(35, 73, 112, 0.08);
  border: none;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  font-size: 13px;
  color: #234970;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;

  &:active { background: rgba(35, 73, 112, 0.18); }
}

.context-text {
  margin: 0;
  font-size: 15px;
  color: #374151;
  line-height: 1.65;
}

.rule-block {
  background: rgba(78, 190, 194, 0.08);
  border-left: 3px solid #4EBEC2;
  border-radius: 0 12px 12px 0;
  padding: 12px 14px;
}

.rule-label {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 700;
  color: #4EBEC2;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.rule-text {
  margin: 0;
  font-size: 14px;
  color: #374151;
  line-height: 1.55;
}

/* ── Sheet transition ── */
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.32s cubic-bezier(0.4, 0, 0.2, 1);
}

.sheet-enter-from,
.sheet-leave-to {
  opacity: 0;
  .sheet { transform: translateY(100%); }
}
</style>