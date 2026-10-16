<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import CapIcon from '@iconify-vue/solar/square-academic-cap-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-linear'
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
  <div class="join ui-card">
    <div class="join__head">
      <span class="ui-tile-icon join__icon"><CapIcon /></span>
      <div>
        <h3 class="join__title">{{ t('classes.joinTitle') }}</h3>
        <p class="join__hint">{{ t('classes.joinHint') }}</p>
      </div>
    </div>

    <form class="join__form" @submit.prevent="emit('find', normalized())">
      <input v-model="code" class="ui-input join__input" :placeholder="t('classes.codePlaceholder')" maxlength="16"
             autocapitalize="characters" autocomplete="off" @input="onInput" />
      <button class="ui-btn ui-btn--primary" type="submit" :disabled="normalized().length < 4 || loading">
        {{ t('classes.find') }}
      </button>
    </form>

    <p v-if="error" class="join__error">{{ error }}</p>

    <div v-if="preview" class="preview">
      <b class="preview__title">{{ preview.title }}</b>
      <span v-if="preview.teacher_name" class="preview__meta">{{ t('classes.teacher', { name: preview.teacher_name }) }}</span>
      <span class="preview__meta">{{ t('classes.studentsCount', { n: preview.students_count }) }}</span>
      <p v-if="preview.description" class="preview__desc">{{ preview.description }}</p>
      <p v-if="preview.is_member" class="preview__member"><CheckIcon />{{ t('classes.alreadyMember') }}</p>
      <button v-else class="ui-btn ui-btn--primary ui-btn--block preview__join" type="button" :disabled="loading" @click="emit('join', normalized())">
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

  &__head { display: flex; align-items: center; gap: 12px; }
  &__icon { width: 40px; height: 40px; border-radius: 12px; font-size: 20px; }
  &__title { margin: 0; font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
  &__hint { margin: 2px 0 0; font-size: 12px; color: var(--c-muted); }

  &__form { display: flex; gap: 8px; }

  &__input {
    flex: 1;
    min-width: 0;
    font-family: ui-monospace, Menlo, monospace;
    font-size: 16px;
    font-weight: 700;
    letter-spacing: 3px;
    text-transform: uppercase;
    color: var(--c-navy-900);

    &::placeholder { letter-spacing: 0; font-weight: 500; font-family: var(--font-ui); text-transform: none; }
  }

  &__error { margin: 0; padding: 0 6px; font-size: 13px; font-weight: 600; color: var(--c-danger); }
}

.preview {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 14px;
  border-radius: var(--r-md);
  background: var(--c-teal-tint);

  &__title { font-size: 17px; font-weight: 800; color: var(--c-navy-900); }
  &__meta { font-size: 13px; color: var(--c-ink-2); }
  &__desc { margin: 6px 0 0; font-size: 13px; color: var(--c-ink); white-space: pre-line; }

  &__member {
    display: flex;
    align-items: center;
    gap: 6px;
    margin: 8px 0 0;
    font-size: 13px;
    font-weight: 700;
    color: var(--c-teal-600);
  }

  &__join { margin-top: 10px; }
}
</style>
