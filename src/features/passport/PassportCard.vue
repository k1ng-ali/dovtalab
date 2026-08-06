<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import QRCode from 'qrcode'
import type { UserPassport } from './types'
import logoSvg from '@/assets/logo.svg'

// Встроенная SVG-иконка пользователя (не зависит от внешних библиотек при экспорте)
const USER_ICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
  <circle cx="12" cy="8" r="4" fill="#C8A84B" opacity="0.9"/>
  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" stroke="#C8A84B" stroke-width="1.5" stroke-linecap="round" opacity="0.9"/>
</svg>`

const USER_ICON_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(USER_ICON_SVG)}`

const props = defineProps<{ passport: UserPassport }>()

const qrDataUrl = ref<string>('')

onMounted(async () => {
  const url = `https://dovtalab.app/profile`
  qrDataUrl.value = await QRCode.toDataURL(url, {
    width: 96,
    margin: 1,
    color: { dark: '#1A2E4A', light: '#F5EDD8' },
  })
})

const fullName = computed(() => {
  const parts = [props.passport.first_name, props.passport.last_name].filter(Boolean)
  return parts.join(' ')
})

const rankLabel = computed(() => `#${props.passport.rank.toLocaleString('ru')}`)

const pointsLabel = computed(() =>
  props.passport.total_points.toLocaleString('ru')
)

const percentileLabel = computed(() => {
  if (!props.passport.percentile) return null
  return `Топ ${props.passport.percentile}% пользователей`
})
</script>

<template>
  <div class="passport">

    <!-- ═══ HEADER ═══ -->
    <div class="passport__header">
      <div class="passport__brand">
        <img :src="logoSvg" class="passport__logo" alt="Dovtalab" />
        <div class="passport__brand-text">
          <span class="passport__brand-name">Dovtalab</span>
          <span class="passport__brand-sub">Платформа для подготовки<br>к ММТ и саморазвития</span>
        </div>
      </div>
      <div class="passport__title-block">
        <span class="passport__title">ПАСПОРТ ПОЛЬЗОВАТЕЛЯ</span>
        <span class="passport__display-id">ID: {{ passport.display_id }}</span>
      </div>
    </div>

    <!-- ═══ DIVIDER ═══ -->
    <div class="passport__divider" />

    <!-- ═══ BODY ═══ -->
    <div class="passport__body">

      <!-- LEFT: avatar -->
      <div class="passport__avatar-wrap">
        <img
          v-if="passport.avatar_url"
          :src="passport.avatar_url"
          class="passport__avatar"
          alt="avatar"
        />
        <div v-else class="passport__avatar passport__avatar--fallback">
          <img :src="USER_ICON_URL" class="passport__avatar-icon" alt="user" />
        </div>
        <div v-if="passport.is_pro" class="passport__pro-badge">PRO</div>
      </div>

      <!-- CENTER: info -->
      <div class="passport__info">
        <span class="passport__info-label">ИМЯ В ПЛАТФОРМЕ</span>
        <div class="passport__name-row">
          <span class="passport__name">{{ fullName }}</span>
          <span v-if="passport.is_pro" class="passport__verified">✦</span>
        </div>
        <span v-if="passport.username" class="passport__username">@{{ passport.username }}</span>

        <!-- Stats row -->
        <div class="passport__stats">
          <div class="passport__stat">
            <span class="passport__stat-icon">⭐</span>
            <div class="passport__stat-body">
              <span class="passport__stat-label">БАЛЛЫ</span>
              <span class="passport__stat-value">{{ pointsLabel }}</span>
            </div>
          </div>
          <div class="passport__stat-sep" />
          <div class="passport__stat">
            <span class="passport__stat-icon">🏆</span>
            <div class="passport__stat-body">
              <span class="passport__stat-label">МЕСТО В РЕЙТИНГЕ</span>
              <span class="passport__stat-value">{{ rankLabel }}</span>
              <span v-if="percentileLabel" class="passport__stat-sub">{{ percentileLabel }}</span>
            </div>
          </div>
          <div class="passport__stat-sep" />
          <div class="passport__stat">
            <span class="passport__stat-icon">🔥</span>
            <div class="passport__stat-body">
              <span class="passport__stat-label">СЕРИЯ ДНЕЙ</span>
              <span class="passport__stat-value">{{ passport.streak_days }} дней</span>
            </div>
          </div>
        </div>
      </div>

      <!-- RIGHT: QR -->
      <div class="passport__qr-block">
        <div class="passport__watermark">
          <img :src="logoSvg" class="passport__watermark-img" alt="" />
        </div>
        <img v-if="qrDataUrl" :src="qrDataUrl" class="passport__qr" alt="QR" />
        <span class="passport__qr-label">СКАНИРУЙ И СМОТРИ<br>МОЙ ПРОФИЛЬ</span>
      </div>

    </div>

    <!-- ═══ BADGES ═══ -->
    <div v-if="passport.badges.length" class="passport__badges-section">
      <span class="passport__badges-title">ПОЛУЧЕННЫЕ БЕЙДЖИ</span>
      <div class="passport__badges">
        <div
          v-for="badge in passport.badges"
          :key="badge.type"
          class="passport__badge"
          :class="`passport__badge--${badge.type}`"
        >
          <div class="passport__badge-hex">
            <svg viewBox="0 0 52 60" xmlns="http://www.w3.org/2000/svg" class="passport__badge-svg">
              <polygon points="26,2 50,15 50,45 26,58 2,45 2,15" />
            </svg>
            <span class="passport__badge-emoji">{{ badge.emoji }}</span>
          </div>
          <span class="passport__badge-label">{{ badge.label }}</span>
        </div>
      </div>
    </div>

    <!-- ═══ FOOTER ═══ -->
    <div class="passport__footer">
      <span class="passport__footer-left">DOVTALAB.APP</span>
      <span class="passport__footer-right">УЧИСЬ. ПРАКТИКУЙСЯ. ПОБЕЖДАЙ!</span>
    </div>

  </div>
