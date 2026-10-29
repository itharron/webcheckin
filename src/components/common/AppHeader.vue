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
        style="background: linear-gradient(135deg, #4f46e5, #818cf8)"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path
            d="M12 3a3 3 0 0 0-3 3v2h-2a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2h-2V6a3 3 0 0 0-3-3zm-1 3a1 1 0 1 1 2 0v2h-2V6z"
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