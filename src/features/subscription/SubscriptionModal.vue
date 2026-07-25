<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPlans, activateSubscription } from './api.ts'
import type { Plan } from './api.ts'
import { useUserStore } from '@/features/user/store.ts'
import { useAuthStore } from '@/features/auth/store.ts'

const props = defineProps<{
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
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click.self="emit('close')">
        <div class="modal-sheet">
          <!-- Handle -->
          <div class="sheet-handle" />

          <!-- Success state -->
          <div v-if="success" class="success-state">
            <span class="success-icon">🎉</span>
            <h3 class="success-title">Подписка активирована!</h3>
            <p class="success-desc">Теперь вам доступны все Pro-возможности</p>
            <button class="btn-primary" @click="emit('close')">Отлично</button>
          </div>

          <!-- Plans -->
          <div v-else class="plans-content">
            <h2 class="plans-title">Выберите план</h2>
            <p class="plans-subtitle">Разблокируйте продвинутые функции обучения</p>

            <div class="plans-list">
              <div
                v-for="plan in plans"
                :key="plan.id"
                class="plan-card"
                :class="{ unavailable: !plan.available, pro: plan.id === 'pro', creator: plan.id === 'creator' }"
              >
                <!-- Ribbon -->
                <div v-if="plan.discount_percent === 100" class="plan-ribbon">Бесплатно</div>
                <div v-else-if="!plan.available" class="plan-ribbon soon">Скоро</div>

                <div class="plan-header">
                  <span class="plan-icon">{{ plan.id === 'pro' ? '⚡' : '🎨' }}</span>
                  <h3 class="plan-name">{{ plan.name }}</h3>
                </div>

                <!-- Price -->
                <div class="plan-price">
                  <span v-if="plan.discount_percent === 100" class="price-free">Бесплатно</span>
                  <template v-else>
                    <span class="price-amount">{{ plan.price }} TJS</span>
                    <span class="price-period">/ месяц</span>
                  </template>
                  <span v-if="plan.discount_percent === 100" class="price-original">
                    <s>{{ plan.price }} TJS/мес</s>
                  </span>
                </div>

                <!-- Features -->
                <ul class="plan-features">
                  <li v-for="(feature, i) in plan.features" :key="i" class="plan-feature">
                    <span class="feature-check">✓</span>
                    {{ feature }}
                  </li>
                </ul>

                <!-- Action -->
                <button
                  v-if="plan.available"
                  class="btn-activate"
                  :class="{ loading: activating }"
                  :disabled="activating"
                  @click="activate(plan.id)"
                >
                  {{ activating ? 'Оформление...' : 'Оформить бесплатно' }}
                </button>
                <button v-else class="btn-unavailable" disabled>
                  Временно недоступен
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-sheet {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: #fff;
  border-radius: 28px 28px 0 0;
  padding: 16px 24px 32px;
  box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.15);

  @media (min-width: 768px) {
    border-radius: 28px;
    margin-bottom: auto;
    margin-top: auto;
  }
}

.sheet-handle {
  width: 40px;
  height: 4px;
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  margin: 0 auto 20px;
}

/* ── Plans ── */
.plans-content {
  text-align: center;
}

.plans-title {
  margin: 0 0 4px;
  color: #234970;
  font-size: 20px;
}

.plans-subtitle {
  margin: 0 0 20px;
  color: #6B7280;
  font-size: 14px;
}

.plans-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.plan-card {
  position: relative;
  text-align: left;
  padding: 20px;
  border: 2px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  transition: all 0.2s;

  &.pro {
    border-color: rgba(124, 58, 237, 0.3);
    background: rgba(124, 58, 237, 0.03);
  }

  &.creator {
    border-color: rgba(0, 0, 0, 0.06);
  }

  &.unavailable {
    opacity: 0.7;
  }
}

.plan-ribbon {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  background: linear-gradient(135deg, #10B981, #059669);
  color: #fff;

  &.soon {
    background: rgba(0, 0, 0, 0.08);
    color: #6B7280;
  }
}

.plan-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.plan-icon {
  font-size: 24px;
}

.plan-name {
  margin: 0;
  font-size: 18px;
  color: #234970;
}

.plan-price {
  display: flex;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 14px;
}

.price-free {
  font-size: 22px;
  font-weight: 800;
  color: #10B981;
}

.price-original {
  font-size: 13px;
  color: #9CA3AF;
}

.price-amount {
  font-size: 22px;
  font-weight: 800;
  color: #234970;
}

.price-period {
  font-size: 13px;
  color: #6B7280;
}

.plan-features {
  list-style: none;
  padding: 0;
  margin: 0 0 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.plan-feature {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #4B5563;
}

.feature-check {
  color: #10B981;
  font-weight: 700;
}

.btn-activate {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #7C3AED, #4F46E5);
  color: #fff;
  font-size: 15px;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: all 0.2s;

  &:active { transform: scale(0.98); }
  &:disabled { opacity: 0.6; cursor: not-allowed; }
}

.btn-unavailable {
  width: 100%;
  padding: 14px;
  border: 1.5px solid rgba(0, 0, 0, 0.1);
  border-radius: 14px;
  background: transparent;
  color: #9CA3AF;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: not-allowed;
}

/* ── Success ── */
.success-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 20px 0;
  text-align: center;
}

.success-icon { font-size: 48px; }
.success-title { margin: 0; color: #234970; }
.success-desc { margin: 0; color: #6B7280; font-size: 14px; }

.btn-primary {
  margin-top: 12px;
  padding: 12px 32px;
  border: none;
  border-radius: 14px;
  background: linear-gradient(135deg, #4EBEC2, #234970);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;

  &:active { transform: scale(0.97); }
}

/* ── Transition ── */
.modal-enter-active,
.modal-leave-active {
  transition: all 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;

  .modal-sheet {
    transform: translateY(100%);
  }
}

.modal-enter-active .modal-sheet,
.modal-leave-active .modal-sheet {
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
