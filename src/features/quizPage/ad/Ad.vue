<script setup lang="ts">
const ad = {
  title: "Популярные",
  description: "Продолжайте играть в Биологии",
  link: "#",
  btnTitle: "Играть"
}
</script>

<template>
  <div class="ad">
        <h1 class="title">{{ad.title}}</h1>
    <p class="desc">{{ad.description}}</p>
    <div class="btn">{{ad.btnTitle}}</div>
  </div>
</template>

<style scoped lang="scss">
.ad {
  display: flex;
  flex-direction: column;
  width: calc(100% - 20px);
  padding: 10px;
  background: linear-gradient(to left,#4EBEC2 0%, #234970 100%);
  color: white;
  border-radius: 20px;

  .title {
    margin: 0;
  }
  .desc {
    margin: 0;
  }
  .btn {
    padding: 5px 20px;
    margin-top: 30px;
    background: #CDAE64;
    width: max-content;
    border-radius: 10cqw;
    font-weight: 600;
    font-size: 1.2rem;
    border-bottom: rgba(246, 246, 246, 0.6) 1px solid;
    border-right: rgba(246, 246, 246, 0.6) 1px solid;
    cursor: pointer;
    user-select: none;
  }
}
</style>