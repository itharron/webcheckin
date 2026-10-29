<script setup lang="ts">
withDefaults(
  defineProps<{
    title?: string;
    description?: string;
  }>(),
  {
    title: '暂无数据',
    description: '',
  }
);
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16 text-center">
    <div
      class="flex h-16 w-16 items-center justify-center rounded-2xl"
      style="background: var(--color-bg); color: var(--color-text-sub)"
    >
      <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="M20 13V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h8m-2-6h8m-8 4h3"
        />
      </svg>
    </div>
    <p class="text-sm font-medium text-text-main">{{ title }}</p>
    <p v-if="description" class="max-w-xs text-xs text-text-sub">{{ description }}</p>
    <slot />
  </div>
</template>