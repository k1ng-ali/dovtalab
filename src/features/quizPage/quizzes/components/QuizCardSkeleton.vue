<template>
  <div class="skeleton-card">
    <div class="skeleton-icon" />
    <div class="skeleton-content">
      <div class="skeleton-line skeleton-title" />
      <div class="skeleton-line skeleton-desc" />
      <div class="skeleton-line skeleton-desc short" />
      <div class="skeleton-badges">
        <div class="skeleton-badge" />
        <div class="skeleton-badge" />
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@keyframes shimmer {
  0%   { background-position: -400px 0; }
  100% { background-position: 400px 0; }
}

$shimmer: linear-gradient(
  90deg,
  rgba(0, 0, 0, 0.06) 25%,
  rgba(0, 0, 0, 0.10) 50%,
  rgba(0, 0, 0, 0.06) 75%
);

.skeleton-card {
  display: flex;
  gap: 14px;
  padding: 16px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.07);
}

.skeleton-icon {
  flex-shrink: 0;
  width: 52px;
  height: 52px;
  border-radius: 16px;
  background: $shimmer;
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
}

.skeleton-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.skeleton-line {
  border-radius: 6px;
  background: $shimmer;
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;
}

.skeleton-title {
  height: 16px;
  width: 70%;
  animation-delay: 0.05s;
}

.skeleton-desc {
  height: 12px;
  width: 90%;
  animation-delay: 0.1s;

  &.short {
    width: 55%;
    animation-delay: 0.15s;
  }
}

.skeleton-badges {
  display: flex;
  gap: 6px;
  margin-top: 2px;
}

.skeleton-badge {
  height: 18px;
  width: 60px;
  border-radius: 20px;
  background: $shimmer;
  background-size: 800px 100%;
  animation: shimmer 1.5s infinite linear;

  &:nth-child(2) {
    width: 72px;
    animation-delay: 0.1s;
  }
}
</style>
