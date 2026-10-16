<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watchEffect } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { CONTACT_EMAIL, POLICY } from '@/features/privacy/content.ts'
import type { AppLocale } from '@/shared/i18n'
import LangSwitch from '@/shared/components/LangSwitch.vue'
import logoSvg from '@/assets/logo.svg'
import ShieldIcon from '@iconify-vue/solar/shield-check-linear'
import DocIcon from '@iconify-vue/solar/document-text-linear'
import FolderIcon from '@iconify-vue/solar/folder-linear'
import TargetIcon from '@iconify-vue/solar/target-linear'
import UsersIcon from '@iconify-vue/solar/users-group-rounded-linear'
import PhoneIcon from '@iconify-vue/solar/smartphone-linear'
import ShareIcon from '@iconify-vue/solar/hand-shake-linear'
import HourglassIcon from '@iconify-vue/solar/hourglass-linear'
import LockIcon from '@iconify-vue/solar/lock-keyhole-linear'
import ScaleIcon from '@iconify-vue/solar/scale-linear'
import ChildIcon from '@iconify-vue/solar/user-heart-linear'
import RefreshIcon from '@iconify-vue/solar/refresh-linear'
import MailIcon from '@iconify-vue/solar/letter-linear'
import type { Component } from 'vue'

// Иконка раздела по его id (эмодзи из content.ts не используем)
const SECTION_ICONS: Record<string, Component> = {
  general: DocIcon, collect: FolderIcon, purpose: TargetIcon, public: UsersIcon,
  device: PhoneIcon, share: ShareIcon, retention: HourglassIcon, security: LockIcon,
  rights: ScaleIcon, children: ChildIcon, changes: RefreshIcon, contacts: MailIcon,
}

const router = useRouter()
const { locale } = useI18n()

const policy = computed(() => POLICY[locale.value as AppLocale] ?? POLICY.ru)

// ── Навигация ──
function goBack() {
  // Если пришли из приложения — возвращаемся, иначе (прямая ссылка) — на главную
  if (window.history.state?.back) router.back()
  else router.push('/')
}

