<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import type { AttendanceStatus, Student } from '@/types';
import { RefreshLeft, Top, Bottom } from '@element-plus/icons-vue';
import PinyinName from '@/components/common/PinyinName.vue';

const props = defineProps<{
  modelValue: boolean;
  /** 待签到队列（按顺序） */
  students: Student[];
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'progress', payload: { current: number; total: number; present: number; absent: number }): void;
  (e: 'complete', results: Array<{ student: Student; status: AttendanceStatus }>): void;
}>();

const queue = ref<Student[]>([]);
const marks = reactive<Record<string, AttendanceStatus>>({});
const history = ref<Array<{ student: Student; status: AttendanceStatus }>>([]);

const VISIBLE_COUNT = 12;
const visible = computed(() => queue.value.slice(0, VISIBLE_COUNT));
const currentStudent = computed<Student | undefined>(() => queue.value[0]);
const total = computed(() => props.students.length);
const done = computed(() => total.value - queue.value.length);
const presentCount = computed(() => Object.values(marks).filter((s) => s === 'present').length);
const absentCount = computed(() => Object.values(marks).filter((s) => s === 'absent').length);

function emitProgress(): void {
  emit('progress', {
    current: done.value,
    total: total.value,
    present: presentCount.value,
    absent: absentCount.value,
  });
}

function reset(): void {
  queue.value = [...props.students];
  history.value = [];
  Object.keys(marks).forEach((k) => delete marks[k]);
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reset();
      emitProgress();
      lastAction.value = null;
    }
  }
);

// —— 最近一次操作反馈 ——
const lastAction = ref<{ name: string; status: AttendanceStatus } | null>(null);
let actionTimer = 0;
function flash(name: string, status: AttendanceStatus): void {
  lastAction.value = { name, status };
  window.clearTimeout(actionTimer);
  actionTimer = window.setTimeout(() => (lastAction.value = null), 700);
}
onBeforeUnmount(() => window.clearTimeout(actionTimer));

function commit(status: AttendanceStatus): void {
  const student = currentStudent.value;
  if (!student) return;
  marks[student.id] = status;
  history.value.push({ student, status });
  queue.value.shift();
  flash(student.name, status);
  emitProgress();
  if (queue.value.length === 0) finish();
}

function undo(): void {
  const last = history.value.pop();
  if (!last) return;
  delete marks[last.student.id];
  queue.value.unshift(last.student);
  emitProgress();
}

function finish(): void {
  const results = props.students
    .filter((s) => marks[s.id] !== undefined)
    .map((s) => ({ student: s, status: marks[s.id] as AttendanceStatus }));
  emit('complete', results);
  emit('update:modelValue', false);
}

function cancel(): void {
  emit('update:modelValue', false);
}

// —— 滚轮 / 滚动触发 ——
let lastCommit = 0;
function onWheel(e: WheelEvent): void {
  e.preventDefault();
  const now = Date.now();
  if (now - lastCommit < 110) return;
  lastCommit = now;
  if (e.deltaY < 0) commit('present');
  else if (e.deltaY > 0) commit('absent');
}

// —— 指针拖拽（统一鼠标 / 触摸）——
let dragging = false;
let dragStartY = 0;
const DRAG_THRESHOLD = 26;

