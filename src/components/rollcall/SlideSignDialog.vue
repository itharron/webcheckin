<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import type { AttendanceStatus, Student } from '@/types';
import { RefreshLeft } from '@element-plus/icons-vue';
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

const index = ref(0);
const marks = reactive<Record<string, AttendanceStatus>>({});

const total = computed(() => props.students.length);
const currentStudent = computed<Student | undefined>(() => props.students[index.value]);
const presentCount = computed(() => Object.values(marks).filter((s) => s === 'present').length);
const absentCount = computed(() => Object.values(marks).filter((s) => s === 'absent').length);

function emitProgress(): void {
  emit('progress', {
    current: index.value,
    total: total.value,
    present: presentCount.value,
    absent: absentCount.value,
  });
}

function reset(): void {
  index.value = 0;
  Object.keys(marks).forEach((k) => delete marks[k]);
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      reset();
      emitProgress();
    }
  }
);

// —— 拖拽手势 ——
const dragging = ref(false);
const flying = ref(false);
const dx = ref(0);
const dy = ref(0);
const startX = ref(0);
const startY = ref(0);
/** 拖拽倾向：present（上滑，已到）/ absent（右滑，未到） */
const lean = ref<'' | 'present' | 'absent'>('');

const THRESHOLD = 56;

function onPointerDown(e: PointerEvent): void {
  if (dragging.value || flying.value) return;
  dragging.value = true;
  startX.value = e.clientX;
  startY.value = e.clientY;
  (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
}

function onPointerMove(e: PointerEvent): void {
  if (!dragging.value) return;
  dx.value = e.clientX - startX.value;
  dy.value = e.clientY - startY.value;
  if (dy.value < -THRESHOLD) lean.value = 'present';
  else if (dx.value > THRESHOLD) lean.value = 'absent';
  else lean.value = '';
}

function onPointerUp(): void {
  if (!dragging.value) return;
  dragging.value = false;

  let status: AttendanceStatus | null = null;
  if (dy.value < -THRESHOLD) status = 'present';
  else if (dx.value > THRESHOLD) status = 'absent';

  if (status) {
    flying.value = true;
    if (status === 'present') {
      dy.value = -560;
      dx.value = 0;
    } else {
      dx.value = 560;
      dy.value = 0;
    }
    window.setTimeout(() => {
      mark(status as AttendanceStatus);
      dx.value = 0;
      dy.value = 0;
      flying.value = false;
      lean.value = '';
    }, 240);
  } else {
    dx.value = 0;
    dy.value = 0;
    lean.value = '';
  }
}

function mark(status: AttendanceStatus): void {
  const student = currentStudent.value;
  if (!student) return;
  marks[student.id] = status;
  if (index.value < total.value - 1) {
    index.value++;
    emitProgress();
  } else {
    finish();
  }
}

/** 撤销上一张（回退并清除上一个决定） */
function undo(): void {
  if (index.value > 0) {
    const prev = props.students[index.value - 1];
    if (prev) delete marks[prev.id];
    index.value--;
    emitProgress();
  }
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

const cardStyle = computed(() => {
  const rotate = dragging.value ? dx.value / 18 : 0;
  return {
    transform: `translate(${dx.value}px, ${dy.value}px) rotate(${rotate}deg)`,
    transition: dragging.value ? 'none' : 'transform 0.24s cubic-bezier(0.22, 0.61, 0.36, 1)',
  };
});
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    width="92%"
    :style="{ maxWidth: '460px' }"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    :show-close="false"
    align-center
    @update:model-value="cancel"
  >
    <!-- 顶部进度 -->
    <div class="mb-4 text-center">
      <p class="text-sm text-text-sub">
        第 <span class="text-lg font-bold text-primary">{{ index + 1 }}</span> / {{ total }} 人
      </p>
      <el-progress
        class="mt-3"
        :percentage="total ? Math.round((index / total) * 100) : 0"
        :stroke-width="8"
        :show-text="false"
        color="#409EFF"
      />
      <p class="mt-2 text-xs text-text-sub">
        已到 <span class="font-semibold text-success">{{ presentCount }}</span> ·
        未到 <span class="font-semibold text-danger">{{ absentCount }}</span>
      </p>
    </div>

    <!-- 滑动区 -->
    <div
      class="relative mx-auto h-[340px] max-w-sm select-none overflow-hidden"
      style="touch-action: none"
    >
      <!-- 上方「已到」目标 -->
      <div
        class="absolute top-0 left-1/2 -translate-x-1/2 rounded-lg px-3 py-1 text-xs font-semibold transition"
        :class="lean === 'present' ? 'bg-success text-white' : 'bg-[var(--color-bg)] text-success'"
        :style="lean !== 'present' ? 'border: 1px solid var(--color-success)' : ''"
      >
        ↑ 已到
      </div>

      <!-- 右侧「未到」目标 -->
      <div
        class="absolute top-1/2 right-0 -translate-y-1/2 rounded-lg px-3 py-1 text-xs font-semibold transition"
        :class="lean === 'absent' ? 'bg-danger text-white' : 'bg-[var(--color-bg)] text-danger'"
        :style="lean !== 'absent' ? 'border: 1px solid var(--color-danger)' : ''"
      >
        未到 →
      </div>

      <!-- 当前人员卡片（可拖动） -->
      <div
        v-if="currentStudent"
        class="absolute inset-0 flex items-center justify-center"
        @pointerdown="onPointerDown"
        @pointermove="onPointerMove"
        @pointerup="onPointerUp"
        @pointercancel="onPointerUp"
      >
        <div
          :style="cardStyle"
          class="relative flex h-[260px] w-[200px] flex-col items-center justify-center overflow-hidden rounded-2xl text-white"
          style="background: linear-gradient(135deg, #409eff, #66b1ff)"
        >
          <PinyinName
            :name="currentStudent.name || ''"
            class="z-10 text-4xl font-bold tracking-wide md:text-5xl"
          />
          <p class="z-10 mt-3 text-sm opacity-90 md:text-base">
            {{ currentStudent.studentNo || '暂无学号' }}
          </p>

          <!-- 拖拽倾向覆盖层 -->
          <div
            v-if="lean"
            class="absolute inset-0 z-20 flex items-center justify-center text-2xl font-bold text-white"
            :style="{ background: lean === 'present' ? 'rgba(103,194,58,0.85)' : 'rgba(245,108,108,0.85)' }"
          >
            {{ lean === 'present' ? '已到' : '未到' }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="mt-4 flex items-center justify-between">
      <el-button text :disabled="index === 0" @click="undo">
        <el-icon class="mr-1"><RefreshLeft /></el-icon>撤销
      </el-button>
      <el-button text type="danger" @click="finish">结束签到</el-button>
    </div>

    <p class="mt-3 text-center text-xs text-text-sub">上滑 = 已到 · 右滑 = 未到</p>
  </el-dialog>
</template>