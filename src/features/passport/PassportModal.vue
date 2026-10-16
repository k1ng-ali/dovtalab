<script setup lang="ts">
import { ref, watch, nextTick, onMounted, computed } from 'vue'
import { message } from 'ant-design-vue'
import PassportCard from './PassportCard.vue'
import { usePassport } from './usePassport'
import { usePassportExport } from './usePassportExport'
import { useI18n } from 'vue-i18n'
import CloseIcon from '@iconify-vue/solar/close-circle-linear'
import ShareIcon from '@iconify-vue/solar/share-linear'
import DownloadIcon from '@iconify-vue/solar/download-minimalistic-linear'

const props  = defineProps<{ open: boolean }>()
const emit   = defineEmits<{ (e: 'close'): void }>()
const { t } = useI18n()

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
    message.success(t('passport.saved'))
  } catch {
    message.error(t('passport.saveFailed'))
  }
}
</script>

<template>
  <Transition name="ui-sheet">
    <div v-if="open" class="ui-sheet-overlay pm-overlay" @click.self="emit('close')">
      <div class="ui-sheet pm-sheet" role="dialog" aria-modal="true">
        <div class="ui-sheet__handle" />

        <div class="ui-sheet__head">
          <span class="ui-sheet__title">{{ $t('passport.my') }}</span>
          <button type="button" class="ui-icon-btn ui-sheet__close" @click="emit('close')" :aria-label="$t('common.close')"><CloseIcon /></button>
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
          <div v-else class="pm-error">{{ $t('passport.loadFailed') }}</div>
        </div>

        <!-- Actions -->
        <div class="pm-actions">
          <button
            type="button"
            class="ui-btn ui-btn--primary pm-btn"
            :disabled="!passport || exporting"
            @click="onShare"
          >
            <span v-if="exporting" class="pm-spinner" />
            <span v-if="exporting">{{ $t('passport.generating') }}</span>
            <template v-else><ShareIcon />{{ $t('passport.share') }}</template>
          </button>
          <button
            type="button"
            class="ui-btn ui-btn--secondary pm-btn"
            :disabled="!passport || exporting"
            @click="onDownload"
          >
            <DownloadIcon />{{ $t('passport.download') }}
          </button>
        </div>

      </div>
    </div>
  </Transition>
</template>

<style scoped lang="scss">
.pm-overlay { z-index: 999; }
.pm-sheet { max-width: 760px; max-height: 92dvh; }

/* Preview — точная высота вычисляется динамически по реальному контенту */
.pm-preview {
  width: 100%;
  border-radius: 12px;
  /* НЕ overflow:hidden — иначе обрежет карточку */
  overflow: visible;
  position: relative;
}

.pm-card-scaler { display: block; }

.pm-skeleton {
  width: 680px;
  height: 360px;
  border-radius: 18px;
  background: rgba(23, 46, 74, 0.07);
  animation: pulse 1.4s ease infinite;
}

.pm-error {
  padding: 24px;
  text-align: center;
  color: var(--c-muted);
  font-size: 14px;
}

.pm-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.pm-btn :deep(svg) { font-size: 18px; }

.pm-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-top-color: #FFFFFF;
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