</template>

<style scoped lang="scss">
/* ── Палитра карточки ── */
$cream:      #F5EDD8;
$cream-dark: #EDE0C4;
$gold:       #C8A84B;
$gold-light: #E8C96A;
$navy:       #1A2E4A;
$navy-light: #2A4060;
$text-muted: #7A6A50;

.passport {
  width: 680px;
  min-height: 360px;
  background: $cream;
  border-radius: 18px;
  border: 2px solid $gold;
  box-shadow:
    0 0 0 6px rgba($gold, 0.15),
    0 12px 48px rgba($navy, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  font-family: 'Inter', sans-serif;
  position: relative;

  /* Тиснёный узор фона */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image:
      radial-gradient(circle, rgba($gold, 0.07) 1px, transparent 1px);
    background-size: 18px 18px;
    pointer-events: none;
  }
}

/* ── Header ── */
.passport__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px 20px 12px;
}

.passport__brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.passport__logo {
  width: 52px;
  height: 38px;   /* соотношение 2687:1944 ≈ 1.38:1 */
  object-fit: contain;
  flex-shrink: 0;
}

.passport__brand-name {
  display: block;
  font-size: 18px;
  font-weight: 800;
  color: $navy;
  line-height: 1.1;
}

.passport__brand-sub {
  display: block;
  font-size: 9px;
  color: $text-muted;
  line-height: 1.4;
  margin-top: 2px;
}

.passport__title-block {
  text-align: right;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.passport__title {
  font-size: 13px;
  font-weight: 800;
  color: $gold;
  letter-spacing: 1.5px;
}

.passport__display-id {
  font-size: 11px;
  font-weight: 600;
  color: $navy;
  background: rgba($gold, 0.15);
  border: 1px solid rgba($gold, 0.4);
  border-radius: 6px;
  padding: 3px 10px;
  letter-spacing: 0.5px;
  text-align: left;
  align-self: flex-start;
}

/* ── Divider ── */
.passport__divider {
  height: 1px;
  background: linear-gradient(90deg, transparent, $gold, transparent);
  margin: 0 20px;
  opacity: 0.6;
}

/* ── Body ── */
.passport__body {
  display: flex;
  gap: 16px;
  padding: 16px 20px;
  flex: 1;
}

/* Avatar */
.passport__avatar-wrap {
  position: relative;
  flex-shrink: 0;
}

.passport__avatar {
  width: 110px;
  height: 130px;
  object-fit: cover;
  border-radius: 10px;
  border: 3px solid $gold;
  box-shadow: 0 4px 16px rgba($navy, 0.3);

  &--fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, $navy-light, $navy);
  }
}