function onPointerDown(e: PointerEvent): void {
  dragging = true;
  dragStartY = e.clientY;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
}
function onPointerMove(e: PointerEvent): void {
  if (!dragging) return;
  const dy = e.clientY - dragStartY;
  if (dy < -DRAG_THRESHOLD) {
    commit('present');
    dragStartY = e.clientY;
  } else if (dy > DRAG_THRESHOLD) {
    commit('absent');
    dragStartY = e.clientY;
  }
}
function onPointerUp(): void {
  dragging = false;
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="92%"
    :style="{ maxWidth: '440px' }"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    align-center
    @update:model-value="cancel"
  >
    <!-- 顶部进度 -->
    <div class="mb-4 text-center">
      <p class="text-sm text-text-sub">
        已滚 <span class="text-lg font-bold text-primary">{{ done }}</span> / {{ total }} 人
      </p>
      <el-progress
        class="mt-3"
        :percentage="total ? Math.round((done / total) * 100) : 0"
        :stroke-width="8"
        :show-text="false"
        color="#409EFF"
      />
      <p class="mt-2 text-xs text-text-sub">
        已到 <span class="font-semibold text-success">{{ presentCount }}</span> ·
        未到 <span class="font-semibold text-danger">{{ absentCount }}</span>
      </p>
    </div>

    <!-- 滚轮区 -->
    <div
      class="relative mx-auto select-none overflow-hidden rounded-xl"
      style="
        height: 592px;
        max-width: 360px;
        border: 1px solid var(--color-border);
        touch-action: none;
      "
      @wheel.prevent="onWheel"
      @pointerdown="onPointerDown"
      @pointermove="onPointerMove"
      @pointerup="onPointerUp"
      @pointercancel="onPointerUp"
    >
      <!-- 顶部「已到」线 -->
      <div
        class="absolute inset-x-0 top-0 z-20 flex items-center justify-center gap-1 py-1 text-xs font-semibold text-success"
        style="background: var(--color-bg); border-bottom: 1px solid var(--color-success)"
      >
        <el-icon><Top /></el-icon> 向上滚 = 已到
      </div>

      <!-- 名字列表 -->
      <div :key="done" class="roll-list pt-8 pb-8">
        <div
          v-for="(s, i) in visible"
          :key="s.id"
          class="flex items-center justify-between px-4"
          style="height: 44px; border-bottom: 1px solid var(--color-border)"
          :class="i === 0 ? 'current-row' : ''"
        >
          <div class="min-w-0">
            <PinyinName
              :name="s.name || ''"
              class="text-base font-bold"
              :class="i === 0 ? 'text-primary' : 'text-text-main'"
            />
          </div>
          <span class="ml-2 shrink-0 text-xs text-text-sub">{{ s.studentNo || '—' }}</span>
        </div>

        <div
          v-if="visible.length === 0"
          class="flex h-32 items-center justify-center text-sm text-text-sub"
        >
          已完成
        </div>

        <!-- 剩余占位 -->
        <div
          v-for="n in Math.max(0, VISIBLE_COUNT - visible.length)"
          :key="'ph-' + n"
          class="flex items-center px-4"
          style="height: 44px; border-bottom: 1px dashed var(--color-border)"
        >
          <span class="text-sm text-text-sub opacity-40">· · ·</span>
        </div>
      </div>

      <!-- 底部「未到」线 -->
      <div
        class="absolute inset-x-0 bottom-0 z-20 flex items-center justify-center gap-1 py-1 text-xs font-semibold text-danger"
        style="background: var(--color-bg); border-top: 1px solid var(--color-danger)"
      >
        <el-icon><Bottom /></el-icon> 向下滚 = 未到
      </div>

      <!-- 最近操作浮层 -->
      <Transition name="pop">
        <div
          v-if="lastAction"
          class="pointer-events-none absolute inset-0 z-30 flex items-center justify-center"
        >
          <span
            class="rounded-full px-5 py-2 text-lg font-bold text-white"
            :style="{ background: lastAction.status === 'present' ? '#67C23A' : '#F56C6C' }"
          >
            {{ lastAction.name }} · {{ lastAction.status === 'present' ? '已到' : '未到' }}
          </span>
        </div>
      </Transition>
    </div>

    <!-- 底部操作 -->
    <div class="mt-4 flex items-center justify-between">
      <el-button text :disabled="history.length === 0" @click="undo">
        <el-icon class="mr-1"><RefreshLeft /></el-icon>撤销
      </el-button>
      <el-button text type="danger" @click="finish">结束签到</el-button>
    </div>

    <p class="mt-3 text-center text-xs text-text-sub">
      向上滚动列表 = 持续已到 · 向下滚动 = 未到
    </p>
  </el-dialog>
</template>

<style scoped>
.roll-list {
  transition: all 0.22s ease;
}
.roll-list .current-row {
  background: color-mix(in srgb, var(--color-primary) 10%, transparent);
  border-left: 3px solid var(--color-primary);
}
.pop-enter-active,
.pop-leave-active {
  transition: all 0.25s ease;
}
.pop-enter-from,
.pop-leave-to {
  opacity: 0;
  transform: scale(0.85);
}
</style>