<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue';
import dayjs from 'dayjs';
import { useRosterStore } from '@/stores/roster';
import { useAttendanceStore } from '@/stores/attendance';
import { useSettingsStore } from '@/stores/settings';
import type { AttendanceStatus, Student } from '@/types';
import AppHeader from '@/components/common/AppHeader.vue';
import RollCallProgress from '@/components/rollcall/RollCallProgress.vue';
import RollCallDialog from '@/components/rollcall/RollCallDialog.vue';
import SlideSignDialog from '@/components/rollcall/SlideSignDialog.vue';

const roster = useRosterStore();
const attendance = useAttendanceStore();

onMounted(() => {
  attendance.init();
});

const todayStr = dayjs().format('YYYY-MM-DD');
const todayText = dayjs().format('YYYY年MM月DD日');

const showDialog = ref(false);
const queue = ref<Student[]>([]);
const signMode = ref<'buttons' | 'slide'>('buttons');

const baselinePresent = ref(0);
const sessionPresent = ref(0);
const livePresent = computed(() => baselinePresent.value + sessionPresent.value);
const total = computed(() => roster.count);

const settings = useSettingsStore();

/** 签到事件选择 */
const selectedEvent = ref('');
const eventOptions = computed(() => settings.events);
const currentEvent = computed(() => selectedEvent.value.trim());

// 事件列表变化时：当前选中失效则回退到首项；列表为空则清空选中
watch(
  () => settings.events,
  (list) => {
    if (list.length > 0 && !list.includes(selectedEvent.value)) {
      selectedEvent.value = list[0];
    } else if (list.length === 0) {
      selectedEvent.value = '';
    }
  },
  { immediate: true }
);

/** 事件管理弹窗 */
const manageVisible = ref(false);
const newEventName = ref('');

function addEvent(): void {
  const name = newEventName.value.trim();
  if (!name) {
    ElMessage.warning('请输入事件名称');
    return;
  }
  if (settings.addEvent(name)) {
    selectedEvent.value = name;
    newEventName.value = '';
    ElMessage.success('已添加事件');
  } else {
    ElMessage.warning('该事件已存在');
  }
}

function removeEvent(name: string): void {
  settings.removeEvent(name);
  ElMessage.success('已删除事件');
}

/** 已完成统计弹窗 */
const summaryVisible = ref(false);
const summary = reactive({ present: 0, absent: 0, rate: 0, event: '' });

/** 开始签到：从名单中筛出该事件尚未签到的人员 */
function startRollCall(): void {
  if (roster.count === 0) {
    ElMessage.warning('名单为空，请先添加人员');
    return;
  }
  const event = currentEvent.value;
  if (!event) {
    ElMessage.warning('请先添加签到事件');
    return;
  }
  const already = attendance.recordsForDate(todayStr, event);
  const signedIds = new Set(already.map((r) => r.studentId));
  const pending = roster.students.filter((s) => !signedIds.has(s.id));

  if (pending.length === 0) {
    ElMessage.success('该事件已完成全员签到');
    return;
  }

  baselinePresent.value = already.filter((r) => r.status === 'present').length;
  sessionPresent.value = 0;
  queue.value = pending;
  showDialog.value = true;
}

function onProgress(payload: { current: number; total: number; present: number; absent: number }): void {
  sessionPresent.value = payload.present;
}

/** 签到完成：持久化记录并展示统计 */
async function onComplete(results: Array<{ student: Student; status: AttendanceStatus }>): Promise<void> {
  try {
    const event = currentEvent.value;
    for (const item of results) {
      await attendance.addRecord({
        studentId: item.student.id,
        studentNo: item.student.studentNo,
        name: item.student.name,
        status: item.status,
        event,
      });
    }
    const todayRecords = attendance.recordsForDate(todayStr, event);
    const present = todayRecords.filter((r) => r.status === 'present').length;
    const absent = todayRecords.filter((r) => r.status === 'absent').length;
    const rate = total.value > 0 ? Math.round((present / total.value) * 100) : 0;

    summary.present = present;
    summary.absent = absent;
    summary.rate = rate;
    summary.event = event;
    summaryVisible.value = true;

    await attendance.createSession({
      date: todayStr,
      totalCount: total.value,
      presentCount: present,
      absentCount: absent,
      completed: true,
    });
  } catch (err) {
    console.error('保存签到记录失败', err);
    ElMessage.error('保存签到记录失败');
  }
}
</script>

