<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'
import { Modal } from 'ant-design-vue'
import { useI18n } from 'vue-i18n'
import CapIcon from '@iconify-vue/solar/square-academic-cap-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-linear'
import ArrowDown from '@iconify-vue/solar/alt-arrow-down-linear'
import LeaveIcon from '@iconify-vue/solar/logout-2-linear'
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
  headerStore.setLeftAction(null)
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
  <div class="classes ui-page">
    <JoinClassCard :initial-code="joinCode" :preview="preview" :error="joinError"
                   :loading="isFinding || isSubmitting" @find="find" @join="join" @reset="resetJoin" />

    <template v-if="isLoading && !isLoaded">
      <div class="ui-skeleton classes__skeleton" v-for="i in 3" :key="i" />
    </template>

    <template v-else-if="classrooms.length">
      <div class="classes__grid">
        <div class="classes__col">
          <!-- 1. К выполнению -->
          <section class="section">
            <div class="ui-section-head">
              <h3 class="ui-section-head__title">{{ t('classes.pending') }}</h3>
              <span v-if="pending.length" class="ui-chip ui-chip--teal">{{ pending.length }}</span>
            </div>
            <AssignmentCard v-for="a in pending" :key="a.id" :assignment="a" @open="open" />
            <div v-if="!pending.length" class="section__empty ui-card">
              <CheckIcon />{{ t('classes.noPending') }}
            </div>
          </section>

          <!-- 2. Скоро откроются -->
          <section v-if="upcoming.length" class="section">
            <div class="ui-section-head">
              <h3 class="ui-section-head__title">{{ t('classes.upcoming') }}</h3>
            </div>
            <AssignmentCard v-for="a in upcoming" :key="a.id" :assignment="a" @open="open" />
          </section>

          <!-- 3. Выполненные -->
          <section v-if="done.length" class="section">
            <button class="ui-section-head section__toggle" type="button" :aria-expanded="showDone" @click="showDone = !showDone">
              <span class="ui-section-head__title">{{ t('classes.done') }} · {{ done.length }}</span>
              <ArrowDown class="section__chevron" :class="{ open: showDone }" />
            </button>
            <template v-if="showDone">
              <AssignmentCard v-for="a in done" :key="a.id" :assignment="a" @open="open" />
            </template>
          </section>
        </div>

        <!-- 4. Классы -->
        <section class="section classes__aside">
          <div class="ui-section-head">
            <h3 class="ui-section-head__title">{{ t('classes.title') }}</h3>
          </div>
          <div class="ui-card ui-card--list">
            <div v-for="c in classrooms" :key="c.id" class="ui-row klass">
              <span class="klass__avatar">
                <img v-if="c.teacher_avatar_url" :src="c.teacher_avatar_url" alt="" />
                <CapIcon v-else />
              </span>
              <span class="klass__body">
                <b class="klass__title">{{ c.title }}</b>
                <span v-if="c.teacher_name" class="klass__meta">{{ t('classes.teacher', { name: c.teacher_name }) }}</span>
              </span>
              <span v-if="c.pending_assignments_count" class="klass__badge">{{ c.pending_assignments_count }}</span>
              <button class="ui-icon-btn klass__leave" type="button" :title="t('classes.leave')" :aria-label="t('classes.leave')" @click="leave(c)">
                <LeaveIcon />
              </button>
            </div>
          </div>
        </section>
      </div>
    </template>

    <div v-else class="ui-empty ui-card">
      <CapIcon class="ui-empty__icon" />
      <p class="ui-empty__title">{{ t('classes.empty') }}</p>
      <p class="ui-empty__text">{{ t('classes.emptyHint') }}</p>
    </div>
  </div>
</template>

<style scoped lang="scss">
.classes {
  &__skeleton { height: 84px; }

  &__grid {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 22px;

    @media (min-width: 1024px) {
      grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
      align-items: start;
    }
  }

  &__col { display: flex; flex-direction: column; gap: 22px; min-width: 0; }
}

.section {
  display: flex;
  flex-direction: column;
  gap: 10px;

  .ui-section-head { align-items: center; }

  &__empty {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 18px;
    font-size: 14px;
    color: var(--c-muted);

    svg { font-size: 20px; color: var(--c-teal-600); }
  }

  &__toggle {
    width: 100%;
    border: none;
    background: none;
    font-family: inherit;
    cursor: pointer;
  }

  &__chevron {
    font-size: 18px;
    color: var(--c-muted);
    transition: transform 0.2s ease;
    &.open { transform: rotate(180deg); }
  }
}

.klass {
  &__avatar {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    flex-shrink: 0;
    border-radius: 50%;
    overflow: hidden;
    background: var(--c-teal-tint);
    color: var(--c-teal-600);
    font-size: 20px;

    img { width: 100%; height: 100%; object-fit: cover; }
  }

  &__body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
  &__title { font-size: 15px; font-weight: 700; color: var(--c-navy-900); }
  &__meta { font-size: 12px; color: var(--c-muted); }

  &__badge {
    min-width: 22px;
    height: 22px;
    padding: 0 7px;
    box-sizing: border-box;
    border-radius: var(--r-pill);
    background: var(--c-wrong);
    color: #FFFFFF;
    font-size: 12px;
    font-weight: 800;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &__leave { width: 34px; height: 34px; font-size: 17px; color: var(--c-muted); background: transparent; }
}
</style>
