<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
import type { AttendanceStatus, Student } from '@/types';
import { Check, Close, ArrowLeft, ArrowRight } from '@element-plus/icons-vue';

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
/** 用于触发切换动画的 key */
const currentKey = computed(() => props.students[index.value]?.id ?? 'none');

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

/** 记录当前学生并前进 */
function mark(status: AttendanceStatus): void {
  const student = currentStudent.value;
  if (!student) return;
  marks[student.id] = status;
  advance();
}

function advance(): void {
  if (index.value < total.value - 1) {
    index.value++;
  } else {
    finish();
    return;
  }
  emitProgress();
}

function prev(): void {
  if (index.value > 0) {
    index.value--;
    emitProgress();
  }
}

function skip(): void {
  advance();
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

/** 键盘快捷键 */
function onKeydown(e: KeyboardEvent): void {
  if (!props.modelValue) return;
  if (e.repeat) return;
  switch (e.key) {
    case 'ArrowRight':
    case 'Enter':
    case 'j':
    case 'J':
      e.preventDefault();
      mark('present');
      break;
    case 'ArrowLeft':
    case 'k':
    case 'K':
      e.preventDefault();
      mark('absent');
      break;
    case 'ArrowUp':
      e.preventDefault();
      prev();
      break;
    default:
      break;
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown));
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown));
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
    <div class="mb-5 text-center">
      <p class="text-sm text-text-sub">
        第 <span class="text-lg font-bold text-primary">{{ index + 1 }}</span> / {{ total }} 人
      </p>
      <el-progress
        class="mt-3"
        :percentage="total ? Math.round((index / total) * 100) : 0"
        :stroke-width="8"
        :show-text="false"
        color="#4F46E5"
      />
    </div>

    <!-- 当前签到人 -->
    <div class="relative flex min-h-[160px] items-center justify-center py-4">
      <transition name="person" mode="out-in">
        <div :key="currentKey" class="text-center">
          <p class="text-4xl font-bold tracking-wide text-text-main md:text-5xl">
            {{ currentStudent?.name }}
          </p>
          <p class="mt-3 text-sm text-text-sub md:text-base">
            {{ currentStudent?.studentNo || '暂无学号' }}
          </p>
        </div>
      </transition>
    </div>

    <!-- 两个大按钮 -->
    <div class="mt-2 grid grid-cols-2 gap-3">
      <button
        class="flex h-20 flex-col items-center justify-center gap-1 rounded-xl text-white transition active:scale-95 md:h-24"
        style="background: linear-gradient(135deg, #10b981, #34d399)"
        @click="mark('absent')"
      >
        <el-icon :size="22"><Close /></el-icon>
        <span class="text-base font-semibold">未到</span>
      </button>
      <button
        class="flex h-20 flex-col items-center justify-center gap-1 rounded-xl text-white transition active:scale-95 md:h-24"
        style="background: linear-gradient(135deg, #059669, #10b981)"
        @click="mark('present')"
      >
        <el-icon :size="22"><Check /></el-icon>
        <span class="text-base font-semibold">已到</span>
      </button>
    </div>

    <!-- 底部操作 -->
    <div class="mt-4 flex items-center justify-between">
      <el-button text @click="prev">
        <el-icon class="mr-1"><ArrowLeft /></el-icon>上一位
      </el-button>
      <el-button text type="warning" @click="skip">跳过</el-button>
      <el-button text type="danger" @click="finish">结束签到</el-button>
    </div>

    <!-- 快捷键提示 -->
    <p class="mt-3 text-center text-xs text-text-sub">
      ←/K 未到 · →/Enter/J 已到 · ↑ 上一位
    </p>
  </el-dialog>
</template>

<style scoped>
/* 人名切换动画：淡入淡出 + 轻微滑动 */
.person-enter-active,
.person-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.person-enter-from {
  opacity: 0;
  transform: translateX(30px);
}
.person-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}
</style>