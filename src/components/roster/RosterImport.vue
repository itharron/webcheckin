<script setup lang="ts">
import { ref } from 'vue';
import type { UploadFile, UploadInstance } from 'element-plus';
import { UploadFilled, Loading } from '@element-plus/icons-vue';
import { parseRosterFile, type ImportedStudent } from '@/utils/import';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'imported', items: ImportedStudent[]): void;
}>();

const fileRaw = ref<File | null>(null);
const preview = ref<ImportedStudent[]>([]);
const parsing = ref(false);
const uploadRef = ref<UploadInstance>();

function close(): void {
  emit('update:modelValue', false);
}

async function handleFileChange(uploadFile: UploadFile): Promise<void> {
  const file = uploadFile.raw;
  if (!file) return;
  parsing.value = true;
  try {
    preview.value = await parseRosterFile(file);
    fileRaw.value = file;
  } catch (err) {
    preview.value = [];
    fileRaw.value = null;
    ElMessage.error(err instanceof Error ? err.message : '文件解析失败');
    uploadRef.value?.clearFiles();
  } finally {
    parsing.value = false;
  }
}

function confirmImport(): void {
  if (preview.value.length === 0) {
    ElMessage.warning('没有可导入的数据');
    return;
  }
  emit('imported', preview.value);
  ElMessage.success(`成功导入 ${preview.value.length} 条数据`);
  reset();
  close();
}

function reset(): void {
  preview.value = [];
  fileRaw.value = null;
  uploadRef.value?.clearFiles();
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    title="批量导入名单"
    width="92%"
    :style="{ maxWidth: '480px' }"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
    @closed="reset"
  >
    <el-upload
      ref="uploadRef"
      drag
      :auto-upload="false"
      :show-file-list="false"
      accept=".xlsx,.xls,.csv"
      :on-change="handleFileChange"
    >
      <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
      <div class="el-upload__text">将文件拖到此处，或 <em>点击选择文件</em></div>
      <template #tip>
        <div class="el-upload__tip">支持 .xlsx / .xls / .csv，自动识别「姓名」「学号」列</div>
      </template>
    </el-upload>

    <div v-if="parsing" class="mt-4 flex items-center justify-center gap-2 text-sm text-text-sub">
      <el-icon class="is-loading"><Loading /></el-icon>
      正在解析文件…
    </div>

    <div v-else-if="preview.length > 0" class="mt-4">
      <p class="mb-2 text-sm text-text-sub">共解析到 <b class="text-text-main">{{ preview.length }}</b> 条数据</p>
      <div class="max-h-48 overflow-auto rounded-lg" style="border: 1px solid var(--color-border)">
        <el-table :data="preview.slice(0, 200)" size="small" max-height="200">
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="name" label="姓名" />
          <el-table-column prop="studentNo" label="学号" />
        </el-table>
      </div>
      <p v-if="preview.length > 200" class="mt-1 text-xs text-text-sub">仅预览前 200 条</p>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <el-button class="flex-1" @click="close">取消</el-button>
        <el-button class="flex-1" type="primary" :disabled="preview.length === 0" @click="confirmImport">
          确认导入
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>