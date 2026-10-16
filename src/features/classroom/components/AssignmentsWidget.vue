<script setup lang="ts">
// Блок на главной: невыполненные задания от учителя. Не показывается, если ученик ни в одном классе.
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { storeToRefs } from 'pinia'
import { useClassroomStore } from '../store.ts'
import AssignmentCard from './AssignmentCard.vue'
import type { StudentAssignment } from '../types.ts'

const store = useClassroomStore()
const { pending, hasClassrooms, isLoaded } = storeToRefs(store)
const router = useRouter()
const { t } = useI18n()

const visible = computed(() => pending.value.slice(0, 3))

onMounted(() => {
  store.fetchAll().catch(() => { /* блок необязательный — молча */ })
})

function open(a: StudentAssignment) {
  router.push(`/assignment/${a.id}`)
}
</script>

<template>
  <section v-if="isLoaded && hasClassrooms" class="widget">
    <div class="widget__head">
      <h3 class="widget__title">{{ t('classes.widgetTitle') }}</h3>
      <button class="widget__all" type="button" @click="router.push('/classes')">
        {{ t('classes.widgetAll') }} ›
      </button>
    </div>

    <template v-if="visible.length">
      <AssignmentCard v-for="a in visible" :key="a.id" :assignment="a" compact @open="open" />
      <button v-if="pending.length > visible.length" class="widget__more" type="button" @click="router.push('/classes')">
        + {{ pending.length - visible.length }} {{ t('common.more') }}
      </button>
    </template>
    <p v-else class="widget__empty">{{ t('classes.noPending') }}</p>
  </section>
</template>

<style scoped lang="scss">
.widget {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);

  &__head { display: flex; justify-content: space-between; align-items: center; }
  &__title { margin: 0; font-size: 16px; font-weight: 700; color: #234970; }

  &__all, &__more {
    background: none;
    border: none;
    color: #4EBEC2;
    font-family: inherit;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
  }

  &__more { align-self: center; }
  &__empty { margin: 4px 0; font-size: 13px; color: #6B7280; text-align: center; }
}
</style>
