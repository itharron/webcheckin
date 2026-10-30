<script setup lang="ts">
import { computed, onMounted } from 'vue';
import dayjs from 'dayjs';
import { useRouter } from 'vue-router';
import { useRosterStore } from '@/stores/roster';
import { useAttendanceStore } from '@/stores/attendance';
import AppHeader from '@/components/common/AppHeader.vue';
import QuickStats from '@/components/rollcall/QuickStats.vue';
import TypeWriter from '@/components/common/TypeWriter.vue';
import { User, Calendar, Timer } from '@element-plus/icons-vue';

const roster = useRosterStore();
const attendance = useAttendanceStore();
const router = useRouter();

onMounted(() => {
  attendance.init();
});

const now = dayjs();
const todayText = computed(() => now.format('YYYY年MM月DD日'));
const weekdayText = computed(() => `星期${'日一二三四五六'[now.day()]}`);

const todayStr = now.format('YYYY-MM-DD');
const presentCount = computed(
  () => attendance.recordsForDate(todayStr).filter((r) => r.status === 'present').length
);
const absentCount = computed(
  () => attendance.recordsForDate(todayStr).filter((r) => r.status === 'absent').length
);

const statItems = computed(() => [
  { label: '总人数', value: roster.count, color: '#409EFF' },
  { label: '今日已到', value: presentCount.value, color: '#67C23A' },
  { label: '今日未到', value: absentCount.value, color: '#F56C6C' },
]);

const recent = computed(() => attendance.recentSession);
const recentText = computed(() => {
  if (!recent.value) return '暂无签到记录';
  const t = dayjs(recent.value.startTime);
  return `${t.format('MM月DD日 HH:mm')} · 到 ${recent.value.presentCount} 人 / 共 ${recent.value.totalCount} 人`;
});

function go(path: string): void {
  router.push(path);
}
</script>

<template>
  <div>
    <AppHeader title="点名签到系统" />

    <main class="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-10">
      <!-- 今日日期 -->
      <section class="mb-6 animate-fade-in">
        <p class="text-sm text-text-sub">{{ weekdayText }}</p>
        <h2 class="mt-1 text-3xl font-bold tracking-tight text-text-main md:text-4xl">
          {{ todayText }}
        </h2>
        <p class="mt-3 flex items-center gap-2 text-sm text-text-sub">
          <span class="font-mono text-primary">&gt;</span>
          <TypeWriter :phrases="['开始今天的签到吧', '记录每一次出勤', '名单数据安全保存在本地']" />
        </p>
      </section>

      <!-- 核心数据卡片 -->
      <section class="mb-8">
        <QuickStats :items="statItems" />
      </section>

      <!-- 入口按钮 -->
      <section class="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div
          class="app-card app-card--hover cursor-pointer p-6 text-center"
          @click="go('/rollcall')"
        >
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style="background: var(--color-primary)"
          >
            <el-icon :size="26"><Timer /></el-icon>
          </div>
          <p class="text-lg font-semibold text-text-main">开始签到</p>
          <p class="mt-1 text-xs text-text-sub">立即开始一轮点名</p>
        </div>

        <div
          class="app-card app-card--hover cursor-pointer p-6 text-center"
          @click="go('/roster')"
        >
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style="background: var(--color-success)"
          >
            <el-icon :size="26"><User /></el-icon>
          </div>
          <p class="text-lg font-semibold text-text-main">人员名单</p>
          <p class="mt-1 text-xs text-text-sub">管理签到人员</p>
        </div>

        <div
          class="app-card app-card--hover cursor-pointer p-6 text-center"
          @click="go('/records')"
        >
          <div
            class="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white"
            style="background: var(--color-warning)"
          >
            <el-icon :size="26"><Calendar /></el-icon>
          </div>
          <p class="text-lg font-semibold text-text-main">签到记录</p>
          <p class="mt-1 text-xs text-text-sub">查看历史签到</p>
        </div>
      </section>

      <!-- 最近一次签到 -->
      <section class="app-card mt-8 p-5">
        <p class="text-sm font-medium text-text-main">最近一次签到</p>
        <p class="mt-2 text-sm text-text-sub">{{ recentText }}</p>
      </section>
    </main>
  </div>
</template>