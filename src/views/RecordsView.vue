<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
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

const selectedDate = ref('');
const selectedEvent = ref('');
const selection = ref<AttendanceRecord[]>([]);

/** 所有签到事件（日期 + 事件名），最新在前 */
const eventItems = computed(() => attendance.recordEvents);

// 自动选中最新事件；当前事件被删除后回退到最新
watch(
  eventItems,
  (list) => {
    if (list.length === 0) return;
    const still = list.some(
      (e) => e.date === selectedDate.value && e.event === selectedEvent.value
    );
    if (!still) {
      selectedDate.value = list[0].date;
      selectedEvent.value = list[0].event;
    }
  },
  { immediate: true }
);

/** 移动端事件下拉选择：绑定「日期|事件」组合 */
const activeKey = computed<string>({
  get: () => `${selectedDate.value}|${selectedEvent.value}`,
  set: (val: string) => {
    const [date, event] = val.split('|');
    selectedDate.value = date;
    selectedEvent.value = event;
    selection.value = [];
  },
});

function selectEvent(item: { date: string; event: string }): void {
  selectedDate.value = item.date;
  selectedEvent.value = item.event;
  selection.value = [];
}

const records = computed<AttendanceRecord[]>(() =>
  attendance
    .recordsForDate(selectedDate.value, selectedEvent.value)
    .slice()
    .sort((a, b) => a.timestamp - b.timestamp)
);

// 到勤率按当前事件统计：实到 / 名单总人数
const stats = computed(() => {
  const present = records.value.filter((r) => r.status === 'present').length;
  const absent = records.value.filter((r) => r.status === 'absent').length;
  const total = roster.count;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, rate };
});

