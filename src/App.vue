<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useAttendanceStore } from '@/stores/attendance';
import { HomeFilled, User, Timer, Calendar } from '@element-plus/icons-vue';
import type { Component } from 'vue';

const route = useRoute();
const attendance = useAttendanceStore();

onMounted(() => {
  attendance.init();
});

interface NavItem {
  path: string;
  label: string;
  icon: Component;
}

const navItems: NavItem[] = [
  { path: '/', label: '首页', icon: HomeFilled },
  { path: '/roster', label: '名单', icon: User },
  { path: '/rollcall', label: '签到', icon: Timer },
  { path: '/records', label: '记录', icon: Calendar },
];

function isActive(item: NavItem): boolean {
  if (item.path === '/') return route.path === '/';
  return route.path.startsWith(item.path);
}
</script>

<template>
  <div class="flex h-screen overflow-hidden">
    <!-- PC 侧边栏 -->
    <aside
      class="hidden w-56 shrink-0 flex-col md:flex"
      style="background: var(--color-card); border-right: 1px solid var(--color-border)"
    >
      <div class="flex items-center gap-3 px-5 py-5">
        <div
          class="flex h-10 w-10 items-center justify-center rounded-xl text-white"
          style="background: var(--color-primary)"
        >
          <el-icon :size="20"><Timer /></el-icon>
        </div>
        <span class="text-base font-bold text-text-main">点名签到</span>
      </div>
      <nav class="mt-2 flex flex-1 flex-col gap-1 px-3">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition"
          :class="isActive(item) ? '!bg-primary !text-white' : 'text-text-sub hover:bg-[var(--color-bg)]'"
        >
          <el-icon :size="18"><component :is="item.icon" /></el-icon>
          <span>{{ item.label }}</span>
        </router-link>
      </nav>
      <p class="px-5 py-4 text-xs text-text-sub">数据保存在本地浏览器</p>
    </aside>

    <!-- 主内容 -->
    <div class="flex min-w-0 flex-1 flex-col">
      <main class="flex-1 overflow-y-auto pb-20 md:pb-0">
        <router-view v-slot="{ Component: View }">
          <transition name="page" mode="out-in">
            <component :is="View" />
          </transition>
        </router-view>
      </main>
    </div>

    <!-- 手机底部 TabBar -->
    <nav
      class="fixed inset-x-0 bottom-0 z-10 flex border-t md:hidden"
      style="background: var(--color-card); border-color: var(--color-border)"
    >
      <router-link
        v-for="item in navItems"
        :key="item.path"
        :to="item.path"
        class="flex flex-1 flex-col items-center gap-0.5 py-1.5 text-xs"
        :class="isActive(item) ? 'text-primary' : 'text-text-sub'"
      >
        <el-icon :size="20"><component :is="item.icon" /></el-icon>
        <span>{{ item.label }}</span>
      </router-link>
    </nav>
  </div>
</template>