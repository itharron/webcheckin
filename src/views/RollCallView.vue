<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue';
import dayjs from 'dayjs';
import { ElMessage } from 'element-plus';
import { useRosterStore } from '@/stores/roster';
import { useAttendanceStore } from '@/stores/attendance';
import type { AttendanceStatus, Student } from '@/types';
import AppHeader from '@/components/common/AppHeader.vue';
import RollCallProgress from '@/components/rollcall/RollCallProgress.vue';
import RollCallDialog from '@/components/rollcall/RollCallDialog.vue';

const roster = useRosterStore();
const attendance = useAttendanceStore();

onMounted(() => {
  attendance.init();
});

const todayStr = dayjs().format('YYYY-MM-DD');
const todayText = dayjs().format('YYYY年MM月DD日');

const showDialog = ref(false);
const queue = ref<Student[]>([]);

const baselinePresent = ref(0);
const sessionPresent = ref(0);
const livePresent = computed(() => baselinePresent.value + sessionPresent.value);
const total = computed(() => roster.count);

/** 已完成统计弹窗 */
const summaryVisible = ref(false);
const summary = reactive({ present: 0, absent: 0, rate: 0 });

/** 开始签到：从名单中筛出今日尚未签到的人员 */
function startRollCall(): void {
  if (roster.count === 0) {
    ElMessage.warning('名单为空，请先添加人员');
    return;
  }
  const already = attendance.recordsForDate(todayStr);
  const signedIds = new Set(already.map((r) => r.studentId));
  const pending = roster.students.filter((s) => !signedIds.has(s.id));

  if (pending.length === 0) {
    ElMessage.success('今日已完成全员签到');
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
    for (const item of results) {
      await attendance.addRecord({
        studentId: item.student.id,
        studentNo: item.student.studentNo,
        name: item.student.name,
        status: item.status,
      });
    }
    const todayRecords = attendance.recordsForDate(todayStr);
    const present = todayRecords.filter((r) => r.status === 'present').length;
    const absent = todayRecords.filter((r) => r.status === 'absent').length;
    const rate = total.value > 0 ? Math.round((present / total.value) * 100) : 0;

    summary.present = present;
    summary.absent = absent;
    summary.rate = rate;
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

      <div class="mt-6">
        <el-button
          size="large"
          type="primary"
          class="w-full !h-16 text-base font-semibold md:!h-14"
          @click="startRollCall"
        >
          开始签到
        </el-button>
        <p class="mt-3 text-center text-xs text-text-sub">
          将按名单顺序逐一点名，签到时间精确到秒
        </p>
      </div>
    </main>

    <RollCallDialog
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
          style="background: linear-gradient(135deg, #4f46e5, #818cf8)"
        >
          {{ summary.rate }}%
        </div>
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
  </div>
</template>