function rateColor(percentage: number): string {
  if (percentage >= 80) return '#67C23A';
  if (percentage >= 60) return '#E6A23C';
  return '#F56C6C';
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

// —— 多选 ——
const allSelected = computed(
  () => records.value.length > 0 && selection.value.length === records.value.length
);
const indeterminate = computed(
  () => selection.value.length > 0 && selection.value.length < records.value.length
);

function isSelected(raw: unknown): boolean {
  return selection.value.some((s) => s.id === (raw as AttendanceRecord).id);
}
function toggleSelect(raw: unknown, checked: unknown): void {
  const record = raw as AttendanceRecord;
  const list = checked
    ? [...selection.value, record]
    : selection.value.filter((s) => s.id !== record.id);
  selection.value = list;
}
function toggleAll(checked: unknown): void {
  selection.value = checked ? [...records.value] : [];
}

async function handleDeleteSelected(): Promise<void> {
  if (selection.value.length === 0) return;
  try {
    await ElMessageBox.confirm(`确定删除选中的 ${selection.value.length} 条记录吗？`, '批量删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  await attendance.removeRecords(selection.value.map((r) => r.id));
  ElMessage.success(`已删除 ${selection.value.length} 条记录`);
  selection.value = [];
}

async function handleClearAll(): Promise<void> {
  if (records.value.length === 0) {
    ElMessage.warning('当前事件没有记录');
    return;
  }
  try {
    await ElMessageBox.confirm(
      `确定删除「${selectedEvent.value}」的全部 ${records.value.length} 条记录吗？此操作不可恢复。`,
      '全部删除确认',
      { type: 'warning', confirmButtonText: '全部删除', cancelButtonText: '取消' }
    );
  } catch {
    return;
  }
  await attendance.clearRecords(selectedDate.value, selectedEvent.value);
  ElMessage.success('已清空该事件记录');
  selection.value = [];
}

function handleExport(type: 'xlsx' | 'csv'): void {
  if (records.value.length === 0) {
    ElMessage.warning('当前事件没有记录，无法导出');
    return;
  }
  if (type === 'xlsx') {
    exportRecordsToExcel(records.value, selectedDate.value, selectedEvent.value);
  } else {
    exportRecordsToCsv(records.value, selectedDate.value, selectedEvent.value);
  }
  ElMessage.success('导出成功');
}
</script>

<template>
  <div>
    <AppHeader title="签到记录" />

    <main class="mx-auto max-w-6xl px-4 py-6 md:px-8 md:py-8">
      <div class="grid gap-4 lg:grid-cols-[220px_1fr]">
        <!-- 签到事件侧边栏（PC） -->
        <aside class="app-card hidden h-fit p-3 lg:block">
          <p class="px-2 py-1 text-xs font-medium text-text-sub">签到事件</p>
          <div class="mt-1 flex flex-col gap-1">
            <button
              v-for="(item, i) in eventItems"
              :key="item.date + '|' + item.event"
              class="rounded-lg px-3 py-2 text-left transition hover:bg-[var(--color-bg)]"
              :class="
                item.date === selectedDate && item.event === selectedEvent
                  ? '!bg-primary text-white'
                  : 'text-text-main'
              "
              @click="selectEvent(item)"
            >
              <div class="flex items-center justify-between gap-2">
                <span class="truncate text-sm font-medium">{{ item.event }}</span>
                <span
                  v-if="i === 0"
                  class="shrink-0 rounded px-1.5 py-0.5 text-[11px]"
                  :class="
                    item.date === selectedDate && item.event === selectedEvent
                      ? 'bg-white/20'
                      : 'bg-primary/10 text-primary'
                  "
                >
                  最新
                </span>
              </div>
              <p
                class="mt-0.5 text-xs"
                :class="
                  item.date === selectedDate && item.event === selectedEvent
                    ? 'text-white/70'
                    : 'text-text-sub'
                "
              >
                {{ item.date }}
              </p>
            </button>
            <p v-if="eventItems.length === 0" class="px-3 py-2 text-xs text-text-sub">暂无记录</p>
          </div>
        </aside>

        <!-- 主内容 -->
        <div class="min-w-0">
          <template v-if="eventItems.length > 0">
            <!-- 顶部：事件标题 + 操作 -->
            <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div class="min-w-0">
                <h2 class="truncate text-lg font-semibold text-text-main">
                  {{ selectedEvent || '签到记录' }}
                </h2>
                <p class="mt-0.5 text-sm text-text-sub">{{ selectedDate }}</p>
                <el-select
                  v-model="activeKey"
                  class="!mt-3 !w-full lg:!hidden"
                  placeholder="选择签到事件"
                >
                  <el-option
                    v-for="item in eventItems"
                    :key="item.date + '|' + item.event"
                    :label="`${item.date} · ${item.event}`"
                    :value="`${item.date}|${item.event}`"
                  />
                </el-select>
              </div>
              <div class="flex flex-wrap gap-2">
                <el-button
                  v-if="selection.length > 0"
                  type="danger"
                  :icon="Delete"
                  @click="handleDeleteSelected"
                >
                  删除选中 ({{ selection.length }})
                </el-button>
                <el-button type="danger" plain @click="handleClearAll">全部删除</el-button>
                <el-dropdown trigger="click" @command="handleExport">
                  <el-button type="primary">导出</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="xlsx">导出 Excel (.xlsx)</el-dropdown-item>
                      <el-dropdown-item command="csv">导出 CSV (.csv)</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </div>
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
              <EmptyState title="该事件暂无签到记录" description="可前往「签到」页面开始点名" />
            </div>

            <!-- PC 表格 -->
            <div v-else class="hidden md:block">
              <el-table :data="records" style="width: 100%" row-key="id">
                <el-table-column width="50" align="center">
                  <template #header>
                    <el-checkbox
                      :model-value="allSelected"
                      :indeterminate="indeterminate"
                      @change="toggleAll"
                    />
                  </template>
                  <template #default="{ row }">
                    <el-checkbox :model-value="isSelected(row)" @change="toggleSelect(row, $event)" />
                  </template>
                </el-table-column>
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
                <div class="flex min-w-0 items-center gap-3">
                  <el-checkbox
                    :model-value="isSelected(record)"
                    @change="toggleSelect(record, $event)"
                  />
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
                </div>
                <el-button size="small" text type="danger" :icon="Delete" @click="handleDelete(record)" />
              </div>
            </div>
          </template>

          <EmptyState
            v-else
            title="暂无签到记录"
            description="可前往「签到」页面开始点名，签到后对应事件会显示在这里"
          />
        </div>
      </div>
    </main>
  </div>
</template>