<template>
  <div>
    <AppHeader title="签到" />

    <main class="mx-auto max-w-3xl px-4 py-6 md:px-8 md:py-8">
      <section class="mb-5 animate-fade-in">
        <p class="text-sm text-text-sub">{{ todayText }}</p>
        <h2 class="mt-1 text-2xl font-bold text-text-main md:text-3xl">点名签到</h2>
      </section>

      <RollCallProgress :present="livePresent" :total="total" />

      <div class="app-card mt-6 p-4">
        <div class="mb-2 flex items-center justify-between">
          <p class="text-sm font-medium text-text-main">签到事件</p>
          <el-button link type="primary" @click="manageVisible = true">管理事件</el-button>
        </div>
        <el-select v-model="selectedEvent" class="w-full" size="large">
          <el-option v-for="e in eventOptions" :key="e" :label="e" :value="e" />
        </el-select>
      </div>

      <div class="mt-6">
        <div class="mb-3 grid grid-cols-2 gap-2">
          <button
            class="rounded-lg py-2.5 text-sm font-medium transition"
            :class="signMode === 'buttons' ? 'bg-primary text-white' : 'bg-[var(--color-bg)] text-text-main'"
            style="border: 1px solid var(--color-border)"
            @click="signMode = 'buttons'"
          >
            按钮签到
          </button>
          <button
            class="rounded-lg py-2.5 text-sm font-medium transition"
            :class="signMode === 'slide' ? 'bg-primary text-white' : 'bg-[var(--color-bg)] text-text-main'"
            style="border: 1px solid var(--color-border)"
            @click="signMode = 'slide'"
          >
            滑动签到
          </button>
        </div>
        <el-button
          size="large"
          type="primary"
          class="w-full !h-16 text-base font-semibold md:!h-14"
          @click="startRollCall"
        >
          开始签到
        </el-button>
        <p class="mt-3 text-center text-xs text-text-sub">
          {{ signMode === 'buttons' ? '逐一点名，点击按钮标记' : '上滑标记已到，右滑标记未到' }}
        </p>
      </div>
    </main>

    <RollCallDialog
      v-if="signMode === 'buttons'"
      v-model="showDialog"
      :students="queue"
      @progress="onProgress"
      @complete="onComplete"
    />
    <SlideSignDialog
      v-else
      v-model="showDialog"
      :students="queue"
      @progress="onProgress"
      @complete="onComplete"
    />

    <!-- 完成统计 -->
    <el-dialog
      v-model="summaryVisible"
      title="签到完成"
      width="92%"
      :style="{ maxWidth: '420px' }"
      :close-on-click-modal="false"
      align-center
    >
      <div class="py-2 text-center">
        <div
          class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-bold text-white"
          style="background: var(--color-primary)"
        >
          {{ summary.rate }}%
        </div>
        <p class="mb-3 text-sm font-medium text-primary">{{ summary.event }}</p>
        <p class="text-base text-text-main">
          已到 <span class="font-bold text-success">{{ summary.present }}</span> 人，
          未到 <span class="font-bold text-danger">{{ summary.absent }}</span> 人
        </p>
        <p class="mt-1 text-sm text-text-sub">到勤率 {{ summary.rate }}%</p>
      </div>
      <template #footer>
        <div class="flex gap-3">
          <router-link to="/records" class="flex-1">
            <el-button class="w-full" @click="summaryVisible = false">查看记录</el-button>
          </router-link>
          <el-button class="flex-1" type="primary" @click="summaryVisible = false">完成</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 事件管理 -->
    <el-dialog
      v-model="manageVisible"
      title="管理签到事件"
      width="92%"
      :style="{ maxWidth: '440px' }"
      align-center
    >
      <div class="space-y-5">
        <div>
          <p class="mb-2 text-xs text-text-sub">事件列表（可删除）</p>
          <div
            v-if="settings.events.length === 0"
            class="rounded-lg border border-dashed p-3 text-center text-xs text-text-sub"
            style="border-color: var(--color-border)"
          >
            暂无事件，请在下方添加
          </div>
          <div v-else class="flex flex-col gap-2">
            <div
              v-for="e in settings.events"
              :key="e"
              class="flex items-center justify-between rounded-lg px-3 py-2"
              style="border: 1px solid var(--color-border)"
            >
              <span class="text-sm text-text-main">{{ e }}</span>
              <el-button link type="danger" @click="removeEvent(e)">删除</el-button>
            </div>
          </div>
        </div>

        <div>
          <p class="mb-2 text-xs text-text-sub">添加事件</p>
          <div class="flex gap-2">
            <el-input
              v-model="newEventName"
              maxlength="20"
              placeholder="输入事件名称"
              @keyup.enter="addEvent"
            />
            <el-button type="primary" @click="addEvent">添加</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" class="w-full" @click="manageVisible = false">完成</el-button>
      </template>
    </el-dialog>
  </div>
</template>