function scrollToSection(id: string) {
  document.getElementById(`policy-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Заголовок вкладки следует за языком
watchEffect(() => { document.title = `${policy.value.title} — Dovtalab` })

// ── Кнопка «Наверх» + тень у шапки ──
const isScrolled = ref(false)
const showToTop = ref(false)

function onScroll() {
  isScrolled.value = window.scrollY > 8
  showToTop.value = window.scrollY > 600
}

onMounted(() => {
  window.scrollTo(0, 0)
  window.addEventListener('scroll', onScroll, { passive: true })
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  document.title = 'Dovtalab'
})
</script>

<template>
  <div class="privacy">
    <div class="privacy__bg" aria-hidden="true">
      <span class="blob blob--teal" />
      <span class="blob blob--navy" />
    </div>

    <!-- 1. Шапка -->
    <header class="topbar" :class="{ 'topbar--scrolled': isScrolled }">
      <button class="topbar__back" type="button" :aria-label="$t('common.back')" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <div class="topbar__brand">
        <img :src="logoSvg" alt="" class="topbar__logo" />
        <span>Dovtalab</span>
      </div>
      <LangSwitch />
    </header>

    <main class="privacy__content">
      <!-- 2. Hero -->
      <section class="hero">
        <div class="hero__icon"><ShieldIcon /></div>
        <h1 class="hero__title">{{ policy.title }}</h1>
        <span class="hero__date">{{ policy.updatedLabel }} {{ policy.updatedAt }}</span>
        <p class="hero__intro">{{ policy.intro }}</p>
      </section>

      <!-- 3. Содержание -->
      <nav class="toc">
        <h2 class="toc__title">{{ policy.tocTitle }}</h2>
        <div class="toc__list">
          <button
              v-for="(s, i) in policy.sections"
              :key="s.id"
              type="button"
              class="toc__item"
              @click="scrollToSection(s.id)"
          >
            <span class="toc__num">{{ i + 1 }}</span>
            <span class="toc__text">{{ s.title }}</span>
          </button>
        </div>
      </nav>

      <!-- 4. Разделы -->
      <article
          v-for="(s, i) in policy.sections"
          :id="`policy-${s.id}`"
          :key="s.id"
          class="section"
      >
        <div class="section__head">
          <span class="section__icon"><component :is="SECTION_ICONS[s.id] ?? DocIcon" /></span>
          <div>
            <span class="section__num">{{ String(i + 1).padStart(2, '0') }}</span>
            <h2 class="section__title">{{ s.title }}</h2>
          </div>
        </div>
        <p v-for="(p, pi) in s.paragraphs" :key="pi" class="section__text">{{ p }}</p>
        <ul v-if="s.items" class="section__list">
          <li v-for="(item, ii) in s.items" :key="ii">{{ item }}</li>
        </ul>
        <p v-if="s.note" class="section__note">{{ s.note }}</p>
        <a v-if="s.id === 'contacts'" class="section__mail" :href="`mailto:${CONTACT_EMAIL}`">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="3" />
            <polyline points="22 6 12 13 2 6" />
          </svg>
          {{ CONTACT_EMAIL }}
        </a>
      </article>

      <!-- 5. Футер -->
      <footer class="footer">
        <img :src="logoSvg" alt="" class="footer__logo" />
        <span>© {{ new Date().getFullYear() }} Dovtalab</span>
      </footer>
    </main>

    <Transition name="fade">
      <button v-if="showToTop" class="to-top" type="button" :aria-label="$t('privacy.toTop')" @click="scrollToTop">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>
    </Transition>
  </div>
</template>

<style scoped lang="scss">
.privacy {
  position: relative;
  min-height: 100vh;
  background-color: var(--c-ground);
  background-image: var(--grad-ground);
  color: var(--c-ink);

  /* ── Фоновые пятна ── */
  &__bg {
    position: fixed;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  &__content {
    position: relative;
    max-width: var(--content-max, 860px);
    margin: 0 auto;
    padding: 16px 16px calc(40px + var(--sab, 0px));
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
}

.blob {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;

  &--teal {
    width: 320px;
    height: 320px;
    top: -80px;
    right: -100px;
    background: #4EBEC2;
  }

  &--navy {
    width: 280px;
    height: 280px;
    bottom: -60px;
    left: -120px;
    background: var(--c-navy-900);
    opacity: 0.18;
  }
}

/* ── Topbar ──────────────────────────────────── */
.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: calc(10px + var(--sat, 0px)) 16px 10px;
  background: transparent;
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  transition: box-shadow 0.2s ease, background 0.2s ease;

  &--scrolled {
    background: rgba(255, 255, 255, 0.82);
    box-shadow: 0 4px 20px rgba(35, 73, 112, 0.08);
  }

  &__back {
    width: 40px;
    height: 40px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border: 1px solid rgba(255, 255, 255, 0.9);
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.85);
    color: var(--c-navy-900);
    cursor: pointer;
    box-shadow: 0 2px 10px rgba(35, 73, 112, 0.08);
    transition: all 0.2s ease;

    svg { width: 20px; height: 20px; }
    &:active { transform: scale(0.94); }
  }

  &__brand {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 700;
    font-size: 17px;
    color: var(--c-navy-900);
    min-width: 0;
  }

  &__logo {
    width: 26px;
    height: 26px;
  }
}

/* ── Hero ────────────────────────────────────── */
.hero {
  position: relative;
  overflow: hidden;
  padding: 28px 22px 24px;
  border-radius: 24px;
  background: var(--grad-primary);
  color: #fff;
  box-shadow: 0 12px 32px rgba(35, 73, 112, 0.25);

  &::after {
    content: '';
    position: absolute;
    width: 220px;
    height: 220px;
    right: -70px;
    top: -90px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.12);
  }

  &__icon {
    width: 52px;
    height: 52px;
    display: grid;
    place-items: center;
    font-size: 26px;
    border-radius: 16px;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.3);
    margin-bottom: 14px;
  }

  &__title {
    margin: 0 0 8px;
    font-size: clamp(24px, 6vw, 32px);
    line-height: 1.2;
    font-weight: 800;
  }

  &__date {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 30px;
    background: rgba(255, 255, 255, 0.18);
    font-size: 12px;
    font-weight: 600;
  }

  &__intro {
    position: relative;
    z-index: 1;
    margin: 16px 0 0;
    font-size: 15px;
    line-height: 1.65;
    color: rgba(255, 255, 255, 0.92);
  }
}

/* ── Glass card (общая база) ─────────────────── */
%glass {
  background: var(--glass-bg);
  backdrop-filter: var(--glass-blur);
  -webkit-backdrop-filter: var(--glass-blur);
  border: var(--glass-border);
  border-radius: var(--r-lg);
  box-shadow: var(--shadow-card);
}

/* ── TOC ─────────────────────────────────────── */
.toc {
  @extend %glass;
  padding: 18px 16px;

  &__title {
    margin: 0 0 12px;
    font-size: 15px;
    font-weight: 700;
    color: var(--c-navy-900);
  }

  &__list {
    display: grid;
    grid-template-columns: 1fr;
    gap: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 9px 10px;
    border: none;
    border-radius: 12px;
    background: transparent;
    font-family: inherit;
    font-size: 14px;
    color: var(--c-ink);
    text-align: left;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover { background: rgba(78, 190, 194, 0.1); }
    &:active { transform: scale(0.98); }
  }

  &__num {
    width: 24px;
    height: 24px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    border-radius: 8px;
    background: rgba(78, 190, 194, 0.15);
    color: var(--c-navy-900);
    font-size: 12px;
    font-weight: 700;
  }
}

/* ── Section ─────────────────────────────────── */
.section {
  @extend %glass;
  padding: 20px 18px;
  scroll-margin-top: calc(76px + var(--sat, 0px));

  &__head {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  &__icon {
    width: 44px;
    height: 44px;
    display: grid;
    place-items: center;
    flex-shrink: 0;
    font-size: 22px;
    border-radius: 14px;
    background: var(--c-teal-tint);
    color: var(--c-teal-600);
  }

  &__num {
    display: block;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 1px;
    color: var(--c-teal-600);
  }

  &__title {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    line-height: 1.3;
    color: var(--c-navy-900);
  }

  &__text {
    margin: 0 0 10px;
    font-size: 15px;
    line-height: 1.7;
    color: var(--c-ink-2);

    &:last-child { margin-bottom: 0; }
  }

  &__note {
    margin: 14px 0 0;
    padding: 12px 14px;
    border-radius: 14px;
    background: rgba(78, 190, 194, 0.1);
    border-left: 3px solid var(--c-teal-600);
    font-size: 14px;
    line-height: 1.6;
    color: var(--c-navy-900);
  }

  &__mail {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    margin-top: 14px;
    padding: 11px 20px;
    border-radius: 30px;
    background: var(--grad-primary);
    color: #fff;
    font-size: 15px;
    font-weight: 600;
    text-decoration: none;
    word-break: break-all;
    box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);
    transition: all 0.2s ease;

    svg { width: 18px; height: 18px; flex-shrink: 0; }
    &:active { transform: scale(0.97); }
  }

  &__list {
    list-style: none;
    margin: 0 0 10px;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;

    &:last-child { margin-bottom: 0; }

    li {
      position: relative;
      padding-left: 22px;
      font-size: 15px;
      line-height: 1.65;
      color: var(--c-ink-2);

      &::before {
        content: '';
        position: absolute;
        left: 4px;
        top: 9px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--grad-primary);
      }
    }
  }
}

/* ── Footer ──────────────────────────────────── */
.footer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px 0 0;
  font-size: 13px;
  color: var(--c-muted-2);

  &__logo {
    width: 20px;
    height: 20px;
    opacity: 0.6;
  }
}

/* ── To top ──────────────────────────────────── */
.to-top {
  position: fixed;
  right: 16px;
  bottom: calc(20px + var(--sab, 0px));
  z-index: 10;
  width: 46px;
  height: 46px;
  display: grid;
  place-items: center;
  border: none;
  border-radius: 50%;
  background: var(--grad-primary);
  color: #fff;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(78, 190, 194, 0.35);
  transition: all 0.2s ease;

  svg { width: 22px; height: 22px; }
  &:active { transform: scale(0.94); }
}

.fade-enter-active,
.fade-leave-active { transition: opacity 0.25s ease, transform 0.25s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; transform: translateY(10px); }

/* ── Desktop ─────────────────────────────────── */
@media (min-width: 768px) {
  .privacy__content {
    padding-top: 24px;
    gap: 20px;
  }

  .topbar {
    padding-left: max(16px, calc((100% - var(--content-max, 860px)) / 2 + 16px));
    padding-right: max(16px, calc((100% - var(--content-max, 860px)) / 2 + 16px));
  }

  .hero {
    padding: 40px 36px 32px;
  }

  .toc__list {
    grid-template-columns: 1fr 1fr;
  }

  .section {
    padding: 26px 28px;
  }
}
</style>
