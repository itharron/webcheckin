<script setup lang="ts">
import { ref, watch } from 'vue';

export interface StatItem {
  label: string;
  value: number;
  color: string;
  suffix?: string;
}

const props = defineProps<{
  items: StatItem[];
}>();

const display = ref<number[]>(props.items.map(() => 0));

let rafId = 0;

/** 对每个数字做滚动动画 */
function animateTo(targets: number[], duration = 600): void {
  cancelAnimationFrame(rafId);
  const starts = display.value.slice();
  const startTime = performance.now();

  const step = (now: number) => {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    display.value = targets.map((target, i) =>
      Math.round(starts[i] + (target - starts[i]) * eased)
    );
    if (progress < 1) {
      rafId = requestAnimationFrame(step);
    }
  };
  rafId = requestAnimationFrame(step);
}

watch(
  () => props.items.map((i) => i.value),
  (values) => animateTo(values),
  { immediate: true }
);
</script>

<template>
  <div class="grid grid-cols-3 gap-3 md:gap-4">
    <div
      v-for="(item, idx) in items"
      :key="item.label"
      class="app-card app-card--hover relative overflow-hidden p-4 md:p-5"
    >
      <span class="absolute inset-x-0 top-0 h-1" :style="{ background: item.color }" />
      <p class="text-xs text-text-sub md:text-sm">{{ item.label }}</p>
      <p class="mt-2 text-2xl font-bold tabular-nums md:text-3xl" :style="{ color: item.color }">
        {{ display[idx] }}<span v-if="item.suffix" class="text-sm font-medium">{{ item.suffix }}</span>
      </p>
    </div>
  </div>
</template>