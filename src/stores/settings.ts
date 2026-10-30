import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Theme } from '@/types';

const THEME_KEY = 'roll-call-theme';
const EVENTS_KEY = 'roll-call-custom-events';

/** 读取用户自定义的签到事件列表 */
function loadCustomEvents(): string[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((s) => typeof s === 'string') : [];
  } catch {
    return [];
  }
}

/** 从 LocalStorage 读取已保存主题，未选择时默认暗色 */
function detectInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  // 未手动选择过主题时，默认使用暗色模式
  return 'dark';
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>(detectInitialTheme());
  const customEvents = ref<string[]>(loadCustomEvents());

  /** 新增自定义事件（去重），返回是否成功 */
  function addCustomEvent(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || customEvents.value.includes(trimmed)) return false;
    customEvents.value = [...customEvents.value, trimmed];
    localStorage.setItem(EVENTS_KEY, JSON.stringify(customEvents.value));
    return true;
  }

  /** 删除自定义事件 */
  function removeCustomEvent(name: string): void {
    customEvents.value = customEvents.value.filter((e) => e !== name);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(customEvents.value));
  }

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

  return { theme, applyTheme, toggleTheme, customEvents, addCustomEvent, removeCustomEvent };
});