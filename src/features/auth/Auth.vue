<script setup lang="ts">
import TelegramLoginButton from "@/features/auth/TelegramLoginButton.vue";
import { useRouter } from 'vue-router'
import { useAuthStore } from './store'

const router = useRouter()
const authStore = useAuthStore()

async function onSuccess() {
  await router.push('/')
}
</script>

<template>
  <div class="auth">
    <div class="auth__card">
      <h2>Добро пажаловать в <span>Dovtalab</span></h2>
      <h3 class="auth__title">Войдите в аккаунт</h3>
      <p class="auth__desc">Используйте Telegram для быстрой и безопасной авторизации</p>
      <TelegramLoginButton @success="onSuccess" />
    </div>
  </div>
</template>

<style scoped lang="scss">
.auth {
  display: flex;
  position: fixed;
  background: #F6F6F6;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;

  &__card {
    display: flex;
    flex-direction: column;
    background: white;
    padding: 20px;
    border-radius: 20px;
    margin: 0 20px;
    box-shadow:
        0 8px 25px rgba(0, 0, 0, 0.12),
        0 2px 6px rgba(0, 0, 0, 0.06);

    & span {
      color: #234970;
    }
  }
  &__desc {
    color: #4F4F4F;
  }
}

</style>