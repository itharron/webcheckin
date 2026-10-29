<script setup lang="ts">
import type { Student } from '@/types';
import { Edit, Delete } from '@element-plus/icons-vue';

defineProps<{
  students: Student[];
}>();

const emit = defineEmits<{
  (e: 'edit', student: Student): void;
  (e: 'delete', student: Student): void;
}>();
</script>

<template>
  <!-- PC 端：表格 -->
  <div class="hidden md:block">
    <el-table :data="students" style="width: 100%" row-key="id">
      <el-table-column type="index" label="序号" width="70" align="center" />
      <el-table-column prop="name" label="姓名" min-width="140" />
      <el-table-column prop="studentNo" label="学号 / 编号" min-width="180">
        <template #default="{ row }">
          <span class="text-text-sub">{{ row.studentNo || '—' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" align="center">
        <template #default="{ row }">
          <el-button link type="primary" :icon="Edit" @click="emit('edit', row)">编辑</el-button>
          <el-button link type="danger" :icon="Delete" @click="emit('delete', row)">删除</el-button>
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无人员，点击上方「添加人员」加入" />
      </template>
    </el-table>
  </div>

  <!-- 手机端：卡片列表 -->
  <div class="flex flex-col gap-3 md:hidden">
    <TransitionGroup name="list-item">
      <div
        v-for="student in students"
        :key="student.id"
        class="app-card flex items-center justify-between px-4 py-3"
      >
        <div class="min-w-0">
          <p class="truncate text-sm font-medium text-text-main">{{ student.name }}</p>
          <p class="mt-0.5 truncate text-xs text-text-sub">{{ student.studentNo || '暂无学号' }}</p>
        </div>
        <div class="ml-3 flex shrink-0 gap-1">
          <el-button size="small" text type="primary" @click="emit('edit', student)">编辑</el-button>
          <el-button size="small" text type="danger" @click="emit('delete', student)">删除</el-button>
        </div>
      </div>
    </TransitionGroup>
    <el-empty
      v-if="students.length === 0"
      description="暂无人员，点击上方「添加人员」加入"
      :image-size="80"
    />
  </div>
</template>