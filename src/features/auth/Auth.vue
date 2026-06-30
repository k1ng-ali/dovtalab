<script setup lang="ts">
import TelegramLoginButton from "@/features/auth/TelegramLoginButton.vue";
import { useRouter } from 'vue-router'
import {onMounted, reactive, ref} from "vue";
import type {SuperUser} from "./types.ts"
import {useAuthStore} from "@/features/auth/store.ts";
import { message } from 'ant-design-vue'
import {Capacitor, SystemBars, SystemBarsStyle} from "@capacitor/core";

const router = useRouter()
const access_state = ref<boolean>(false)
const authStore = useAuthStore()

async function onSuccess() {
  await router.push('/')
}

const formState = reactive<SuperUser>({
  access_code: ''
})

const redirect = (url:string) => {
  window.open(url, '_blank')
}

const togle_access = () => {
  access_state.value = !access_state.value
}

const accessLogin = async () => {
  if (formState.access_code === '') {return}
  try {
    await authStore.accessPass(formState)

    message.success('Успешная авторизация')
    await router.push('/')
  } catch (error: any) {
    const errorMessage = error.response?.data?.detail || 'Неверный код доступа'
    message.error(errorMessage)
    formState.access_code = ''
  }
}

onMounted(async () =>{
  if (Capacitor.isNativePlatform()) {
    try {
      await SystemBars.setStyle({ style: SystemBarsStyle.Light})
    } catch (e) {
      console.error(e)
    }
  }
})

</script>

<template>
  <div class="auth">
    <div class="auth__card" v-if="!access_state">
      <h2>Добро пажаловать в <span>Dovtalab</span></h2>
      <h3 class="auth__title">Войдите в аккаунт</h3>
      <p class="auth__desc">Используйте Telegram для быстрой и безопасной авторизации</p>
      <div>
        <a class="policy" href="https://privacy.dovtalab.app/" target="_blank">Политика конфиденциальности</a>
        <span class="auth-code" @click="togle_access">• код доступа</span>
      </div>
      <TelegramLoginButton class="btn-redirect blue" @success="onSuccess" />
      <button class="btn-redirect"
              @click="redirect('https://t.me/Dovtalabbot/dovtalab_app')"
      >Открыть в mini-apps</button>
    </div>
    <div class="auth__card" v-else>
      <h2>Вход по коду доступа</h2>
      <a-form
        layout="vertical"
        :model="formState"
        class="auth__form"
      >
        <a-form-item>
          <a-input
              v-model:value="formState.access_code"
            placeholder="Код доступа"
            class="auth__input"
          >
            <template #prefix>
              <UserOutlined style="color: rgba(0, 0, 0, 0.25)" />
            </template>
          </a-input>
        </a-form-item>
        <div class="auth__btns">
          <a-form-item >
            <a-button
              type="primary"
              @click="togle_access"
            >
              Назад
            </a-button>
          </a-form-item>
          <a-form-item >
            <a-button
                type="primary"
                html-type="submit"
                :disabled="formState.access_code === ''"
                @click="accessLogin"
            >
              Войти
            </a-button>
          </a-form-item>
        </div>
      </a-form>
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
    align-items: center;
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
    margin-bottom: 0;
  }

  &__form {
    display: flex;
    flex-direction: column;
    width: 100%;
    box-sizing: border-box;
    gap:10px;
  }

  &__input{
    width: 100%;
    box-sizing: border-box;
  }

  &__btns {
    display: flex;
    gap: 10px;
  }

  .policy {
    text-decoration: none;
    margin-bottom: 10px;
    color: #708ebc;
  }

  .auth-code {
    color: #708ebc;
    margin-left: 20px;
    cursor: pointer;
  }

  .btn-redirect {
    background: #4ade80;
    width: 100%;
    height: 50px;
    border-radius: 10px;
    margin-top: 10px;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 2px 8px rgba(42, 171, 238, 0.35);
    border: none;
    cursor: pointer;
    overflow: hidden;
    user-select: none;
    transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
    box-sizing: border-box;

    &.blue {
      background: #0e82be;
    }

    &:hover{
      background: #45ca76;
    }
  }
}
</style>