<script setup lang="ts">
import { ref, onMounted } from 'vue'
import BoltIcon from '@iconify-vue/solar/bolt-linear'
import PaletteIcon from '@iconify-vue/solar/pallete-2-linear'
import CheckIcon from '@iconify-vue/solar/check-circle-linear'
import DoneIcon from '@iconify-vue/solar/confetti-minimalistic-linear'
import CloseIcon from '@iconify-vue/solar/close-circle-linear'
import { getPlans, activateSubscription } from './api.ts'
import type { Plan } from './api.ts'
import { useUserStore } from '@/features/user/store.ts'
import { useAuthStore } from '@/features/auth/store.ts'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'activated'): void
}>()

const userStore = useUserStore()
const authStore = useAuthStore()

const plans = ref<Plan[]>([])
const loading = ref(true)
const activating = ref(false)
const success = ref(false)

onMounted(async () => {
  try {
    const { data } = await getPlans()
    plans.value = data.plans
  } catch {
    // fail silently
  } finally {
    loading.value = false
  }
})

async function activate(planId: string) {
  activating.value = true
  try {
    await activateSubscription(planId)
    // Получить новый access token с обновлённым subs
    await authStore.refresh()
    // Обновить профиль
    await userStore.fetchProfile(true)
    success.value = true
    emit('activated')
  } catch (e) {
    console.error(e)
  } finally {
    activating.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="ui-sheet">
      <div v-if="visible" class="ui-sheet-overlay" @click.self="emit('close')">
        <div class="ui-sheet sub" role="dialog" aria-modal="true">
          <div class="ui-sheet__handle" />

          <!-- Успех -->
          <div v-if="success" class="success">
            <span class="success__icon"><DoneIcon /></span>
            <h3 class="success__title">{{ $t('subscription.activated') }}</h3>
            <p class="success__desc">{{ $t('subscription.activatedDesc') }}</p>
            <button type="button" class="ui-btn ui-btn--primary ui-btn--block" @click="emit('close')">{{ $t('subscription.great') }}</button>
          </div>

          <!-- Тарифы -->
          <template v-else>
            <div class="ui-sheet__head">
              <div>
                <h2 class="ui-sheet__title">{{ $t('subscription.choosePlan') }}</h2>
                <p class="sub__desc">{{ $t('subscription.choosePlanDesc') }}</p>
              </div>
              <button type="button" class="ui-icon-btn ui-sheet__close" @click="emit('close')"><CloseIcon /></button>
            </div>

            <div v-if="loading" class="plans">
              <div v-for="i in 2" :key="i" class="ui-skeleton plan-skeleton" />
            </div>

            <div v-else class="plans">
              <div
                v-for="plan in plans"
                :key="plan.id"
                class="plan"
                :class="{ 'plan--off': !plan.available, 'plan--pro': plan.id === 'pro' }"
              >
                <span v-if="plan.discount_percent === 100" class="ui-chip ui-chip--success plan__ribbon">{{ $t('subscription.free') }}</span>
                <span v-else-if="!plan.available" class="ui-chip plan__ribbon">{{ $t('subscription.soon') }}</span>

                <div class="plan__head">
                  <span class="plan__icon">
                    <BoltIcon v-if="plan.id === 'pro'" />
                    <PaletteIcon v-else />
                  </span>
                  <h3 class="plan__name">{{ plan.name }}</h3>
                </div>

                <div class="plan__price">
                  <span v-if="plan.discount_percent === 100" class="plan__amount">{{ $t('subscription.free') }}</span>
                  <template v-else>
                    <span class="plan__amount">{{ plan.price }} TJS</span>
                    <span class="plan__period">/ {{ $t('subscription.month') }}</span>
                  </template>
                  <s v-if="plan.discount_percent === 100" class="plan__original">{{ $t('subscription.perMonth', { n: plan.price }) }}</s>
                </div>

                <ul class="plan__features">
                  <li v-for="(feature, i) in plan.features" :key="i">
                    <CheckIcon />{{ feature }}
                  </li>
                </ul>

                <button
                  v-if="plan.available"
                  type="button"
                  class="ui-btn ui-btn--primary ui-btn--block"
                  :disabled="activating"
                  @click="activate(plan.id)"
                >
                  {{ activating ? $t('subscription.activating') : $t('subscription.activateFree') }}
                </button>
                <button v-else type="button" class="ui-btn ui-btn--secondary ui-btn--block" disabled>
                  {{ $t('subscription.unavailable') }}
                </button>
              </div>
            </div>
          </template>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.sub {
  &__desc { margin: 4px 0 0; font-size: 13px; color: var(--c-muted); line-height: 1.45; }
}

.plans {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  gap: 10px;

  @media (min-width: 640px) { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

.plan-skeleton { height: 260px; }

.plan {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;
  border-radius: var(--r-lg);
  background: rgba(255, 255, 255, 0.8);
  box-shadow: inset 0 0 0 1px var(--c-line-2);

  &--pro { box-shadow: inset 0 0 0 2px var(--c-teal-600); background: rgba(231, 245, 246, 0.7); }
  &--off { opacity: 0.7; }

  &__ribbon { position: absolute; top: 16px; right: 16px; }

  &__head { display: flex; align-items: center; gap: 10px; }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 12px;
    background: var(--grad-primary);
    color: #FFFFFF;
    font-size: 20px;
  }

  &--off &__icon { background: rgba(35, 73, 112, 0.1); color: var(--c-ink-2); }

  &__name { margin: 0; font-size: 18px; font-weight: 800; color: var(--c-navy-900); }

  &__price { display: flex; align-items: baseline; flex-wrap: wrap; gap: 4px 8px; }
  &__amount { font-size: 24px; font-weight: 800; color: var(--c-navy-900); }
  &__period { font-size: 13px; color: var(--c-muted); }
  &__original { font-size: 13px; color: var(--c-muted-2); }

  &__features {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    margin: 0;
    padding: 0;
    list-style: none;

    li {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      font-size: 14px;
      line-height: 1.4;
      color: var(--c-ink);
    }

    svg { flex-shrink: 0; margin-top: 1px; font-size: 17px; color: var(--c-teal-600); }
  }
}

.success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 16px 0 4px;
  text-align: center;

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 76px;
    height: 76px;
    margin-bottom: 4px;
    border-radius: 26px;
    background: var(--grad-primary);
    color: #FFFFFF;
    font-size: 38px;
    box-shadow: var(--shadow-hero);
  }

  &__title { margin: 0; font-size: var(--fs-h2); font-weight: 800; color: var(--c-navy-900); }
  &__desc { margin: 0 0 10px; font-size: 14px; color: var(--c-muted); }
}
</style>
