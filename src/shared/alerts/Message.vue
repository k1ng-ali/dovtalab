<script setup lang="ts">
import {useMessage} from "@/shared/alerts/useMessage.ts";

const messageStore = useMessage();

</script>

<template>
  <a-space>
    <a-button @click="messageStore.success">Success</a-button>
    <a-button @click="messageStore.error">Error</a-button>
    <a-button @click="messageStore.warning">Warning</a-button>
  </a-space>
</template>

<style scoped lang="scss">

</style>