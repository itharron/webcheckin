<script setup lang="ts">
import { reactive, ref, watch } from 'vue';
import type { FormInstance, FormRules } from 'element-plus';
import type { Student } from '@/types';

const props = defineProps<{
  modelValue: boolean;
  /** 传入则进入编辑模式，否则为新增 */
  student?: Student | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'save', payload: { name: string; studentNo: string }): void;
}>();

const formRef = ref<FormInstance>();
const form = reactive({
  name: '',
  studentNo: '',
});

const rules: FormRules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
};

function resetForm(): void {
  form.name = props.student?.name ?? '';
  form.studentNo = props.student?.studentNo ?? '';
}

watch(
  () => props.modelValue,
  (visible) => {
    if (visible) resetForm();
  }
);

function close(): void {
  emit('update:modelValue', false);
}

async function submit(): Promise<void> {
  if (!formRef.value) return;
  const valid = await formRef.value.validate().catch(() => false);
  if (!valid) return;
  emit('save', { name: form.name, studentNo: form.studentNo });
  close();
}
</script>

<template>
  <el-dialog
    :model-value="modelValue"
    :title="student ? '编辑人员' : '添加人员'"
    width="92%"
    :style="{ maxWidth: '420px' }"
    :close-on-click-modal="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" @submit.prevent>
      <el-form-item label="姓名" prop="name">
        <el-input v-model="form.name" placeholder="请输入姓名" maxlength="30" clearable />
      </el-form-item>
      <el-form-item label="学号 / 编号" prop="studentNo">
        <el-input v-model="form.studentNo" placeholder="选填，请输入学号或编号" maxlength="40" clearable />
      </el-form-item>
    </el-form>
    <template #footer>
      <div class="flex gap-3">
        <el-button class="flex-1" @click="close">取消</el-button>
        <el-button class="flex-1" type="primary" @click="submit">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>