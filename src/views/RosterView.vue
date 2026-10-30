<script setup lang="ts">
import { computed, ref } from 'vue';
import type { Student } from '@/types';
import { useRosterStore } from '@/stores/roster';
import AppHeader from '@/components/common/AppHeader.vue';
import RosterTable from '@/components/roster/RosterTable.vue';
import StudentFormDialog from '@/components/roster/StudentFormDialog.vue';
import RosterImport from '@/components/roster/RosterImport.vue';
import { exportRosterToExcel } from '@/utils/export';
import type { ImportedStudent } from '@/utils/import';
import { Plus, Search, Upload, Download } from '@element-plus/icons-vue';

const roster = useRosterStore();

const searchQuery = ref('');
const formVisible = ref(false);
const importVisible = ref(false);
const editingStudent = ref<Student | null>(null);

const filteredStudents = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  if (!q) return roster.students;
  return roster.students.filter(
    (s) => s.name.toLowerCase().includes(q) || s.studentNo.toLowerCase().includes(q)
  );
});

function openAdd(): void {
  editingStudent.value = null;
  formVisible.value = true;
}

function openEdit(student: Student): void {
  editingStudent.value = student;
  formVisible.value = true;
}

function handleSave(payload: { name: string; studentNo: string }): void {
  if (editingStudent.value) {
    roster.updateStudent(editingStudent.value.id, payload);
    ElMessage.success('已更新人员信息');
  } else {
    roster.addStudent(payload.name, payload.studentNo);
    ElMessage.success('已添加人员');
  }
}

async function handleDelete(student: Student): Promise<void> {
  try {
    await ElMessageBox.confirm(`确定删除「${student.name}」吗？`, '删除确认', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    });
  } catch {
    return;
  }
  roster.removeStudent(student.id);
  ElMessage.success('已删除');
}

function handleImported(items: ImportedStudent[]): void {
  const { added, skipped } = roster.bulkAdd(items);
  ElMessage.success(`导入完成：新增 ${added} 人${skipped ? `，跳过 ${skipped} 人（重复）` : ''}`);
}

function handleExport(): void {
  if (roster.students.length === 0) {
    ElMessage.warning('名单为空，无法导出');
    return;
  }
  exportRosterToExcel(roster.students);
  ElMessage.success('名单已导出');
}
</script>

<template>
  <div>
    <AppHeader title="人员名单" />

    <main class="mx-auto max-w-5xl px-4 py-6 md:px-8 md:py-8">
      <!-- 工具栏 -->
      <div class="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <el-input
          v-model="searchQuery"
          placeholder="按姓名 / 学号搜索"
          clearable
          class="md:max-w-xs"
          :prefix-icon="Search"
        />
        <div class="flex flex-wrap gap-2">
          <el-button type="primary" :icon="Plus" @click="openAdd">添加人员</el-button>
          <el-button :icon="Upload" @click="importVisible = true">批量导入</el-button>
          <el-button :icon="Download" @click="handleExport">导出名单</el-button>
        </div>
      </div>

      <!-- 列表 -->
      <RosterTable
        :students="filteredStudents"
        @edit="openEdit"
        @delete="handleDelete"
      />

      <!-- 底部统计 -->
      <div class="mt-5 flex items-center justify-between text-sm text-text-sub">
        <span>{{ searchQuery ? `筛选结果 ${filteredStudents.length} 人` : `共 ${roster.count} 人` }}</span>
      </div>
    </main>

    <StudentFormDialog
      v-model="formVisible"
      :student="editingStudent"
      @save="handleSave"
    />
    <RosterImport v-model="importVisible" @imported="handleImported" />
  </div>
</template>