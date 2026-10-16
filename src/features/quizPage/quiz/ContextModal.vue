<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import CloseIcon from '@iconify-vue/solar/close-circle-linear'
import type { ContextIn } from 'src/features/quizPage/types.ts'

defineProps<{
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
    <Transition name="ui-sheet">
      <div v-if="visible && context" class="ui-sheet-overlay" @click.self="close">
        <div class="ui-sheet" role="dialog" aria-modal="true">
          <div class="ui-sheet__handle" />

          <div class="ui-sheet__head">
            <h3 class="ui-sheet__title">{{ context.title }}</h3>
            <button type="button" class="ui-icon-btn ui-sheet__close" @click="close"><CloseIcon /></button>
          </div>

          <p class="context-text">{{ context.text }}</p>

          <div class="rule-block" v-if="context.rule">
            <p class="rule-label">{{ $t('quiz.rule') }}</p>
            <p class="rule-text">{{ context.rule }}</p>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.context-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.65;
  color: var(--c-ink);
  white-space: pre-wrap;
}

.rule-block {
  padding: 12px 14px;
  border-radius: var(--r-md);
  background: var(--c-teal-tint);
}

.rule-label {
  margin: 0 0 4px;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  color: var(--c-teal-600);
}

.rule-text { margin: 0; font-size: 14px; line-height: 1.5; color: var(--c-ink); }
</style>
