<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import type { ClassroomPreview } from '../types.ts'

const props = defineProps<{
  initialCode?: string
  preview: ClassroomPreview | null
  error: string
  loading: boolean
}>()

const emit = defineEmits<{
  (e: 'find', code: string): void
  (e: 'join', code: string): void
  (e: 'reset'): void
}>()

const { t } = useI18n()
const code = ref(props.initialCode ?? '')

watch(() => props.initialCode, (v) => { if (v) code.value = v })

function normalized() {
  return code.value.trim().toUpperCase().replace(/^CLASS_/, '')
}

function onInput() {
  if (props.preview || props.error) emit('reset')
}
</script>

<template>
  <div class="join">
    <div class="join__head">
      <span class="join__icon">🎓</span>
      <div>
        <h3 class="join__title">{{ t('classes.joinTitle') }}</h3>
        <p class="join__hint">{{ t('classes.joinHint') }}</p>
      </div>
    </div>

    <form class="join__form" @submit.prevent="emit('find', normalized())">
      <input v-model="code" class="join__input" :placeholder="t('classes.codePlaceholder')" maxlength="16"
             autocapitalize="characters" autocomplete="off" @input="onInput" />
      <button class="join__btn" type="submit" :disabled="normalized().length < 4 || loading">
        {{ t('classes.find') }}
      </button>
    </form>

    <p v-if="error" class="join__error">{{ error }}</p>

    <div v-if="preview" class="preview">
      <span class="preview__title">{{ preview.title }}</span>
      <span v-if="preview.teacher_name" class="preview__meta">{{ t('classes.teacher', { name: preview.teacher_name }) }}</span>
      <span class="preview__meta">{{ t('classes.studentsCount', { n: preview.students_count }) }}</span>
      <p v-if="preview.description" class="preview__desc">{{ preview.description }}</p>
      <p v-if="preview.is_member" class="preview__member">✓ {{ t('classes.alreadyMember') }}</p>
      <button v-else class="join__btn join__btn--wide" type="button" :disabled="loading" @click="emit('join', normalized())">
        {{ t('classes.join') }}
      </button>
    </div>
  </div>
</template>

<style scoped lang="scss">
.join {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);

  &__head { display: flex; align-items: center; gap: 12px; }
  &__icon { font-size: 30px; }
  &__title { margin: 0; font-size: 16px; font-weight: 700; color: #234970; }
  &__hint { margin: 2px 0 0; font-size: 12px; color: #6B7280; }

  &__form { display: flex; gap: 8px; }

  &__input {
    flex: 1;
    min-width: 0;
    padding: 12px 16px;
    border-radius: 30px;
    border: 1.5px solid rgba(0, 0, 0, 0.1);
    background: #fff;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: #234970;
    outline: none;

    &:focus { border-color: #4EBEC2; box-shadow: 0 0 0 3px rgba(78, 190, 194, 0.15); }
    &::placeholder { letter-spacing: 0; font-weight: 500; font-family: inherit; color: #9CA3AF; text-transform: none; }
  }

  &__btn {
    padding: 12px 20px;
    border-radius: 30px;
    border: none;
    background: linear-gradient(135deg, #4EBEC2, #234970);
    color: #fff;
    font-family: inherit;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);
    transition: all 0.2s ease;

    &:active:not(:disabled) { transform: scale(0.97); }
    &:disabled { opacity: 0.5; cursor: not-allowed; }
    &--wide { width: 100%; margin-top: 6px; }
  }

  &__error { margin: 0; font-size: 13px; color: #EF4444; }
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  border-radius: 16px;
  background: rgba(78, 190, 194, 0.08);
  border: 1px solid rgba(78, 190, 194, 0.25);

  &__title { font-size: 17px; font-weight: 800; color: #234970; }
  &__meta { font-size: 13px; color: #6B7280; }
  &__desc { margin: 6px 0 0; font-size: 13px; color: #374151; white-space: pre-line; }
  &__member { margin: 8px 0 0; font-size: 13px; font-weight: 600; color: #059669; }
}
</style>
