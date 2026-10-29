import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import type { Student } from '@/types';
import { uuid } from '@/utils/id';
import type { ImportedStudent } from '@/utils/import';

const ROSTER_KEY = 'roll-call-roster';

function loadStudents(): Student[] {
  try {
    const raw = localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Student[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export const useRosterStore = defineStore('roster', () => {
  const students = ref<Student[]>(loadStudents());

  function persist(): void {
    localStorage.setItem(ROSTER_KEY, JSON.stringify(students.value));
  }

  /** 新增学生 */
  function addStudent(name: string, studentNo: string): Student {
    const student: Student = {
      id: uuid(),
      name: name.trim(),
      studentNo: studentNo.trim(),
      createdAt: Date.now(),
    };
    students.value.push(student);
    persist();
    return student;
  }

  /** 更新学生信息 */
  function updateStudent(id: string, patch: { name?: string; studentNo?: string }): void {
    const target = students.value.find((s) => s.id === id);
    if (!target) return;
    if (patch.name !== undefined) target.name = patch.name.trim();
    if (patch.studentNo !== undefined) target.studentNo = patch.studentNo.trim();
    persist();
  }

  /** 删除学生 */
  function removeStudent(id: string): void {
    students.value = students.value.filter((s) => s.id !== id);
    persist();
  }

  /** 批量导入（自动去重：学号相同视为同一人） */
  function bulkAdd(items: ImportedStudent[]): { added: number; skipped: number } {
    let added = 0;
    let skipped = 0;
    const existingNos = new Set(students.value.map((s) => s.studentNo).filter(Boolean));
    for (const item of items) {
      if (!item.name && !item.studentNo) {
        skipped++;
        continue;
      }
      if (item.studentNo && existingNos.has(item.studentNo)) {
        skipped++;
        continue;
      }
      students.value.push({
        id: uuid(),
        name: item.name || `未命名-${added + 1}`,
        studentNo: item.studentNo || '',
        createdAt: Date.now(),
      });
      if (item.studentNo) existingNos.add(item.studentNo);
      added++;
    }
    persist();
    return { added, skipped };
  }

  const count = computed(() => students.value.length);

  return { students, count, addStudent, updateStudent, removeStudent, bulkAdd };
});