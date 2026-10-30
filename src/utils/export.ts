import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import type { AttendanceRecord, Student } from '@/types';

/**
 * 导出签到记录为 Excel。
 * 列：序号、姓名、学号、事件、签到时间、状态。
 */
export function exportRecordsToExcel(records: AttendanceRecord[], date: string, event?: string): void {
  const rows = [...records]
    .sort((a, b) => b.timestamp - a.timestamp)
    .map((r, i) => ({
      序号: i + 1,
      姓名: r.name,
      学号: r.studentNo,
      事件: r.event ?? '',
      签到时间: `${r.date} ${r.time}`,
      状态: r.status === 'present' ? '已到' : '未到',
    }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }, { wch: 12 }, { wch: 22 }, { wch: 8 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, worksheet, '签到记录');
  XLSX.writeFile(book, `签到记录_${date}${event ? '_' + event : ''}.xlsx`);
}

/** 导出人员名单为 Excel */
export function exportRosterToExcel(students: Student[]): void {
  const rows = [...students]
    .sort((a, b) => a.createdAt - b.createdAt)
    .map((s, i) => ({
      序号: i + 1,
      姓名: s.name,
      学号: s.studentNo,
    }));
  const worksheet = XLSX.utils.json_to_sheet(rows);
  worksheet['!cols'] = [{ wch: 6 }, { wch: 12 }, { wch: 16 }];
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, worksheet, '人员名单');
  XLSX.writeFile(book, `人员名单_${dayjs().format('YYYY-MM-DD')}.xlsx`);
}

/** 导出记录为 CSV（浏览器端触发下载） */
export function exportRecordsToCsv(records: AttendanceRecord[], date: string, event?: string): void {
  const sorted = [...records].sort((a, b) => b.timestamp - a.timestamp);
  const header = ['序号', '姓名', '学号', '事件', '签到时间', '状态'];
  const body = sorted.map((r, i) =>
    [i + 1, r.name, r.studentNo, r.event ?? '', `${r.date} ${r.time}`, r.status === 'present' ? '已到' : '未到'].join(',')
  );
  const csv = '\uFEFF' + [header.join(','), ...body].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `签到记录_${date}${event ? '_' + event : ''}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}