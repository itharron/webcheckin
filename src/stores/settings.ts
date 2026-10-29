import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Theme } from '@/types';

const THEME_KEY = 'roll-call-theme';

/** 从 LocalStorage 读取已保存主题，或回退到系统偏好 */
function detectInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>(detectInitialTheme());

  /** 应用主题到根元素类名（Element Plus 暗色模式依赖 `html.dark`） */
  function applyTheme(): void {
    document.documentElement.classList.toggle('dark', theme.value === 'dark');
    document.documentElement.classList.toggle('light', theme.value === 'light');
    localStorage.setItem(THEME_KEY, theme.value);
  }

  /** 切换亮色 / 暗色主题 */
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
    applyTheme();
  }

  // 初始化即应用一次
  applyTheme();

  return { theme, applyTheme, toggleTheme };
});