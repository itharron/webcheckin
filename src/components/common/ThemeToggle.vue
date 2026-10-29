<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';
import { Sunny, Moon } from '@element-plus/icons-vue';

const settings = useSettingsStore();
</script>

<template>
  <button
    class="theme-toggle"
    :title="settings.theme === 'light' ? '切换到暗色模式' : '切换到亮色模式'"
    @click="settings.toggleTheme()"
  >
    <el-icon :size="18">
      <Sunny v-if="settings.theme === 'light'" />
      <Moon v-else />
    </el-icon>
  </button>
</template>

<style scoped>
.theme-toggle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  border: 1px solid var(--color-border);
  background: var(--color-card);
  color: var(--color-text);
  cursor: pointer;
  transition: transform 0.2s ease, background-color 0.3s ease, color 0.3s ease,
    border-color 0.3s ease;
}
.theme-toggle:hover {
  transform: translateY(-1px);
  color: var(--color-primary);
}
.theme-toggle:active {
  transform: scale(0.92);
}
</style>