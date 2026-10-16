<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import BsArrowLeft from '@iconify-vue/solar/alt-arrow-left-linear'
import { useClassroomStore } from '@/features/classroom/store.ts'
import JoinClassCard from '@/features/classroom/components/JoinClassCard.vue'
import AssignmentCard from '@/features/classroom/components/AssignmentCard.vue'
import { assignmentError } from '@/features/classroom/format.ts'
import { useHeaderStore } from '@/shared/stores/useHeaderStore.ts'
import { useNavStore } from '@/shared/stores/useNavStore.ts'
import type { StudentAssignment, StudentClassroom } from '@/features/classroom/types.ts'

const route = useRoute()
const router = useRouter()
const store = useClassroomStore()
const { classrooms, pending, upcoming, done, preview, isLoading, isLoaded, isSubmitting } = storeToRefs(store)
const headerStore = useHeaderStore()
const navStore = useNavStore()
const { t } = useI18n()

const joinCode = ref((route.params.code as string | undefined)?.toUpperCase() ?? '')
const joinError = ref('')
const isFinding = ref(false)
const showDone = ref(false)

onMounted(async () => {
  headerStore.setTitle(t('classes.title'))
  headerStore.setLeftAction({ icon: BsArrowLeft, onClick: () => router.push('/') })
  headerStore.setRightAction(null)
  navStore.showTabs()

  await store.fetchAll().catch(() => {})
  // Deep-link /join/:code — сразу показываем класс
  if (joinCode.value) await find(joinCode.value)
})

onUnmounted(() => {
  headerStore.reset()
  preview.value = null
})

async function find(code: string) {
  joinError.value = ''
  isFinding.value = true
  try {
    await store.fetchPreview(code)
  } catch (e) {
    joinError.value = assignmentError(e, t('classes.notFound'))
  } finally {
    isFinding.value = false
  }
}

async function join(code: string) {
  try {
    const c = await store.join(code)
    headerStore.showNotification(t('classes.joined', { title: c.title }), 'success', 2500)
    if (route.params.code) router.replace('/classes')
  } catch (e) {
    joinError.value = assignmentError(e, t('classes.notFound'))
  }
}

function resetJoin() {
  joinError.value = ''
  preview.value = null
}

function open(a: StudentAssignment) {
  router.push(`/assignment/${a.id}`)
}

function leave(c: StudentClassroom) {
  Modal.confirm({
    title: t('classes.leave'),
    content: t('classes.leaveConfirm', { title: c.title }),
    okText: t('classes.leave'),
    cancelText: t('common.cancel'),
    okButtonProps: { danger: true },
    async onOk() {
      await store.leave(c.id)
      headerStore.showNotification(t('classes.left'), 'success', 2000)
    },
  })
}
</script>

<template>
  <div class="classes-page">
    <div class="page-body">

      <JoinClassCard :initial-code="joinCode" :preview="preview" :error="joinError"
                     :loading="isFinding || isSubmitting" @find="find" @join="join" @reset="resetJoin" />

      <template v-if="isLoading && !isLoaded">
        <div class="skeleton" v-for="i in 3" :key="i" />
      </template>

      <template v-else-if="classrooms.length">
        <!-- 1. К выполнению -->
        <section class="section">
          <h3 class="section__title">{{ t('classes.pending') }}</h3>
          <AssignmentCard v-for="a in pending" :key="a.id" :assignment="a" @open="open" />
          <p v-if="!pending.length" class="section__empty">{{ t('classes.noPending') }}</p>
        </section>

        <!-- 2. Скоро откроются -->
        <section v-if="upcoming.length" class="section">
          <h3 class="section__title">{{ t('classes.upcoming') }}</h3>
          <AssignmentCard v-for="a in upcoming" :key="a.id" :assignment="a" @open="open" />
        </section>

        <!-- 3. Выполненные -->
        <section v-if="done.length" class="section">
          <button class="section__toggle" type="button" @click="showDone = !showDone">
            {{ showDone ? '▲' : '▼' }} {{ t('classes.done') }} ({{ done.length }})
          </button>
          <template v-if="showDone">
            <AssignmentCard v-for="a in done" :key="a.id" :assignment="a" @open="open" />
          </template>
        </section>

        <!-- 4. Классы -->
        <section class="section">
          <h3 class="section__title">{{ t('classes.title') }}</h3>
          <div v-for="c in classrooms" :key="c.id" class="class">
            <div class="class__avatar">
              <img v-if="c.teacher_avatar_url" :src="c.teacher_avatar_url" alt="" />
              <template v-else>🎓</template>
            </div>
            <div class="class__body">
              <span class="class__title">{{ c.title }}</span>
              <span v-if="c.teacher_name" class="class__meta">{{ t('classes.teacher', { name: c.teacher_name }) }}</span>
            </div>
            <span v-if="c.pending_assignments_count" class="class__badge">{{ c.pending_assignments_count }}</span>
            <button class="class__leave" type="button" :title="t('classes.leave')" @click="leave(c)">✕</button>
          </div>
        </section>
      </template>

      <div v-else class="empty">
        <p class="empty__icon">🏫</p>
        <p class="empty__title">{{ t('classes.empty') }}</p>
        <p class="empty__text">{{ t('classes.emptyHint') }}</p>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.classes-page {
  min-height: 100vh;
  background: transparent;
  display: flex;
  justify-content: center;
}

.page-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 20px;
  padding-top: calc(80px + var(--sat));
  padding-bottom: calc(110px + var(--sab));
  max-width: 720px;
  width: 100%;
  box-sizing: border-box;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  &__title {
    margin: 4px 4px 0;
    font-size: 13px;
    font-weight: 700;
    color: #6B7280;
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  &__empty { margin: 0; font-size: 14px; color: #6B7280; text-align: center; padding: 10px; }

  &__toggle {
    align-self: flex-start;
    background: none;
    border: none;
    padding: 4px;
    color: #6B7280;
    font-family: inherit;
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.6px;
    cursor: pointer;
  }
}

.class {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 18px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);

  &__avatar {
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    background: rgba(78, 190, 194, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    overflow: hidden;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__body { display: flex; flex-direction: column; flex: 1; min-width: 0; }
  &__title { font-size: 15px; font-weight: 700; color: #234970; }
  &__meta { font-size: 12px; color: #6B7280; }

  &__badge {
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 11px;
    background: #EF4444;
    color: #fff;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__leave {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    border: 1px solid rgba(0, 0, 0, 0.08);
    background: #fff;
    color: #9CA3AF;
    cursor: pointer;

    &:active { transform: scale(0.95); }
  }
}

.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  padding: 30px 20px;
  text-align: center;

  &__icon { font-size: 48px; margin: 0; }
  &__title { margin: 0; font-size: 16px; font-weight: 700; color: #234970; }
  &__text { margin: 0; font-size: 14px; color: #6B7280; }
}

.skeleton {
  height: 72px;
  border-radius: 20px;
  background: linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.07) 50%, rgba(0,0,0,0.04) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.4s infinite;
}

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>
