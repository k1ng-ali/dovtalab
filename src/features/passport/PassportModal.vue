<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import PassportCard from './PassportCard.vue'
import { usePassport } from './usePassport'
import { usePassportExport } from './usePassportExport'

const props  = defineProps<{ open: boolean }>()
const emit   = defineEmits<{ (e: 'close'): void }>()

const { passport, loading, fetch } = usePassport()
const { exporting, share, download } = usePassportExport()

const cardWrapRef = ref<HTMLElement | null>(null)
const previewRef  = ref<HTMLElement | null>(null)
const scale       = ref(1)
// Реальная высота карточки после рендера — пересчитываем динамически
const cardRealHeight = ref(0)

const CARD_WIDTH = 680

function updateScale() {
  if (!previewRef.value) return
  const available = previewRef.value.clientWidth
  scale.value = available < CARD_WIDTH ? available / CARD_WIDTH : 1
  // Пересчитываем высоту после смены scale
  updateHeight()
}

function updateHeight() {
  if (!cardWrapRef.value) return
  // Берём реальную высоту DOM-элемента карточки
  const h = cardWrapRef.value.scrollHeight || cardWrapRef.value.offsetHeight
  if (h > 0) cardRealHeight.value = h
}

// Высота контейнера = реальная высота карточки * scale
const scaledHeight = computed(() =>
  cardRealHeight.value > 0
    ? `${Math.round(cardRealHeight.value * scale.value)}px`
    : 'auto'
)

watch(() => props.open, async (val) => {
  if (val) {
    await fetch()
    await nextTick()
    updateScale()
    // Ещё один тик — дожидаемся полного рендера карточки с бейджами
    await nextTick()
    updateHeight()
  }
})

onMounted(() => {
  window.addEventListener('resize', updateScale)
})

const onShare = async () => {
  await nextTick()
  const el = cardWrapRef.value
  if (!el) return
  await share(el)
}

const onDownload = async () => {
  await nextTick()
  const el = cardWrapRef.value
  if (!el) return
  try {
    await download(el)
    emit('close')
    message.success('Паспорт сохранён 🎉')
  } catch {
    message.error('Не удалось сохранить паспорт')
  }
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

        <!-- Card preview — масштабируется через transform, высота вычисляется динамически -->
        <div class="pm-preview" ref="previewRef" :style="{ height: scaledHeight }">
          <div v-if="loading" class="pm-skeleton" />
          <div
            v-else-if="passport"
            class="pm-card-scaler"
            :style="{ transform: `scale(${scale})`, transformOrigin: 'top left', width: '680px' }"
          >
            <div ref="cardWrapRef">
              <PassportCard :passport="passport" />
            </div>
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

/* Preview — точная высота вычисляется динамически по реальному контенту */
.pm-preview {
  width: 100%;
  border-radius: 12px;
  /* НЕ overflow:hidden — иначе обрежет карточку */
  overflow: visible;
  position: relative;
}

.pm-card-scaler {
  display: block;
  /* width задаётся инлайн (680px) */
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
