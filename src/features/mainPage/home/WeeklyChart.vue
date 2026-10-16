<script setup lang="ts">
// Недельная активность: столбики «верно/неверно» с осью и подписями.
// Пара бирюза/оранжевый различима при дальтонизме; у каждого дня есть подсказка.
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  correct: number[]     // 7 значений, от 6 дней назад до сегодня
  incorrect: number[]
}>()

const { t } = useI18n()

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const

const days = computed(() => {
  const out = []
  for (let i = 0; i < 7; i++) {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const dow = d.getDay()
    const label = t(`stats.weekDays.${DAY_KEYS[dow === 0 ? 6 : dow - 1]}`)
    out.push({ label, correct: props.correct[i] ?? 0, wrong: props.incorrect[i] ?? 0, today: i === 6 })
  }
  return out
})

const totalCorrect = computed(() => days.value.reduce((s, d) => s + d.correct, 0))
const total = computed(() => days.value.reduce((s, d) => s + d.correct + d.wrong, 0))
const accuracy = computed(() => (total.value ? Math.round((totalCorrect.value / total.value) * 100) : 0))

// «Красивый» максимум оси: 5, 10, 20, 50, 100…
const axisMax = computed(() => {
  const max = Math.max(...days.value.map(d => d.correct + d.wrong), 1)
  const steps = [5, 10, 20, 30, 50, 100, 200, 500, 1000]
  return steps.find(s => s >= max) ?? Math.ceil(max / 1000) * 1000
})

const pct = (n: number) => `${(n / axisMax.value) * 100}%`
</script>

<template>
  <section class="chart-card ui-card" :aria-label="t('stats.weeklyActivity')">
    <div class="chart-card__head">
      <b class="chart-card__title">{{ t('home.week') }}</b>
      <span class="chart-card__summary">
        {{ total ? t('home.weekSummary', { n: total, p: accuracy }) : t('home.weekEmpty') }}
      </span>
    </div>

    <div class="legend">
      <span><i class="legend__dot legend__dot--correct" />{{ t('home.correct') }}</span>
      <span><i class="legend__dot legend__dot--wrong" />{{ t('home.wrong') }}</span>
    </div>

    <div class="plot" role="img" :aria-label="t('stats.weeklyActivity')">
      <div class="axis" aria-hidden="true">
        <span>{{ axisMax }}</span><span>{{ axisMax / 2 }}</span><span>0</span>
      </div>
      <div class="area">
        <div class="grid" aria-hidden="true"><i /><i /></div>
        <div class="bars">
          <div v-for="d in days" :key="d.label + d.today" class="bar"
               :title="`${d.label}: ${t('home.correct')} ${d.correct}, ${t('home.wrong')} ${d.wrong}`">
            <template v-if="d.correct + d.wrong > 0">
              <span v-if="d.wrong" class="bar__wrong" :style="{ height: pct(d.wrong) }" />
              <span v-if="d.correct" class="bar__correct" :class="{ 'bar__correct--top': !d.wrong }" :style="{ height: pct(d.correct) }" />
            </template>
            <span v-else class="bar__zero" />
          </div>
        </div>
        <div class="labels">
          <span v-for="d in days" :key="'l' + d.label + d.today" :class="{ today: d.today }">{{ d.label }}</span>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped lang="scss">
.chart-card {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 18px;

  &__head { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
  &__title { font-size: 16px; color: var(--c-navy-900); }
  &__summary { font-size: 13px; color: var(--c-muted); text-align: right; }

  @media (min-width: 1024px) {
    padding: 24px 26px;
    &__title { font-size: 18px; }
  }
}

.legend {
  display: flex;
  gap: 14px;
  font-size: 12px;
  color: var(--c-ink-2);

  span { display: inline-flex; align-items: center; gap: 6px; }

  &__dot {
    width: 10px;
    height: 10px;
    border-radius: 3px;

    &--correct { background: var(--c-correct); }
    &--wrong { background: var(--c-wrong); }
  }
}

.plot {
  display: flex;
  gap: 8px;
  --plot-h: 120px;

  @media (min-width: 1024px) { --plot-h: 180px; }
}

.axis {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  width: 26px;
  height: var(--plot-h);
  font-size: 11px;
  color: var(--c-muted);
  text-align: right;
  line-height: 1;
}

.area {
  position: relative;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.grid {
  position: absolute;
  inset: 0 0 auto 0;
  height: var(--plot-h);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  pointer-events: none;

  i { display: block; border-top: 1px dashed var(--c-line); }
}

.bars {
  height: var(--plot-h);
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  align-items: end;
  border-bottom: 1px solid var(--c-line-2);

  @media (min-width: 1024px) { gap: 28px; }
}

.bar {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  cursor: default;

  &__wrong { background: var(--c-wrong); border-radius: 6px 6px 0 0; margin-bottom: 2px; }
  &__correct { background: var(--c-correct); }
  &__correct--top { border-radius: 6px 6px 0 0; }
  &__zero { height: 2px; background: var(--c-line-2); }

  &:hover span { filter: brightness(1.1); }
}

.labels {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 10px;
  font-size: 11px;
  color: var(--c-muted);
  text-align: center;

  .today { color: var(--c-navy-900); font-weight: 800; }

  @media (min-width: 1024px) { gap: 28px; font-size: 12px; }
}
</style>
