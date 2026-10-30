<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import dayjs from 'dayjs';
import { useRosterStore } from '@/stores/roster';
import { useAttendanceStore } from '@/stores/attendance';
import type { AttendanceRecord } from '@/types';
import AppHeader from '@/components/common/AppHeader.vue';
import EmptyState from '@/components/common/EmptyState.vue';
import { exportRecordsToExcel, exportRecordsToCsv } from '@/utils/export';
import { Delete } from '@element-plus/icons-vue';

const roster = useRosterStore();
const attendance = useAttendanceStore();

onMounted(() => {
  attendance.init();
});

const selectedDate = ref(dayjs().format('YYYY-MM-DD'));

const records = computed<AttendanceRecord[]>(() =>
  attendance.recordsForDate(selectedDate.value).slice().sort((a, b) => a.timestamp - b.timestamp)
);

const stats = computed(() => {
  const present = records.value.filter((r) => r.status === 'present').length;
  const absent = records.value.filter((r) => r.status === 'absent').length;
  const total = roster.count;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, rate };
});

const dateList = computed(() => {
  const dates = attendance.recordDates;
  if (!dates.includes(selectedDate.value) && selectedDate.value) {
    return [selectedDate.value, ...dates];
  }
  return dates;
});

function rateColor(percentage: number): string {
  if (percentage >= 80) return '#10B981';
  if (percentage >= 60) return '#F59E0B';
  return '#EF4444';
}

async function toggleStatus(raw: unknown): Promise<void> {
  const record = raw as AttendanceRecord;
  const next = record.status === 'present' ? 'absent' : 'present';
  await attendance.updateStatus(record.id, next);
}

async function handleDelete(raw: unknown): Promise<void> {
  const record = raw as AttendanceRecord;
  try {
    await ElMessageBox.confirm(`确定删除「${record.name}」的记录吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  await attendance.removeRecord(record.id);
  ElMessage.success('已删除记录');
}

function handleExport(type: 'xlsx' | 'csv'): void {
  if (records.value.length === 0) {
    ElMessage.warning('当前日期没有记录，无法导出');
    return;
  }
  if (type === 'xlsx') {
    exportRecordsToExcel(records.value, selectedDate.value);
  } else {
    exportRecordsToCsv(records.value, selectedDate.value);
  }
  ElMessage.success('导出成功');
}
</script>

<template>
  <div>
    <AppHeader title="签到记录" />

    <main class="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div class="grid gap-4 lg:grid-cols-[200px_1fr]">
        <!-- 历史日期侧边栏（PC） -->
        <aside class="app-card hidden h-fit p-3 lg:block">
          <p class="px-2 py-1 text-xs font-medium text-text-sub">历史记录</p>
          <div class="mt-1 flex flex-col gap-1">
            <button
              v-for="date in dateList"
              :key="date"
              class="flex items-center justify-between rounded-lg px-3 py-2 text-sm transition hover:bg-[var(--color-bg)]"
              :class="date === selectedDate ? '!bg-primary !text-white' : 'text-text-main'"
              @click="selectedDate = date"
            >
              <span>{{ date }}</span>
              <span v-if="date === dayjs().format('YYYY-MM-DD')" class="text-xs opacity-70">今天</span>
            </button>
            <p v-if="dateList.length === 0" class="px-3 py-2 text-xs text-text-sub">暂无记录</p>
          </div>
        </aside>

        <!-- 主内容 -->
        <div class="min-w-0">
          <!-- 顶部：日期 + 导出 -->
          <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <el-date-picker
              v-model="selectedDate"
              type="date"
              value-format="YYYY-MM-DD"
              placeholder="选择日期"
              class="!w-full md:!w-44"
            />
            <el-dropdown trigger="click" @command="handleExport">
              <el-button type="primary">导出当日记录</el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="xlsx">导出 Excel (.xlsx)</el-dropdown-item>
                  <el-dropdown-item command="csv">导出 CSV (.csv)</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <!-- 统计卡片 -->
          <div class="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <div class="app-card p-4 text-center">
              <p class="text-xs text-text-sub">应到</p>
              <p class="mt-2 text-2xl font-bold text-text-main">{{ stats.total }}</p>
            </div>
            <div class="app-card p-4 text-center">
              <p class="text-xs text-text-sub">实到</p>
              <p class="mt-2 text-2xl font-bold text-success">{{ stats.present }}</p>
            </div>
            <div class="app-card p-4 text-center">
              <p class="text-xs text-text-sub">未到</p>
              <p class="mt-2 text-2xl font-bold text-danger">{{ stats.absent }}</p>
            </div>
            <div class="app-card col-span-2 flex items-center justify-center gap-4 p-4 md:col-span-1">
              <el-progress
                type="circle"
                :percentage="stats.rate"
                :width="72"
                :stroke-width="8"
                :color="rateColor"
              />
              <div>
                <p class="text-xs text-text-sub">到勤率</p>
                <p class="text-lg font-bold text-text-main">{{ stats.rate }}%</p>
              </div>
            </div>
          </div>

          <!-- 记录列表 -->
          <div v-if="records.length === 0">
            <EmptyState
              title="当天暂无签到记录"
              description="可前往「签到」页面开始点名，或选择左侧其他日期查看"
            />
          </div>

          <!-- PC 表格 -->
          <div v-else class="hidden md:block">
            <el-table :data="records" style="width: 100%" row-key="id">
              <el-table-column type="index" label="序号" width="70" align="center" />
              <el-table-column prop="name" label="姓名" min-width="120" />
              <el-table-column prop="studentNo" label="学号" min-width="140">
                <template #default="{ row }">
                  <span class="text-text-sub">{{ row.studentNo || '—' }}</span>
                </template>
              </el-table-column>
              <el-table-column prop="time" label="签到时间" min-width="120" />
              <el-table-column label="状态" width="110" align="center">
                <template #default="{ row }">
                  <el-tag
                    :type="row.status === 'present' ? 'success' : 'danger'"
                    class="cursor-pointer"
                    effect="light"
                    @click="toggleStatus(row)"
                  >
                    {{ row.status === 'present' ? '已到' : '未到' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80" align="center">
                <template #default="{ row }">
                  <el-button link type="danger" :icon="Delete" @click="handleDelete(row)" />
                </template>
              </el-table-column>
            </el-table>
          </div>

          <!-- 手机卡片 -->
          <div v-if="records.length > 0" class="md:hidden flex flex-col gap-3">
            <div
              v-for="(record, idx) in records"
              :key="record.id"
              class="app-card flex items-center justify-between px-4 py-3"
            >
              <div class="min-w-0">
                <div class="flex items-center gap-2">
                  <span class="text-sm font-medium text-text-main">{{ record.name }}</span>
                  <el-tag
                    :type="record.status === 'present' ? 'success' : 'danger'"
                    size="small"
                    effect="light"
                    class="cursor-pointer"
                    @click="toggleStatus(record)"
                  >
                    {{ record.status === 'present' ? '已到' : '未到' }}
                  </el-tag>
                </div>
                <p class="mt-1 truncate text-xs text-text-sub">
                  {{ idx + 1 }} · {{ record.studentNo || '暂无学号' }} · {{ record.time }}
                </p>
              </div>
              <el-button size="small" text type="danger" :icon="Delete" @click="handleDelete(record)" />
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>