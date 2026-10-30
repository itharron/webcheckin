<script setup lang="ts">
import { computed } from 'vue';

const props = withDefaults(
  defineProps<{
    present: number;
    total: number;
  }>(),
  {
    present: 0,
    total: 0,
  }
);

const percentage = computed(() => {
  if (props.total === 0) return 0;
  return Math.round((props.present / props.total) * 100);
});
</script>

<template>
  <div class="app-card p-4 md:p-5">
    <div class="mb-2 flex items-end justify-between">
      <p class="text-sm font-medium text-text-main">签到进度</p>
      <p class="text-sm text-text-sub">
        已签到 <span class="text-lg font-bold text-success">{{ present }}</span>
        <span class="mx-1">/</span>
        <span class="text-text-main">总人数 {{ total }}</span>
      </p>
    </div>
    <el-progress
      :percentage="percentage"
      :stroke-width="12"
      :show-text="false"
      :color="percentage >= 100 ? '#67C23A' : '#409EFF'"
    />
  </div>
</template>