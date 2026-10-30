import { defineStore } from 'pinia';
import { ref } from 'vue';
import type { Theme } from '@/types';

const THEME_KEY = 'roll-call-theme';
const EVENTS_KEY = 'roll-call-events';
const LEGACY_EVENTS_KEY = 'roll-call-custom-events';
const DEFAULT_EVENTS = ['早自习', '晚自习'];

/** 读取完整事件列表（含默认事件），并迁移旧版本的自定义事件 */
function loadEvents(): string[] {
  try {
    const raw = localStorage.getItem(EVENTS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const list = arr.filter((s): s is string => typeof s === 'string');
        if (list.length > 0) return [...new Set(list)];
      }
    }
    // 迁移旧版本保存的自定义事件
    const legacy: string[] = [];
    const oldRaw = localStorage.getItem(LEGACY_EVENTS_KEY);
    if (oldRaw) {
      const arr = JSON.parse(oldRaw);
      if (Array.isArray(arr)) legacy.push(...arr.filter((s) => typeof s === 'string'));
    }
    return [...new Set([...DEFAULT_EVENTS, ...legacy])];
  } catch {
    return [...DEFAULT_EVENTS];
  }
}

/** 从 LocalStorage 读取已保存主题，未选择时默认暗色 */
function detectInitialTheme(): Theme {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved === 'light' || saved === 'dark') return saved;
  return 'dark';
}

export const useSettingsStore = defineStore('settings', () => {
  const theme = ref<Theme>(detectInitialTheme());
  const events = ref<string[]>(loadEvents());

  /** 新增事件（去重），返回是否成功 */
  function addEvent(name: string): boolean {
    const trimmed = name.trim();
    if (!trimmed || events.value.includes(trimmed)) return false;
    events.value = [...events.value, trimmed];
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.value));
    return true;
  }

  /** 删除事件 */
  function removeEvent(name: string): void {
    events.value = events.value.filter((e) => e !== name);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events.value));
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

  return { theme, applyTheme, toggleTheme, events, addEvent, removeEvent };
});