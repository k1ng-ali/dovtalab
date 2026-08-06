<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import PassportCard from './PassportCard.vue'
import { usePassport } from './usePassport'
import { usePassportExport } from './usePassportExport'

const props  = defineProps<{ open: boolean }>()
const emit   = defineEmits<{ (e: 'close'): void }>()

const { passport, loading, fetch } = usePassport()
const { exporting, share, download } = usePassportExport()

// ref на обёртку div, а не на компонент — так $el гарантированно HTMLElement
const cardWrapRef = ref<HTMLElement | null>(null)

watch(() => props.open, async (val) => {
  if (val) await fetch()
})

const onShare = async () => {
  await nextTick()                     // дожидаемся рендера карточки
  const el = cardWrapRef.value
  if (!el) return
  await share(el)
}

const onDownload = async () => {
  await nextTick()
  const el = cardWrapRef.value
  if (!el) return
  await download(el)
}
</script>

<template>
  <Transition name="modal-fade">
    <div v-if="open" class="pm-overlay" @click.self="emit('close')">
      <div class="pm-sheet">

        <!-- Header -->
        <div class="pm-header">
          <span class="pm-title">Мой паспорт</span>
          <button class="pm-close" @click="emit('close')" aria-label="Закрыть">✕</button>
        </div>

        <!-- Card preview (scroll on mobile) -->
        <div class="pm-preview">
          <div v-if="loading" class="pm-skeleton" />
          <div v-else-if="passport" ref="cardWrapRef" class="pm-card-wrap">
            <PassportCard :passport="passport" />
          </div>
          <div v-else class="pm-error">Не удалось загрузить данные</div>
        </div>

        <!-- Actions -->
        <div class="pm-actions">
          <button
            class="pm-btn pm-btn--primary"
            :disabled="!passport || exporting"
            @click="onShare"
          >
            <span v-if="exporting">⏳ Генерация...</span>
            <span v-else>📤 Поделиться</span>
          </button>
          <button
            class="pm-btn pm-btn--secondary"
            :disabled="!passport || exporting"
            @click="onDownload"
          >
            ⬇ Скачать PNG
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.pm-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  backdrop-filter: blur(4px);
  z-index: 999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

.pm-sheet {
  width: 100%;
  max-width: 760px;
  background: #F6F6F6;
  border-radius: 24px 24px 0 0;
  padding: 20px 20px 32px;
  display: flex;
  flex-direction: column;
  gap: 16px;
  max-height: 92dvh;
  overflow-y: auto;
}

.pm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.pm-title {
  font-size: 17px;
  font-weight: 700;
  color: #1A2E4A;
}

.pm-close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(0,0,0,0.08);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  &:active { transform: scale(0.93); }
}

/* Preview — карточка шире экрана, скроллим горизонтально */
.pm-preview {
  overflow-x: auto;
  border-radius: 12px;
}

.pm-card-wrap {
  /* Карточка фиксированной ширины 680px — на мобиле скроллится */
  display: inline-block;
}

.pm-skeleton {
  width: 680px;
  height: 360px;
  border-radius: 18px;
  background: rgba(0,0,0,0.07);
  animation: pulse 1.4s ease infinite;
}

.pm-error {
  padding: 24px;
  text-align: center;
  color: #9CA3AF;
  font-size: 14px;
}

.pm-actions {
  display: flex;
  gap: 12px;
}

.pm-btn {
  flex: 1;
  padding: 14px;
  border-radius: 16px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.15s, opacity 0.15s;

  &:disabled { opacity: 0.5; cursor: not-allowed; }
  &:active:not(:disabled) { transform: scale(0.97); }

  &--primary {
    background: linear-gradient(135deg, #4EBEC2, #234970);
    color: #fff;
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.3);
  }

  &--secondary {
    background: rgba(26, 46, 74, 0.08);
    color: #234970;
  }
}

/* Transition */
.modal-fade-enter-active,
.modal-fade-leave-active { transition: opacity 0.25s ease; }
.modal-fade-enter-from,
.modal-fade-leave-to     { opacity: 0; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.45; }
}
</style>
