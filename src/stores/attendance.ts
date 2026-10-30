import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import dayjs from 'dayjs';
import type { AttendanceRecord, AttendanceStatus, DateStats, RosterSession } from '@/types';
import { uuid } from '@/utils/id';
import * as db from '@/utils/storage';

export const useAttendanceStore = defineStore('attendance', () => {
  const records = ref<AttendanceRecord[]>([]);
  const sessions = ref<RosterSession[]>([]);
  const loaded = ref(false);

  /** 从 IndexedDB 加载全部记录与会话到内存 */
  async function init(): Promise<void> {
    if (loaded.value) return;
    try {
      const [allRecords, allSessions] = await Promise.all([
        db.getAllRecords(),
        db.getAllSessions(),
      ]);
      // 兼容旧数据：补齐缺失的 event 字段（旧版按天签到，无事件概念）
      records.value = allRecords.map((r) => ({ ...r, event: r.event ?? '早自习' }));
      sessions.value = allSessions;
      loaded.value = true;
    } catch (err) {
      console.error('加载签到数据失败', err);
    }
  }

  /** 获取某日期（可选指定事件）的记录（按时间倒序） */
  function recordsForDate(date: string, event?: string): AttendanceRecord[] {
    return records.value
      .filter((r) => r.date === date && (event === undefined || r.event === event))
      .slice()
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /** 获取某学生在某日期某事件的记录 */
  function recordForStudent(studentId: string, date: string, event: string): AttendanceRecord | undefined {
    return records.value.find((r) => r.studentId === studentId && r.date === date && r.event === event);
  }

  /** 计算某日期统计（结合名单总人数） */
  const todayStats = computed<DateStats>(() => {
    const date = dayjs().format('YYYY-MM-DD');
    return statsForDate(date);
  });

  function statsForDate(date: string, rosterTotal?: number, event?: string): DateStats {
    const list = recordsForDate(date, event);
    const present = list.filter((r) => r.status === 'present').length;
    const absent = list.filter((r) => r.status === 'absent').length;
    const total = rosterTotal !== undefined ? rosterTotal : list.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;
    return { date, total, present, absent, rate };
  }

  /** 新增一条签到记录（同时落到 IndexedDB 与内存） */
  async function addRecord(input: {
    studentId: string;
    studentNo: string;
    name: string;
    status: AttendanceStatus;
    event: string;
  }): Promise<AttendanceRecord> {
    const now = dayjs();
    const record: AttendanceRecord = {
      id: uuid(),
      studentId: input.studentId,
      studentNo: input.studentNo,
      name: input.name,
      date: now.format('YYYY-MM-DD'),
      event: input.event,
      time: now.format('HH:mm:ss'),
      timestamp: now.valueOf(),
      status: input.status,
    };
    const existing = records.value.find(
      (r) => r.studentId === input.studentId && r.date === record.date && r.event === record.event
    );
    if (existing) {
      // 覆盖已有记录
      await db.putRecord({ ...record, id: existing.id });
      const idx = records.value.findIndex((r) => r.id === existing.id);
      if (idx >= 0) records.value[idx] = { ...record, id: existing.id };
    } else {
      await db.putRecord(record);
      records.value.push(record);
    }
    return record;
  }

  /** 修改记录状态 */
  async function updateStatus(id: string, status: AttendanceStatus): Promise<void> {
    const target = records.value.find((r) => r.id === id);
    if (!target) return;
    const updated = { ...target, status };
    await db.putRecord(updated);
    const idx = records.value.findIndex((r) => r.id === id);
    if (idx >= 0) records.value[idx] = updated;
  }

  /** 删除一条记录 */
  async function removeRecord(id: string): Promise<void> {
    await db.deleteRecord(id);
    records.value = records.value.filter((r) => r.id !== id);
  }

  /** 有签到记录的日期列表（倒序） */
  const recordDates = computed<string[]>(() => {
    return [...new Set(records.value.map((r) => r.date))].sort().reverse();
  });

  /** 创建签到会话 */
  async function createSession(input: {
    date: string;
    totalCount: number;
    presentCount: number;
    absentCount: number;
    completed: boolean;
  }): Promise<RosterSession> {
    const session: RosterSession = {
      id: uuid(),
      date: input.date,
      startTime: Date.now(),
      endTime: input.completed ? Date.now() : undefined,
      totalCount: input.totalCount,
      presentCount: input.presentCount,
      absentCount: input.absentCount,
      completed: input.completed,
    };
    await db.putSession(session);
    sessions.value.unshift(session);
    return session;
  }

  /** 最近一次会话 */
  const recentSession = computed<RosterSession | undefined>(() => sessions.value[0]);

  /** 某个日期是否已有记录 */
  function hasRecords(date: string): boolean {
    return records.value.some((r) => r.date === date);
  }

  /** 某日期下已有的签到事件名列表（去重，按记录顺序） */
  function eventsForDate(date: string): string[] {
    return [...new Set(records.value.filter((r) => r.date === date).map((r) => r.event))];
  }

  return {
    records,
    sessions,
    loaded,
    init,
    recordsForDate,
    recordForStudent,
    todayStats,
    statsForDate,
    addRecord,
    updateStatus,
    removeRecord,
    recordDates,
    eventsForDate,
    createSession,
    recentSession,
    hasRecords,
  };
});