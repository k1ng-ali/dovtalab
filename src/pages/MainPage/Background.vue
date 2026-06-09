<script setup lang="ts">
import {useUserStore} from "@/features/user/store.ts";
import {onMounted, computed, ref} from 'vue'

const userStore = useUserStore();

onMounted(() => {
  userStore.fetchProfile()
})


const user   = computed(() => userStore.user)

// Инициалы для фоллбэка аватара
const initials = computed(() => {
  if (!user.value) return '?'
  const f = user.value.first_name?.[0] ?? ''
  const l = user.value.last_name?.[0]  ?? ''
  return (f + l).toUpperCase() || user.value.username?.[0]?.toUpperCase() || '?'
})

const avatarError = ref(false)
</script>

<template>
  <div class="background">
    <div class="header">
      <h1 class="title">Dovtalab <span class="beta">beta</span></h1>
      <img
          v-if="user?.avatar_url && !avatarError"
          :src="user.avatar_url"
          class="avatar"
          alt="avatar"
          @error="avatarError = true"
      />
      <div v-else class="avatar avatar--fallback">
        {{ initials }}
      </div>
    </div>
    <h1 class="welcome">
      С возращением,<br>
      {{userStore.user?.first_name}} 👋
    </h1>
  </div>
</template>

<style scoped lang="scss">
  .background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: #234970;
    z-index: -3;
    color: #F6F6F6;

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("@/assets/Group 22.svg");
      background-repeat: no-repeat;
      background-size: contain;
    }
    &::after {
      content: "";
      position: absolute;
      inset: 0;
      z-index: -2;
    background: radial-gradient(
      circle,
      rgba(0,0,0,0) 60%,
      rgba(0,0,0,0.6) 100%
      )
    }
  }
  .header {
    display: flex;
    align-items: end;
    width: 100%;
    justify-content: space-between;
    padding: 0 20px;
    box-sizing: border-box;
  }
  .title{
    display: flex;
    align-items: end;
    gap: 10px;
    padding-bottom: 0;
    margin-bottom: 0;

    & .beta {
      font-size: 16px;
      font-weight: normal;
      background: rgba(78, 190, 194, 0.5);
      padding: 0 10px;
      border-radius: 7px;
      border: 2px solid rgb(78, 190, 194);
      text-align: center;
      margin-bottom: clamp(5px, 0.4rem, 10px);
    }


  }

  .avatar {
    width: clamp(35px, 1.5rem, 50px);
    height: clamp(35px, 1.5rem, 50px);
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid rgba(255, 255, 255, 1);
    box-shadow: 0 6px 20px rgba(35, 73, 112, 0.18);


    &--fallback {
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #4EBEC2, #234970);
      color: #fff;
      font-size: 30px;
      font-weight: 700;
      letter-spacing: -1px;
    }
  }

  .welcome  {
    margin: 40px 20px 0 20px;
    font-weight: 500;
    text-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }
</style>