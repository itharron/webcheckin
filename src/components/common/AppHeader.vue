<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue';

defineProps<{
  title?: string;
}>();
</script>

<template>
  <header
    class="flex items-center justify-between px-5 py-3 md:px-8 md:py-4"
    style="background: var(--color-card); border-bottom: 1px solid var(--color-border)"
  >
    <div class="flex items-center gap-3">
      <div
        class="flex h-9 w-9 items-center justify-center rounded-xl text-white"
        style="background: var(--color-primary)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18">
          <circle cx="12" cy="6.4" r="2.6" fill="currentColor" />
          <path
            d="M5.6 13.8 L10 18 L18.4 9.4"
            fill="none"
            stroke="currentColor"
            stroke-width="2.6"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <div>
        <h1 class="text-base font-semibold leading-tight text-text-main md:text-lg">
          {{ title || '点名签到系统' }}
        </h1>
      </div>
    </div>
    <slot name="actions">
      <ThemeToggle />
    </slot>
  </header>
</template>