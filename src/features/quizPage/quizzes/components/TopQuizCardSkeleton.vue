<template>
  <div class="top-card-skeleton">
    <div class="skeleton-line medal" />
    <div class="skeleton-line title" />
    <div class="skeleton-line desc" />
    <div class="skeleton-line meta" />
  </div>
</template>

<style scoped lang="scss">
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

$shimmer: linear-gradient(
  90deg,
  rgba(255, 255, 255, 0.05) 25%,
  rgba(255, 255, 255, 0.12) 50%,
  rgba(255, 255, 255, 0.05) 75%
);

.top-card-skeleton {
  flex-shrink: 0;
  width: 200px;
  min-height: 140px;
  border-radius: 20px;
  padding: 16px;
  background: linear-gradient(135deg, #b0bec5, #78909c);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skeleton-line {
  border-radius: 6px;
  background: $shimmer;
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
}

.medal {
  width: 28px;
  height: 22px;
}

.title {
  width: 80%;
  height: 14px;
}

.desc {
  width: 100%;
  height: 10px;
  flex: 1;
}

.meta {
  width: 60px;
  height: 16px;
  border-radius: 10px;
}
</style>
