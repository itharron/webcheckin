/** 学生 / 人员 */
export interface Student {
  /** 唯一 ID */
  id: string;
  /** 学号 */
  studentNo: string;
  /** 姓名 */
  name: string;
  /** 创建时间戳 */
  createdAt: number;
}

/** 签到状态 */
export type AttendanceStatus = 'present' | 'absent';

/** 签到记录 */
export interface AttendanceRecord {
  /** 唯一 ID */
  id: string;
  /** 关联学生 ID */
  studentId: string;
  /** 学号（冗余存储，防止学生被删除后记录丢失） */
  studentNo: string;
  /** 姓名（冗余存储） */
  name: string;
  /** 签到日期 YYYY-MM-DD */
  date: string;
  /** 签到具体时间 HH:mm:ss */
  time: string;
  /** 签到时间戳 */
  timestamp: number;
  /** 签到状态 */
  status: AttendanceStatus;
}

/** 一次签到会话 */
export interface RosterSession {
  /** 唯一 ID */
  id: string;
  /** 日期 YYYY-MM-DD */
  date: string;
  /** 开始时间戳 */
  startTime: number;
  /** 结束时间戳（可选） */
  endTime?: number;
  /** 总人数 */
  totalCount: number;
  /** 已到人数 */
  presentCount: number;
  /** 未到人数 */
  absentCount: number;
  /** 是否完成 */
  completed: boolean;
}

/** 日期统计结果 */
export interface DateStats {
  date: string;
  total: number;
  present: number;
  absent: number;
  /** 到勤率 0-100 */
  rate: number;
}

/** 主题类型 */
export type Theme = 'light' | 'dark';