.passport__avatar-icon {
  width: 56px;
  height: 56px;
  object-fit: contain;
}

.passport__pro-badge {
  position: absolute;
  bottom: -6px;
  right: -6px;
  background: linear-gradient(135deg, $gold-light, $gold);
  color: $navy;
  font-size: 9px;
  font-weight: 900;
  padding: 2px 7px;
  border-radius: 10px;
  border: 2px solid $cream;
  letter-spacing: 0.5px;
}

/* Info */
.passport__info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.passport__info-label {
  font-size: 9px;
  font-weight: 700;
  color: $text-muted;
  letter-spacing: 1.5px;
  text-transform: uppercase;
}

.passport__name-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.passport__name {
  font-size: 22px;
  font-weight: 800;
  color: $navy;
  line-height: 1.1;
}

.passport__verified {
  color: $gold;
  font-size: 16px;
}

.passport__username {
  font-size: 12px;
  color: $text-muted;
  font-weight: 500;
}

/* Stats */
.passport__stats {
  display: flex;
  align-items: center;
  gap: 0;
  margin-top: 10px;
  background: rgba($navy, 0.05);
  border: 1px solid rgba($gold, 0.3);
  border-radius: 10px;
  padding: 8px 4px;
}

.passport__stat {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 10px;
}

.passport__stat-sep {
  width: 1px;
  height: 32px;
  background: rgba($gold, 0.4);
}

.passport__stat-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.passport__stat-body {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.passport__stat-label {
  font-size: 8px;
  font-weight: 700;
  color: $text-muted;
  letter-spacing: 0.8px;
}

.passport__stat-value {
  font-size: 16px;
  font-weight: 800;
  color: $navy;
  line-height: 1.1;
}

.passport__stat-sub {
  font-size: 8px;
  color: $text-muted;
  font-weight: 500;
}

/* QR block */
.passport__qr-block {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 120px;
  position: relative;
}

.passport__watermark {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.07;
  pointer-events: none;
}

.passport__watermark-img {
  width: 90px;
  height: 90px;
  object-fit: contain;
}

.passport__qr {
  width: 96px;
  height: 96px;
  border-radius: 8px;
  border: 2px solid $gold;
  margin-top: auto;
  position: relative;
  z-index: 1;
}

.passport__qr-label {
  font-size: 8px;
  font-weight: 700;
  color: $text-muted;
  text-align: center;
  letter-spacing: 0.5px;
  line-height: 1.4;
}

/* ── Badges ── */
.passport__badges-section {
  padding: 0 20px 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.passport__badges-title {
  font-size: 9px;
  font-weight: 700;
  color: $text-muted;
  letter-spacing: 1.5px;
}

.passport__badges {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.passport__badge {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 64px;
}

/* Шестиугольная форма через SVG — clip-path не поддерживается html2canvas */
.passport__badge-hex {
  position: relative;
  width: 52px;
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.passport__badge-svg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  filter: drop-shadow(0 3px 6px rgba($navy, 0.4));

  polygon { fill: #2A4060; }

  .passport__badge--excellent & polygon { fill: #3B5270; }
  .passport__badge--expert &    polygon { fill: #5B3FA0; }
  .passport__badge--marathon &  polygon { fill: #C8502A; }
  .passport__badge--speedster & polygon { fill: #2A6090; }
  .passport__badge--top10 &     polygon { fill: $gold; }
  .passport__badge--top100 &    polygon { fill: #909090; }
  .passport__badge--pro &       polygon { fill: $gold; }
  .passport__badge--beginner &  polygon { fill: #2A8060; }
}

.passport__badge-emoji {
  position: relative;
  z-index: 1;
  font-size: 22px;
  line-height: 1;
}

.passport__badge-label {
  font-size: 9px;
  font-weight: 600;
  color: $text-muted;
  text-align: center;
  line-height: 1.2;
}

/* ── Footer ── */
.passport__footer {
  background: $navy;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 20px;
}

.passport__footer-left,
.passport__footer-right {
  font-size: 10px;
  font-weight: 700;
  color: $gold;
  letter-spacing: 1px;
}
</style>
